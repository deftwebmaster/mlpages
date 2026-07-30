# Northbeam

Northbeam is a polished, responsive, single-page website for a fictional premium portable-lighting company. It presents a focused four-product collection with product cards, accessible detail dialogs, comparison data, support content, and restrained brand motion.

Northbeam is a fictional company created as a brand identity, product design, web design, and front-end development portfolio project by Matt Livingston. No products are available for purchase.

## Brand Summary

- Brand: Northbeam
- Tagline: Built to see it through.
- Positioning: Dependable portable lighting for work, travel, emergencies, and changing conditions.
- Promise: Reliable output, intuitive controls, durable construction, and honest specifications.

## Product Lineup

- Northbeam One: compact utility light, $69
- Northbeam Field: high-output field light, $119
- Northbeam Arc: rechargeable headlamp, $89
- Northbeam Station: portable area light, $139

## Features

- Sticky transparent-to-solid header
- Accessible mobile navigation with Escape close and focus trapping
- Product-led hero section using the supplied brand imagery
- Four responsive product cards
- Native product detail dialogs
- Demo add-to-kit notification with clear no-purchase messaging
- Product comparison table with optional column highlighting
- Brand principles, technical platform, warranty, support, and final CTA sections
- Custom branded 404 page
- Scroll reveal effects, scroll-to-top control, and reduced-motion support

## Technology Used

- Semantic HTML5
- Modern CSS with custom properties
- Vanilla JavaScript
- Native browser APIs
- Optimized image delivery with WebP and PNG fallbacks
- Self-hosted webfonts (no third-party font requests)
- No framework, build step, analytics, backend, cart, checkout, or third-party service

## Typography

- Space Grotesk (headings) and IBM Plex Mono (labels, specs, comparison table) &mdash; SIL Open Font License 1.1
- Inter (body copy, UI) &mdash; SIL Open Font License 1.1
- All font files are self-hosted under `assets/fonts/` and loaded via local `@font-face` declarations, so the site makes no requests to Google Fonts or any other third party.

## File Structure

```text
/
|-- index.html
|-- 404.html
|-- favicon.ico
|-- site.webmanifest
|-- README.md
|-- assets/
|   |-- css/
|   |   `-- styles.css
|   |-- js/
|   |   `-- main.js
|   |-- fonts/
|   |   |-- inter-variable.woff2
|   |   |-- space-grotesk-700.woff2
|   |   |-- ibm-plex-mono-400.woff2
|   |   |-- ibm-plex-mono-500.woff2
|   |   |-- ibm-plex-mono-600.woff2
|   |   `-- ibm-plex-mono-700.woff2
|   |-- images/
|   |   |-- northbeam-logo.png
|   |   |-- northbeam-logo.webp
|   |   |-- northbeam-hero.png
|   |   |-- northbeam-hero.webp
|   |   |-- northbeam-one.png
|   |   |-- northbeam-one.webp
|   |   |-- northbeam-field.png
|   |   |-- northbeam-field.webp
|   |   |-- northbeam-arc.png
|   |   |-- northbeam-arc.webp
|   |   |-- northbeam-station.png
|   |   `-- northbeam-station.webp
|   `-- icons/
|       |-- favicon-192.png
|       `-- favicon-512.png
`-- images/
    `-- original supplied PNG files
```

## Local Usage

Open `index.html` directly in a browser, or serve the folder with a static server:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

## GitHub Pages Deployment

1. Push this folder to a GitHub repository.
2. In repository settings, open Pages.
3. Select the branch that contains `index.html`.
4. Set the source folder to the repository root.
5. Save and wait for GitHub Pages to publish the site.

No build command is required.

## Accessibility Notes

- Includes a skip link, semantic landmarks, visible focus states, and descriptive alt text.
- Mobile navigation and product dialogs support keyboard operation and Escape closing.
- Dialog interactions restore focus to the triggering control.
- Product specifications and comparison data are real text, not images.
- Motion is reduced for users who prefer reduced motion.

## Performance Notes

- PNG originals are preserved.
- WebP versions are generated for hero, logo, and product imagery.
- Below-the-fold product images use lazy loading.
- Image dimensions are declared to reduce layout shift.
- There are no third-party scripts, analytics, or external font requests.

## Image Asset List

- `assets/images/northbeam-logo.png`
- `assets/images/northbeam-hero.png`
- `assets/images/northbeam-one.png`
- `assets/images/northbeam-field.png`
- `assets/images/northbeam-arc.png`
- `assets/images/northbeam-station.png`
- Matching `.webp` versions for each image

## Screenshot Placeholders

- Desktop homepage screenshot
- Mobile homepage screenshot
- Product dialog screenshot
- Comparison section screenshot
