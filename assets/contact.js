const form = document.querySelector('.contact-form');

if (form) {
  const status = form.querySelector('.form-status');
  const submitButton = form.querySelector('[type="submit"]');
  const turnstileContainer = form.querySelector('.turnstile-widget');
  const startedAt = form.querySelector('[name="startedAt"]');
  let widgetId;

  startedAt.value = String(Date.now());

  function showStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
    status.hidden = false;
  }

  function loadTurnstile(sitekey) {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => {
      widgetId = window.turnstile.render(turnstileContainer, {
        sitekey,
        action: 'contact',
        theme: 'light',
      });
      submitButton.disabled = false;
    });
    script.addEventListener('error', () => showStatus('The security check could not load. Please refresh the page.', 'error'));
    document.head.append(script);
  }

  fetch('/api/contact/config', { headers: { accept: 'application/json' } })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Configuration unavailable')))
    .then((config) => loadTurnstile(config.turnstileSiteKey))
    .catch(() => showStatus('The contact form is temporarily unavailable. Please try again later.', 'error'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const token = widgetId !== undefined ? window.turnstile.getResponse(widgetId) : '';
    if (!token) {
      showStatus('Please complete the security check.', 'error');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    status.hidden = true;
    const fields = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          name: fields.get('name'),
          email: fields.get('email'),
          message: fields.get('message'),
          website: fields.get('website'),
          startedAt: fields.get('startedAt'),
          turnstileToken: token,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Your message could not be sent. Please try again.');

      form.reset();
      startedAt.value = String(Date.now());
      window.turnstile.reset(widgetId);
      showStatus(result.message, 'success');
    } catch (error) {
      window.turnstile?.reset(widgetId);
      showStatus(error.message || 'Your message could not be sent. Please try again.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
    }
  });
}
