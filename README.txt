MAGIC DRAGON PIN v0.10.15 DEV — CONSERVATIVE CLEANUP

Built directly from v0.10.14 DEV Supabase Stage 2C.

Purpose
- Remove only code/artifacts that can be proven redundant from static inspection.
- Do not change business logic, workflows, Supabase behavior or data formats.

Safe removals
- script0.js and script1.js: exact duplicates of the two inline scripts already contained in index.html; neither file was referenced or cached.
- Unreferenced functions:
  activeCatalogueProducts
  lineKey
  parseDateFromText
  findHeaderRow
  mapProductByName
- Unused LAMAI_NAMES constant.
- Unused reconcileExcelReport local periodStart.
- Obsolete unreferenced window aliases:
  openRecordInvoice
  showDock
  deleteRecord
  editPrice
  editProductName
- One empty CSS rule (#exportData,#importData+*{}).

Intentionally retained
- All legacy migration/compatibility helpers that are still referenced.
- Delivery editor v0.9.98 keyboard manager.
- Shared v0.10.4 app-scroll-owner keyboard-safe helper.
- Supabase connection/authentication diagnostics.
- Stage 2A / 2B / 2C reference-cloud logic and undo.
- Backup/restore compatibility.
- Current DEV service-worker cleanup diagnostic while cloud development remains active.

Validation
- JavaScript syntax check: PASS.
- Duplicate named-function check: PASS.
- Removed symbols verified absent.
- Supabase endpoint and Stage 2C markers retained.
- Delivery, Sunday, invoice, Backup & Recovery, barcode-PDF and keyboard markers retained.
- Visible version and service-worker cache bumped to v0.10.15 DEV.

Next validation
Deploy to DEV staging and perform a normal smoke test. Stage 2C mismatch/apply/undo should still be exercised only on a secondary/test device or a legitimate mismatch.
