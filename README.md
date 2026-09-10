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
