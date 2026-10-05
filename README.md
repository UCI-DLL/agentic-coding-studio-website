# Agentic Coding Studio


Public website for Agentic Coding Studio, a research project led by the UCI Digital Learning Lab.



## Preview locally

The site is dependency-free static HTML, CSS, and JavaScript. From the repository root, run:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. All six pages are plain HTML and can be deployed to a static host such as Cloudflare Pages without a build step.

## Structure

- `index.html` — Home
- `about.html` — Project purpose and rationale
- `platform.html` — Learning environment and planned educational design
- `research.html` — Research areas, foundations, methods, and planned implementation
- `people.html` — Project leadership and advisory board
- `contact.html` — Contact page with collaboration pathways and an explicit placeholder for verified contact details
- `assets/styles.css` — Shared responsive visual system
- `assets/site.js` — Mobile navigation and header behavior

## Visual system

- Primary headings and emphasized interface text use Montserrat Bold.
- Secondary labels and navigation use Montserrat Regular.
- Paragraphs and other body copy use Open Sans.
- The core palette is UCI Blue (`#255799`), Darkest Blue (`#002244`), UCI Gold (`#fecc07`), Green (`#3f9c35`), and Lime Green (`#7ab800`).
- Shared responsive page gutters and section spacing are defined as custom properties in `assets/styles.css` so every page maintains comfortable margins at desktop, tablet, and mobile widths.

## Information still needed

- Approved project and UCI Digital Learning Lab logos or brand guidance
- Approved public contact email address or contact-form destination
- Approved institutional and project URLs
- A decision about whether team photography or project imagery should be added
- Cloudflare account/project details and the preferred production domain

## Contact form deployment

The contact form posts JSON to `/api/contact`, which is handled by `worker/index.mjs`. The Worker validates the fields, rejects cross-origin and oversized requests, verifies Cloudflare Turnstile, and sends the inquiry through a Cloudflare Email Service binding. A honeypot and minimum completion time provide additional bot filtering.

### One-time Cloudflare setup

1. Add the site to your Cloudflare account and onboard a sender domain in **Compute > Email Service**. Complete the DNS records Cloudflare provides.
2. In **Email Service > Email Routing**, add and verify the inbox that should receive inquiries.
3. In **Turnstile**, create a managed widget named `Agentic Coding Studio contact`, add the production hostname, and copy its site key and secret key.
4. Authenticate Wrangler with `npx wrangler login`.
5. Add the four Worker secrets (values are prompted and are not committed):

   ```bash
   npx wrangler secret put CONTACT_TO
   npx wrangler secret put CONTACT_FROM
   npx wrangler secret put TURNSTILE_SITE_KEY
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

   `CONTACT_TO` must be the verified destination inbox. `CONTACT_FROM` must use the sender domain onboarded to Cloudflare Email Service (for example, `contact@example.org`). Use the public Turnstile site key for `TURNSTILE_SITE_KEY` and its private secret for `TURNSTILE_SECRET_KEY`.

The `CONTACT_EMAIL` send-email binding is declared in `wrangler.jsonc`; no third-party email provider or API key is required. For tighter production permissions, add `destination_address` and `allowed_sender_addresses` to that binding after the two addresses are finalized.

### Deploy and test

Deploy the Worker and static assets together:

```bash
npx wrangler deploy
```

Open the deployed `/contact.html`, complete Turnstile, submit a test message, confirm the success notice appears, and verify that the message arrives at `CONTACT_TO`. In Cloudflare, inspect **Workers & Pages > agentic-coding-studio-website > Logs** if delivery fails.

For local UI testing, use Cloudflare's documented Turnstile test site key and secret. Create `.dev.vars` (it is excluded by this repository's `.gitignore`) containing `CONTACT_TO`, `CONTACT_FROM`, `TURNSTILE_SITE_KEY`, and `TURNSTILE_SECRET_KEY`, then run `npx wrangler dev`. The Email Service binding may require remote development to perform real delivery; use a verified test inbox and never use production secrets in a committed file.
