# Ops Data Toolkit

**Professional data analysis for warehouse operations — entirely in your browser.**

A single-page web application that brings Excel-style data manipulation to operational workflows. Import CSV files, clean data, validate against rules, detect duplicates, and reconcile inventory discrepancies without sending data to any server.

---

## Features

### ✅ Phase 1 Complete (Foundation)
- **CSV Import**: Load inventory, count sheets, vendor files
- **Data Display**: Sortable, searchable grid with 10k+ row support
- **Sheet Management**: Work with two datasets simultaneously (System vs Physical)
- **Export**: Download cleaned data or copy directly to Excel
- **Privacy First**: All processing happens locally — nothing leaves your browser

### ✅ Phase 2 Complete (Core Modules)
- **Data Cleaning**: Trim whitespace, normalize case, collapse spaces, standardize nulls
- **Validation Engine**: Configurable rules for required fields, numeric ranges, patterns, length checks
- **Duplicate Detection**: Find exact and near-duplicate records with composite key support
- **SUMIF/COUNTIF**: Conditional aggregation with grouping and multiple operators

### ✅ Phase 3 Complete (Showcase Features)
- **Reconciliation**: System vs physical count with variance reporting and dollar impact ⭐
- **Lookup Lab**: VLOOKUP/XLOOKUP simulator with case-insensitive matching
- **UOM Conversion**: (Coming in Phase 4)
- **Pivot Lite**: (Coming in Phase 4)

---

## Why This Tool?

Built to demonstrate proficiency in:
- **Warehouse data operations** (cycle counts, inventory reconciliation)
- **WMS/ERP integration patterns** (data validation, cleansing, transformation)
- **Excel-compatible workflows** (formulas, conditional logic, pivot operations)
- **Operations technology** skills for warehouse tech roles

Perfect for:
- Pre-WMS import data validation
- Cycle count reconciliation
- Vendor file cleanup
- Inventory discrepancy analysis

---

## Getting Started

### Prerequisites
1. Modern web browser (Chrome, Firefox, Safari, Edge)
2. PapaParse library (see `lib/README.md` for download instructions)

### Setup
```bash
# Clone or download this repository
git clone https://github.com/yourusername/ops-data-toolkit.git
cd ops-data-toolkit

# Download PapaParse (see lib/README.md for instructions)
# Option: Use CDN by updating index.html script tag

# Open in browser
open index.html
# Or start a simple server:
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### Quick Start
1. Click **"Load Sample"** to see demo inventory data
2. Try sorting columns, searching data
3. Switch between Sheet A and Sheet B tabs
4. Select a key column (like SKU) for advanced operations
5. Export results as CSV or copy as TSV for Excel

---

## Project Structure

```
ops-data-toolkit/
├── index.html              # Main application page
├── css/
│   ├── main.css           # Global layout and theming
│   ├── grid.css           # Data table styling
│   └── modules.css        # Module-specific components
├── js/
│   ├── app.js             # Main controller
│   ├── state.js           # State management
│   ├── parser.js          # CSV parsing wrapper
│   ├── storage.js         # LocalStorage persistence
│   ├── grid.js            # Data grid renderer
│   ├── export.js          # Export utilities
│   └── modules/           # Analysis modules (Phase 2+)
│       ├── cleaning.js
│       ├── validation.js
│       ├── duplicates.js
│       ├── lookup.js
│       ├── reconcile.js
│       ├── pivot.js
│       ├── sumif.js
│       └── uom.js
├── lib/
│   └── papaparse.min.js   # CSV parser (download required)
└── samples/               # Sample data files
```

---

## Technical Details

**Built With:**
- Pure JavaScript (ES6 modules)
- CSS Grid & Flexbox layouts
- PapaParse for CSV handling
- LocalStorage for settings persistence

**Browser Compatibility:**
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (12+)
- IE11: ❌ Not supported (requires ES6)

**Performance:**
- Virtual scrolling for large datasets
- Supports 10,000+ rows
- Client-side only — no server required
- Static site compatible (GitHub Pages, Netlify, etc.)

---

## Development Roadmap

### Phase 1: Foundation ✅ COMPLETE
- [x] Project structure and build setup
- [x] CSV import and parsing
- [x] Data grid with sorting/search
- [x] Sheet management (A/B)
- [x] Export functionality
- [x] State management
- [x] LocalStorage persistence

### Phase 2: Core Modules (In Progress)
- [ ] Data cleaning module
- [ ] Validation engine with rules
- [ ] Duplicate detection
- [ ] SUMIF/COUNTIF calculator

### Phase 3: Showcase Features
- [ ] Reconciliation module (killer feature)
- [ ] Lookup simulator
- [ ] UOM conversion
- [ ] Pivot table lite

### Phase 4: Polish
- [ ] Sample data files
- [ ] Logic explanation modal
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Print-friendly reports

---

## Use Cases

### Cycle Count Reconciliation
1. Import system inventory (Sheet A)
2. Import physical count (Sheet B)
3. Run reconciliation module
4. Export variance report with dollar impact

### Vendor File Validation
1. Import vendor file
2. Set up validation rules (SKU format, qty > 0, etc.)
3. Run validation
4. Export clean file or error report

### Duplicate Detection
1. Import data with potential duplicates
2. Set key column (SKU, location, etc.)
3. Run duplicate finder
4. Review grouped results
5. Export deduplicated dataset

---

## Privacy & Security

- **No data transmission**: All processing happens in your browser
- **No cloud storage**: Data stays on your device
- **No tracking**: No analytics or telemetry
- **Open source**: Review the code yourself

Settings and rules are saved to browser LocalStorage for convenience, but actual data is never persisted.

---

## Contributing

This is a portfolio/resume project, but feedback and suggestions are welcome:

1. Open an issue for bugs or feature requests
2. Fork and submit a PR for improvements
3. Share how you're using it in ops/warehouse environments

---

## Resume Context

This project demonstrates:
- **Operations domain knowledge**: Understanding of warehouse workflows, inventory management, and reconciliation processes
- **Data manipulation skills**: Parsing, cleaning, validation, and transformation
- **Web development**: Modern JavaScript, modular architecture, responsive design
- **User experience**: Tools designed for actual warehouse/ops use cases
- **Technical communication**: Clear documentation and logic explanations

Built as part of a job search targeting **Operations Technology Technician** roles that bridge warehouse operations and technology support.

---

## License

MIT License - free to use, modify, and distribute.

---

## Contact

**Matt**  
Portfolio: [matt.st](https://matt.st)  
Location: Plano, Texas

*Looking for opportunities in warehouse operations technology, WMS support, or operations coordination roles in the DFW area.*
