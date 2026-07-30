# Cornerstone Heating & Air

Cornerstone Heating & Air is a polished fictional HVAC company website created as a branding, UX, and front-end development portfolio project for Matt Livingston.

## Fictional-company disclosure

Cornerstone Heating & Air is a fictional company created by Matt Livingston as a branding, UX, and web-development portfolio project. It does not provide real HVAC services. All testimonials, pricing examples, staff, addresses, certifications, service claims, and reviews are fictional.

## Features

- Mobile-first responsive website
- GitHub Pages-compatible directory structure
- Homepage conversion flow with hero, service cards, trust strip, reviews, service-area checker, and final CTA
- Dedicated service pages for AC repair, heating repair, installation, maintenance, indoor air quality, and commercial HVAC
- Comfort Plan, About, Reviews, Service Area, Financing, Careers, Contact, Privacy, Terms, Accessibility, and 404 pages
- Accessible mobile navigation, FAQ accordions, modal dialog, local form validation, ZIP checker, symptom guide, cost guide, and review filters
- Clear fictional disclosure across metadata, footer, forms, reviews, financing, and README

## Technology stack

- Semantic HTML
- Modern CSS with custom properties
- Vanilla JavaScript modules
- No runtime server, database, authentication, external APIs, or paid services

## Directory structure

```text
/
├── index.html
├── services/
├── comfort-plan/
├── about/
├── service-area/
├── financing/
├── reviews/
├── careers/
├── contact/
├── privacy/
├── terms/
├── accessibility/
├── 404.html
├── assets/
│   ├── css/
│   ├── js/
│   ├── images/
│   ├── icons/
│   └── fonts/
└── scripts/
```

## Local development

Open `index.html` directly in a browser, or run a simple static server from the project root:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

## GitHub Pages deployment

1. Push this folder to a GitHub repository.
2. In repository settings, enable GitHub Pages.
3. Choose the branch and root folder that contain `index.html`.
4. Keep links relative so subdirectory pages work under a project URL.

## Image replacement

The current hero asset lives at `assets/images/hero-technician.jpg`. Replace it with optimized WebP or AVIF production photography when available. Keep width, height, alt text, and responsive CSS updated.

## Form integration notes

Forms validate locally and intentionally do not send or store data. Integration points are marked in page copy. A production version could connect Formspree, Netlify Forms, a CRM endpoint, or a custom backend.

## Accessibility notes

The project includes semantic heading order, keyboard-accessible navigation, visible focus states, skip link, labeled form fields, accessible accordions, reduced-motion support, and high-contrast text combinations.

## Performance notes

The site avoids large dependencies, autoplay media, external APIs, and animation libraries. Optimize final imagery with responsive sizes and modern formats before production launch.

## Customization guide

- Update colors, spacing, radius, shadows, and typography in `assets/css/styles.css`.
- Update shared page content in `scripts/generate-site.mjs`, then run `node scripts/generate-site.mjs`.
- Replace the placeholder logo markup in generated headers and footers with a final asset when available.
- Update fictional content carefully if adapting the project for another portfolio case study.

## License

Portfolio demonstration content. Confirm usage rights for any replacement photography, icons, fonts, or production assets before publishing.
