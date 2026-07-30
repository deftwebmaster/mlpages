# Sterling Kane

Sterling Kane is a complete static website for a fictional boutique Dallas business-litigation firm. It was built as a brand identity, web design, and front-end development portfolio project.

Sterling Kane is a fictional law firm created as a branding, web design, and front-end development portfolio project by Matt Livingston. It does not provide legal services or legal advice.

## Brand Summary

- Firm: Sterling Kane
- Descriptor: Business Litigation & Strategic Counsel
- Tagline: See the conflict clearly.
- Positioning: Strategic counsel when business becomes conflict.
- Personality: controlled, perceptive, strategic, direct, discreet, and commercially sophisticated.

## Features

- Responsive homepage with premium editorial hero
- Practice-area index plus five detailed practice pages
- Attorneys index plus five fictional attorney profiles
- Our Approach, Insights, Contact, Disclaimer, Privacy, and 404 pages
- Sticky desktop navigation and accessible mobile menu
- Static insight filters with accessible state updates
- Demonstration-only contact form with local validation
- Flat SVG monogram and wordmark system
- Supplied logo reference and WebP conversion
- Favicon and web manifest
- SEO and Open Graph metadata
- robots.txt and an auto-generated sitemap.xml
- Readable global fictional-project disclaimers

## Technology

- Semantic HTML5
- Modern CSS with custom properties
- Vanilla JavaScript
- Native browser APIs
- Local static assets
- No framework, build step, database, analytics, authentication, or external form service

## File Structure

```text
/
|-- index.html
|-- practice-areas.html
|-- attorneys.html
|-- approach.html
|-- insights.html
|-- contact.html
|-- disclaimer.html
|-- privacy.html
|-- 404.html
|-- favicon.ico
|-- site.webmanifest
|-- robots.txt
|-- sitemap.xml
|-- README.md
|-- practice-areas/
|-- attorneys/
|-- assets/
|   |-- css/styles.css
|   |-- js/main.js
|   `-- images/
`-- tools/generate-site.mjs
```

## Local Development

Open `index.html` directly in a browser, or run a basic static server from the project root:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

The site is fully static and works without a backend.

## GitHub Pages Deployment

1. Commit the project files.
2. Push the repository to GitHub.
3. In repository settings, enable GitHub Pages from the selected branch root.
4. The site should serve directly because all pages are static HTML, CSS, JavaScript, and local assets.

## Accessibility Notes

- Includes skip link, semantic landmarks, form labels, visible focus states, and keyboard-operable navigation.
- Mobile menu updates `aria-expanded`, supports Escape-to-close, and traps focus while open.
- Insight filters use real buttons and update `aria-pressed`.
- Motion is reduced when `prefers-reduced-motion` is enabled.

## Performance Notes

- No third-party scripts, analytics, widgets, or remote fonts are installed.
- Decorative imagery is local and lightweight.
- JavaScript is deferred and guards against missing elements.
- Below-the-fold visuals are CSS/SVG-based to avoid layout shifts.

## Asset Information

- `assets/images/sterling-kane-logo.png` is the supplied logo reference.
- `assets/images/sterling-kane-logo.webp` is an optimized local WebP conversion.
- `assets/images/sterling-kane-hero.webp` is an AI-generated fictional editorial hero image created for this project.
- `assets/images/sterling-kane-og.jpg` is a 1200x630 social-share crop of the hero image, used for Open Graph and Twitter card previews on every page.
- `assets/images/attorneys/*.webp` are AI-generated fictional attorney portraits created for portfolio demonstration.
- `assets/images/sterling-kane-monogram.svg` and `assets/images/sterling-kane-wordmark.svg` provide crisp flat logo variants for web use.
- Abstract WebP assets are fictional visual textures, not depictions of a real office or clients.

## Legal Content Disclaimer

All attorneys, office details, article summaries, practice descriptions, and representative matter types are fictional portfolio content. The contact form does not transmit, store, or send information. Nothing on the website is legal advice, and no attorney-client relationship is created.

## Screenshot Placeholders

- Homepage desktop
- Homepage mobile
- Practice areas
- Attorney profile
- Contact form
