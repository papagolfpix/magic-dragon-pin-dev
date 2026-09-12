MAGIC DRAGON PIN v0.10.13 DEV — SUPABASE STAGE 2B READ-ONLY CLOUD REFERENCE

Purpose:
Development/staging build only. Production remains separate.

What changed in v0.10.13 DEV:
- Preserves the proven GitHub Pages ↔ Supabase connection/authentication/RLS block.
- Preserves the proven Stage 2A reference tables and manual snapshot upload.
- Adds Stage 2B: after a secure sign-in/database verification, the DEV cloud reference snapshot auto-loads into a separate in-memory read-only comparison layer.
- Compares cloud products against this device and reports match/differences with a load time.
- Manual Refresh / Compare remains available.
- Cloud data is NOT automatically applied to the working local catalogue or mappings.
- Sunday reports, deliveries, invoices, payments and operational history remain local and are not synchronized.

Supabase setup:
No new SQL is required if SUPABASE-STAGE2A-SETUP.sql was already run successfully. Stage 2B reuses the same three RLS-protected reference tables.

Safety:
- No secret/service-role key is embedded.
- Read layer is runtime-only and cleared on sign-out/reload.
- No cloud-to-local mutation path is enabled.
- Manual upload remains explicit and confirmed.
- Operational sync remains intentionally deferred.

Visible marker:
v0.10.13 DEV

Known-good connection:
- Supabase URL: https://bzgkeshxbnhnlrpdgbtb.supabase.co
- Authentication: email/password
- public.shops verification: BM Bangrak and Lamai Minimart
- Stage 2A baseline: 54 cloud products / 80 aliases matched the test device.
