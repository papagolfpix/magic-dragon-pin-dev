MAGIC DRAGON PIN v0.10.32 DEV — SUNDAY IMPORT INTEGRITY

Built from the proven v0.10.31 DEV stable checkpoint.

WHAT THIS RELEASE DOES
1. MULTI-WEEK WORKBOOK PREFLIGHT
   The existing parser already detects multiple weekly stock blocks in one worksheet.
   v0.10.32 makes that visible before import as Week block 1/N, 2/N, etc.

2. DUPLICATE / CONFLICT CLASSIFICATION
   Each detected Sunday block is compared using:
   branch + Sunday date + old-stock date + normalized row content.
   States:
   - NEW: selected by default.
   - ALREADY IMPORTED: identical content exists; skipped by default and never creates a duplicate.
   - CONFLICT: same branch/date exists but content differs; not selected by default and requires explicit replacement confirmation.

3. SAFE REPLACEMENT
   Replacing a conflicting report deletes the previous locally archived source file rather than leaving an orphan.
   If saved invoices reference the same branch/date, the replacement warning says so explicitly.

4. SAFER REPORT DELETE
   Delete confirmation now states how many linked weekly records will be removed.
   If saved invoice data references that branch/date, a second confirmation requires typing DELETE.
   If the deleted date was the active Sunday cycle and no reports remain for that date, the active-cycle marker is cleared.

5. DEV SELF-TEST
   Added:
   - duplicate branch/date Sunday report check
   - Sunday archive ↔ weekly-record link integrity check

REUSABLE LEGO BLOCK
Sunday Import Integrity Guard:
Preflight -> Block Detection -> Fingerprint -> NEW / IDENTICAL / CONFLICT -> Explicit Direction -> Linked Cleanup -> Self-Test

IMPORTANT
No invoice calculation, profit split, delivery calculation, Parent/Variant, cloud schema or Stage 2D behavior is changed.

TEST
A. Upload a workbook containing multiple weeks on one sheet:
   confirm each week appears as a separate detected block before import.
B. Select an already-imported identical week:
   it should say Already imported and create no duplicate.
C. Upload a changed version of an existing branch/date:
   it should show Conflict and require explicit replacement.
D. Delete a non-invoiced Sunday report:
   confirm linked weekly record is also removed.
E. Run Settings -> DEV Self-Test:
   Sunday duplicate keys should PASS.
