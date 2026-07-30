# Mile Marker Coffee

Mile Marker Coffee is a fictional company created as a branding, web design, and front-end development portfolio project by Matt Livingston.

## Project Overview

This repository contains a static website for Mile Marker Coffee, a fictional West Texas-inspired coffee roaster and roadside cafe located at Mile Marker 214. The site is designed to feel like a restored service-station stop with a specialty coffee program, warm regional personality, and a polished responsive front end.

## Screenshot

Add a screenshot of the finished homepage here when presenting the project in a portfolio.

## Features

- Responsive homepage, menu, coffee, story, visit, and 404 pages
- Supplied Mile Marker logo and menu artwork integrated throughout the site
- Accessible HTML recreation of the visual menu board
- Keyboard-operable mobile navigation
- Product filtering on the coffee page
- Accessible menu poster lightbox
- Demonstration contact form with client-side validation
- CSS-generated roadside, route-map, and package visuals
- Unique metadata for every page
- Fictional brand disclaimer and portfolio attribution

## Technology

- Semantic HTML5
- Modern CSS with custom properties
- Vanilla JavaScript
- Native browser APIs
- No framework, build step, database, backend, or ecommerce system

## File Structure

```text
.
|-- index.html
|-- menu.html
|-- coffee.html
|-- story.html
|-- visit.html
|-- 404.html
|-- favicon.ico
|-- site.webmanifest
|-- assets
|   |-- css
|   |   `-- styles.css
|   |-- js
|   |   `-- main.js
|   |-- icons
|   |   |-- favicon.png
|   |   |-- icon-192.png
|   |   `-- icon-512.png
|   `-- images
|       |-- mile-marker-logo.png
|       `-- mile-marker-menu.png
`-- README.md
```

## Local Usage

Open `index.html` directly in a browser, or run any simple static file server from the project root.

Example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

This project can be deployed directly to GitHub Pages:

1. Push the repository to GitHub.
2. Open repository settings.
3. Enable Pages from the main branch root.
4. Visit the generated GitHub Pages URL.

No build command is required.

## Accessibility Notes

The site includes a skip link, semantic landmarks, visible focus states, real button controls, `aria-current` navigation states, keyboard navigation handling, focus trapping for the mobile menu and lightbox, descriptive alternative text, and reduced-motion support.

## Performance Notes

The site uses two supplied PNG images, generated local icon assets, no JavaScript dependencies, no bundled framework code, lazy loading for below-the-fold images, explicit image dimensions, and CSS-based decorative visuals.

WebP versions were not generated because local image tooling for WebP conversion was unavailable during the build.

## Image Asset Credits

- `assets/images/mile-marker-logo.png`: supplied Mile Marker Coffee logo asset
- `assets/images/mile-marker-menu.png`: supplied Mile Marker Coffee menu poster asset

## Portfolio Context

Mile Marker Coffee is fictional and is intended to demonstrate brand identity implementation, responsive front-end development, accessible menu design, and polished static website production.
