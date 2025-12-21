# Usage Guide - Real-World Workflows

Step-by-step guides for common warehouse operations scenarios.

---

## Workflow 1: Cycle Count Reconciliation

**Scenario:** You just completed a physical count and need to reconcile it against your WMS.

### Steps

1. **Export data from WMS**
   - Export current inventory: SKU, Location, Qty, UOM, Cost
   - Save as `system_inventory.csv`

2. **Prepare physical count**
   - From cycle count sheet or scanner export
   - Columns: SKU, Location, PhysicalQty, UOM
   - Save as `physical_count.csv`

3. **Import to toolkit**
   - Click "Import CSV" → Select `system_inventory.csv` → Loads into Sheet A
   - Switch to Sheet B tab → Click "Import CSV" → Select `physical_count.csv`

4. **Run Reconciliation**
   - Click **Reconcile** module
   - Key Column: SKU
   - Sheet A Qty: qty_on_hand
   - Sheet B Qty: physical_qty
   - Cost Column: unit_cost
   - Click "Run Reconciliation"

5. **Review results**
   - **Perfect Matches**: Items with no variance
   - **Variances**: Quantity discrepancies with dollar impact
   - **Missing in Physical**: System items not counted
   - **Missing in System**: Found items not in WMS

6. **Export for action**
   - "Export Variances Only" → Discrepancy report for management
   - "Export Adjustment Upload" → Format ready for WMS import

### Expected Results

- Variances sorted by dollar impact (highest first)
- Immediate visibility into shrinkage vs found inventory
- Ready-to-upload adjustment file

---

## Workflow 2: Vendor File Validation

**Scenario:** Vendor sent an EDI file with 1,000 line items. Need to validate before importing to WMS.

### Steps

1. **Import vendor file**
   - Click "Import CSV" → Select vendor file

2. **Clean the data first**
   - Click **Data Cleaning** module
   - Enable: Trim whitespace, Collapse spaces, Uppercase (for SKUs)
   - Enable: Standardize nulls
   - Click "Clean Data"

3. **Set up validation rules**
   - Click **Data Validation** module
   - Add rule: SKU is required
   - Add rule: qty must be positive
   - Add rule: qty must be numeric
   - Add rule: unit_cost must be positive
   - Add rule: uom one of: EA,CS,PLT (if applicable)
   - Click "Run Validation"

4. **Review errors**
   - Error report shows row numbers, fields, violations
   - Sort by severity (errors vs warnings)

5. **Fix or reject**
   - If < 5 errors: Fix manually in source file
   - If > 5 errors: Send back to vendor with error report
   - Export error report: "Export CSV" from results

### Expected Results

- Clean data ready for WMS import
- Or detailed error report to send vendor
- No import failures due to bad data

---

## Workflow 3: Find Duplicate Inventory Records

**Scenario:** Suspecting duplicate SKUs in different locations are causing issues.

### Steps

1. **Import inventory export**
   - Load current WMS inventory snapshot

2. **Run duplicate detection**
   - Click **Duplicates** module
   - Primary Key: SKU
   - Secondary Key: Location (or leave blank for SKU-only)
   - Mode: Normalized (to catch "ABC-123" vs "abc-123")
   - Click "Find Duplicates"

3. **Review duplicate groups**
   - Shows count per duplicate key
   - Lists row numbers for each
   - Sample data preview

4. **Decide action**
   - If same SKU + different locations: Probably correct
   - If same SKU + same location: **Problem** - consolidate
   - Export "Duplicates Only" to investigate
   - Export "Unique Only" for clean dataset

### Expected Results

- Identified duplicate records for cleanup
- Consolidated inventory list
- Root cause analysis for duplicate creation

---

## Workflow 4: Inventory Analysis by Location/UOM

**Scenario:** Need to know: How many items have qty < 10? What's total value by location?

### Steps

1. **Import inventory**
   - Load current inventory data

2. **Count low-stock items**
   - Click **SUMIF/COUNTIF** module
   - Operation: COUNTIF
   - Condition: qty_on_hand < 10
   - Click "Calculate"
   - Result: Count of low-stock SKUs

