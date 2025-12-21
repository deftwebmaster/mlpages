# Quick Start Guide

Get the Ops Data Toolkit running in 3 minutes.

---

## Step 1: Download PapaParse

The app needs one external library. Choose an option:

### Option A: Use CDN (Easiest)

Edit `index.html` and change line 87 from:
```html
<script src="lib/papaparse.min.js"></script>
```

To:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"></script>
```

### Option B: Download Manually

1. Visit: https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js
2. Save as `lib/papaparse.min.js`

---

## Step 2: Open in Browser

### Direct File Open
```bash
open index.html
```

Or double-click `index.html` in your file browser.

### Local Server (Recommended)

**Python:**
```bash
python3 -m http.server 8000
# Visit: http://localhost:8000
```

**Node.js (if installed):**
```bash
npx serve
```

**PHP:**
```bash
php -S localhost:8000
```

---

## Step 3: Test the App

1. **Click "Load Sample"** button
   - Loads demo inventory data into Sheet A and B

2. **Try the grid:**
   - Click column headers to sort
   - Type in search box to filter
   - Switch between Sheet A and B tabs

3. **Set a key column:**
   - Select "SKU" from the dropdown

4. **Export test:**
   - Click "Export CSV" to download
   - Click "Copy as TSV" to copy (ready to paste into Excel)

---

## What Works (Phase 1 Complete)

✅ CSV file import  
✅ Paste from clipboard  
✅ Data grid with sort/search  
✅ Two-sheet management  
✅ Export to CSV/TSV  
✅ Sample data  
✅ LocalStorage persistence  

---

## What's Coming (Phase 2)

🚧 Data cleaning module  
🚧 Validation engine  
🚧 Duplicate detector  
🚧 SUMIF/COUNTIF calculator  

---

## Troubleshooting

### "Papa is not defined"
→ PapaParse library not loaded. See Step 1 above.

### Data doesn't show after import
→ Check browser console (F12) for errors  
→ Make sure CSV has headers in first row  

### Can't paste from clipboard
→ Browser security may block clipboard access  
→ Try "Import CSV" instead  

### Nothing happens when clicking buttons
→ Check browser console (F12) for JavaScript errors  
→ Verify all files are present  

---

## Sample Data Details

**inventory_sample.csv** contains:
- 10 items with various UOMs (CS, EA, PLT)
- Planted issues:
  - Duplicate SKU (ABC-123 appears twice)
  - Missing qty (JKL-012 has blank qty)
  - Extra whitespace (DEF-456 qty has spaces)

**physical_count_sample.csv** contains:
- 6 counted items
- Reconciliation test cases:
  - Qty variance (ABC-123: 144 → 132)
  - Qty variance (GHI-789: 288 → 300)
  - Qty variance (STU-901: 72 → 68)
  - Item in physical not in system (XYZ-999)
  - Items in system not in physical (JKL-012, MNO-345)

---

## Next Steps

1. **Test with your own data:**
   - Export inventory from WMS as CSV
   - Import into the toolkit
   - Try sorting, filtering, exporting

2. **Prepare for Phase 2:**
   - Think about what validation rules you need
   - List common data cleaning tasks
   - Identify duplicate detection scenarios

3. **Give feedback:**
   - What features would be most useful?
   - What's confusing or unclear?
   - What warehouse workflows should this support?

---

## Ready to Deploy?

When Phase 2 is complete, this can be deployed to:
- **GitHub Pages** (free, easy)
- **Netlify** (free, automatic)
- **Any static hosting**

No build step needed — just upload the files.
