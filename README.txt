MAGIC DRAGON PIN v0.10.14 DEV — SUPABASE STAGE 2C CONTROLLED CLOUD REFERENCE MERGE

Purpose
- Preserves the proven GitHub Pages ↔ Supabase connection/authentication/RLS Lego block.
- Preserves Stage 2B automatic read-only cloud reference loading.
- Adds a controlled Cloud → Local reference merge with preview, explicit confirmation and one-step undo.

Stage 2C safety rules
- Cloud reference products are merged by stable product ID.
- Matching cloud products may update local reference fields; missing cloud products may be added locally.
- Cloud aliases may be merged when their target product exists.
- Local products are NEVER deleted by Stage 2C.
- Deliveries, Sunday reports, invoices, payments, stock history and other operational records are NEVER changed by Stage 2C.
- A one-step local undo snapshot of products + aliases is saved immediately before a merge.
- Upload Local Reference Snapshot remains manual and DEV-only.

Validation sequence
1. Deploy this ZIP to the DEV GitHub Pages site and confirm v0.10.14 DEV is visible.
2. Open Settings → DEV Cloud Connection.
3. Confirm secure connection and automatic cloud reference load.
4. Tap Preview Cloud → Local. On the currently matching test device, expected result is “no changes are required”.
5. Do NOT force a mismatch on the operational phone merely to test apply/undo. The controlled merge can be exercised later on a second/test device or after a legitimate reference-data difference exists.

Supabase
- No new SQL is required if SUPABASE-STAGE2A-SETUP.sql was already run successfully.
- Reuses md_reference_products, md_reference_aliases and md_reference_settings with the existing authenticated RLS policies.

v0.10.14 DEV