3. **Sum value by location**
   - Operation: SUMIF
   - Condition: location starts with "A" (for A aisle)
   - Sum Column: qty_on_hand
   - Enable "Group By": location
   - Click "Calculate"
   - Result: Breakdown by location

4. **Analyze by UOM**
   - Condition: uom = "CS"
   - Sum Column: qty_on_hand
   - Group By: none
   - Result: Total cases in inventory

### Expected Results

- Reorder candidates (low stock)
- Location utilization analysis
- UOM distribution for capacity planning

---

## Workflow 5: Enrich Data with Lookups

**Scenario:** Have a list of SKUs, need to add descriptions and costs from master data.

### Steps

1. **Load SKU list**
   - Import SKU list (from replenishment report) → Sheet A
   - Import item master (SKU, Description, Cost, etc.) → Sheet B

2. **Run lookup**
   - Click **Lookup Lab** module
   - Target: Sheet A
   - Lookup Table: Sheet B
   - Key columns: Both use "sku"
   - Return Column: description
   - Click "Run Lookup"

3. **Review matches**
   - Shows which SKUs found/not found
   - "#N/A" indicates no match (check for typos)

4. **Export enriched data**
   - Click "Export with Lookup Column"
   - Now have SKUs with descriptions added

5. **Repeat for cost**
   - Return Column: unit_cost
   - Run Lookup
   - Export again

### Expected Results

- SKU list enriched with master data
- Ready for purchasing or planning
- Identified missing items in master

---

## Workflow 6: Pre-Import Quality Check

**Scenario:** About to import 5,000 line receiving into WMS. Want to prevent errors.

### Complete workflow:

1. **Clean** (remove whitespace, normalize case)
2. **Validate** (check required fields, formats, ranges)
3. **Duplicates** (find potential duplicate PO lines)
4. **SUMIF** (verify total qty matches PO header)
5. **Export** clean file for import

**Time saved:** 30 minutes of troubleshooting failed imports  
**Errors prevented:** Invalid SKUs, negative quantities, duplicate lines

---

## Tips & Best Practices

### Data Prep

- Always clean data before validation
- Use consistent column names (lowercase with underscores)
- Keep a backup of original file before cleaning

### Key Column Selection

- SKU is most common for inventory
- Use composite keys (SKU + Location) when needed
- Ensure key columns have no nulls

### Reconciliation

- System data (A) = your WMS/ERP
- Physical data (B) = cycle count or physical inventory
- Always include cost column for dollar impact
- Focus on top 10 variances by dollar impact first

### Validation

- Start with basic rules (required, numeric)
- Add domain rules (UOM one-of, SKU format)
- Use warnings for "should be" vs errors for "must be"
- Save rules in LocalStorage for reuse

### Export Strategy

- **CSV for WMS import** (most systems)
- **TSV for Excel paste** (preserves formatting)
- **Variances only** (for management reports)
- **Clean data** (for archives)

---

## Troubleshooting

### Import Issues

**Problem:** "No data found in clipboard"  
**Solution:** Copy with headers, ensure tab or comma separated

**Problem:** "Validation errors: Field mismatch"  
**Solution:** CSV has inconsistent column count - check for extra commas

**Problem:** Columns look wrong  
**Solution:** File might be TSV not CSV - parser will auto-detect

### Module Issues

**Problem:** Reconciliation says "requires two sheets"  
**Solution:** Load data into both Sheet A and Sheet B

**Problem:** Lookup returns all "#N/A"  
**Solution:** Key columns might have different formats - try case-insensitive

**Problem:** Validation shows no errors but I know there are problems  
**Solution:** Rules might not be strict enough - check rule configuration

### Performance

**Problem:** Slow with 50k+ rows  
**Solution:** This tool is optimized for < 10k rows. For larger datasets, use chunks or database tools

---

## Next Steps

- Create your own validation rule templates
- Build workflow documentation for your team
- Schedule regular cycle count reconciliations
- Use as pre-import validation for all vendor files

**Pro tip:** Keep the toolkit open during receiving and put-away. Use it to validate scanner exports before committing to WMS.
