const API_PATH = '/api/contact';
const CONFIG_PATH = '/api/contact/config';
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateSubmission(body) {
  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const message = clean(body.message);
  const turnstileToken = clean(body.turnstileToken);
  const website = clean(body.website);
  const startedAt = Number(body.startedAt);
  const age = Date.now() - startedAt;

  if (website) return { bot: true };
  if (!name || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    return { error: 'Please enter a name of 100 characters or fewer.' };
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return { error: 'Please enter a valid email address.' };
  if (message.length < 10 || message.length > 5000) return { error: 'Please enter a message between 10 and 5,000 characters.' };
  if (!turnstileToken || turnstileToken.length > 2048) return { error: 'Please complete the security check.' };
  if (!Number.isFinite(startedAt) || age < 2000 || age > 7_200_000) {
    return { error: 'This form has expired. Please refresh the page and try again.' };
  }

  return { data: { name, email, message, turnstileToken } };
}

async function verifyTurnstile(token, request, env) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP') || undefined,
    }),
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && (!result.action || result.action === 'contact');
}

function isSameOrigin(request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

async function handleContact(request, env) {
  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Method not allowed.' }, 405, { allow: 'POST' });
  }
  if (!isSameOrigin(request)) return json({ ok: false, message: 'Invalid request origin.' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ ok: false, message: 'Send the form as JSON.' }, 415);
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 12_000) return json({ ok: false, message: 'Submission is too large.' }, 413);
  if (!env.CONTACT_EMAIL || !env.CONTACT_TO || !env.CONTACT_FROM || !env.TURNSTILE_SECRET_KEY) {
    console.error('Contact Worker bindings or secrets are not configured.');
    return json({ ok: false, message: 'The contact form is temporarily unavailable.' }, 503);
  }

  let body;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 12_000) {
      return json({ ok: false, message: 'Submission is too large.' }, 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, message: 'The submission could not be read.' }, 400);
  }

  const validation = validateSubmission(body || {});
  // Silently accept honeypot submissions so bots cannot tune around it.
  if (validation.bot) return json({ ok: true, message: 'Thanks! Your message has been sent.' });
  if (validation.error) return json({ ok: false, message: validation.error }, 400);

  let verified = false;
  try {
    verified = await verifyTurnstile(validation.data.turnstileToken, request, env);
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return json({ ok: false, message: 'The security check is temporarily unavailable. Please try again.' }, 503);
  }
  if (!verified) return json({ ok: false, message: 'The security check failed. Please try again.' }, 400);

  try {
    await env.CONTACT_EMAIL.send({
      to: env.CONTACT_TO,
      from: env.CONTACT_FROM,
      replyTo: { email: validation.data.email, name: validation.data.name },
      subject: `Agentic Coding Studio inquiry from ${validation.data.name}`,
      text: `Name: ${validation.data.name}\nEmail: ${validation.data.email}\n\nMessage:\n${validation.data.message}`,
    });
  } catch (error) {
    console.error('Contact email failed', {
  code: error?.code,
  message: error?.message,
  name: error?.name,
  stack: error?.stack,
});
    return json({ ok: false, message: 'We could not send your message. Please try again later.' }, 502);
  }

  return json({ ok: true, message: 'Thanks! Your message has been sent.' });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === CONFIG_PATH && request.method === 'GET') {
      if (!env.TURNSTILE_SITE_KEY) return json({ ok: false, message: 'Security check is not configured.' }, 503);
      return json({ ok: true, turnstileSiteKey: env.TURNSTILE_SITE_KEY });
    }
    if (path === API_PATH) return handleContact(request, env);
    return json({ ok: false, message: 'Not found.' }, 404);
  },
};
