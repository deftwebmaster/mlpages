# External Dependencies

This directory contains external JavaScript libraries needed for the toolkit.

## Required: PapaParse

Download PapaParse v5.4.1 (minified):

**Option 1: Direct Download**
- Visit: https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js
- Save as: `papaparse.min.js` in this directory

**Option 2: npm (if you have Node.js)**
```bash
npm install papaparse
cp node_modules/papaparse/papaparse.min.js lib/
```

**Option 3: Use CDN (update index.html)**
Replace the script tag in `index.html`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
```

The file should be approximately 45KB minified.
