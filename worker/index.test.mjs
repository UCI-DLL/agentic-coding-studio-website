import assert from 'node:assert/strict';
import test from 'node:test';

import worker, { validateSubmission } from './index.mjs';

const validBody = () => ({
  name: 'Ada Lovelace',
  email: 'ADA@example.com',
  message: 'I would like to learn more about the project.',
  turnstileToken: 'valid-token',
  website: '',
  startedAt: Date.now() - 3000,
});

test('validates and normalizes a legitimate submission', () => {
  const result = validateSubmission(validBody());
  assert.equal(result.data.name, 'Ada Lovelace');
  assert.equal(result.data.email, 'ada@example.com');
});

test('rejects invalid fields and identifies the honeypot', () => {
  assert.match(validateSubmission({ ...validBody(), email: 'invalid' }).error, /valid email/);
  assert.match(validateSubmission({ ...validBody(), message: 'short' }).error, /between 10/);
  assert.equal(validateSubmission({ ...validBody(), website: 'spam.example' }).bot, true);
});

test('contact endpoint verifies Turnstile and sends the message', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => Response.json({ success: true, action: 'contact' });

  let sent;
  const env = {
    CONTACT_EMAIL: { send: async (message) => { sent = message; } },
    CONTACT_TO: 'team@example.org',
    CONTACT_FROM: 'contact@example.org',
    TURNSTILE_SECRET_KEY: 'test-secret',
  };
  const request = new Request('https://example.org/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://example.org' },
    body: JSON.stringify(validBody()),
  });
  const response = await worker.fetch(request, env);

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(sent.to, 'team@example.org');
  assert.equal(sent.replyTo.email, 'ada@example.com');
});

test('contact endpoint rejects cross-origin requests', async () => {
  const request = new Request('https://example.org/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://attacker.example' },
    body: JSON.stringify(validBody()),
  });
  const response = await worker.fetch(request, {});
  assert.equal(response.status, 403);
});
