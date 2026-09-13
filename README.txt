MAGIC DRAGON PIN v0.10.31 DEV — STABLE CANDIDATE

Built directly from the user-supplied v0.10.30 DEV THREE-ACTION KEYBOARD FIX baseline.

PURPOSE
This is a conservative consolidation/stable-candidate release. No large workflow feature is introduced.

CHANGES
- Standardized the Delivery action label to "Clear" in both Create and Edit/Suggested Delivery.
- Kept the proven three-action fixed footer: Cancel | Clear | Save.
- Kept the shared editable Delivery row component.
- Kept the Parent Product -> explicit Variant -> resolved SKU flow.
- Kept Sunday-context filtering + Show all products.
- Kept the iPhone visualViewport / keyboard focus hardening.
- Extended DEV Self-Test with a Delivery Clear-label consistency check.
- Updated internal release metadata to mark this as the stable-candidate checkpoint.

CURRENT PROVEN DEV BLOCKS
- Parent Product -> Variant -> Resolved SKU
- Shared full catalogue for BM Bangrak and Lamai
- Sunday restock context filter + Show all products
- Editable Delivery rows
- iPhone fixed viewport action footer
- Keyboard-safe focus/scroll owner handling
- Backup & Recovery
- DEV Self-Test diagnostics
- Stage 2D reference-cloud guard remains DEV-only

SMOKE TEST
1. Create Delivery: confirm footer reads Cancel | Clear | Save.
2. Edit/Suggested Delivery: confirm footer also reads Cancel | Clear | Save.
3. Add a line, edit Qty in place and verify the keyboard does not hide the active row.
4. Parent Product -> choose Variant explicitly -> Add line.
5. Suggested Sunday docket: verify context subset, then Show all products.
6. Settings -> DEV Self-Test: run and confirm no FAIL results.
7. Verify visible version reads v0.10.31 DEV.

PIN PRODUCTION
Do not copy this whole DEV build into Pin production. Continue selective backporting of only proven features.

NEXT MAJOR DEV BLOCK AFTER STABLE CHECKPOINT
Sunday import robustness:
- multiple weeks on one sheet
- duplicate-week conflict handling
- safer report deletion/removal
- cleaner new/changed-only mapping review
