MAGIC DRAGON PIN v0.10.12 DEV — SUPABASE STAGE 2A REFERENCE SNAPSHOT

Purpose:
Development/staging build only. Production remains separate.

What changed in v0.10.12 DEV:
- Preserves the proven v0.10.11 GitHub Pages ↔ Supabase connection block unchanged.
- Adds Stage 2A Cloud Reference Snapshot under Settings > DEV Cloud Connection.
- Adds manual Check / Compare for cloud reference tables.
- Adds explicit, confirmed Upload Local Reference Snapshot. This copies only products, product aliases and business-rule metadata to DEV Cloud.
- Reads the copied data back and compares product identity/basic catalogue fields against this device.
- Existing local data remains the source of truth. No automatic cloud replacement is enabled.
- Sunday reports, deliveries, invoices, payments and operational history remain local and are NOT uploaded by Stage 2A.

Required one-time Supabase setup:
Run SUPABASE-STAGE2A-SETUP.sql in the Magic Dragon Pin DEV Supabase SQL Editor. It creates three isolated reference tables, enables RLS, grants only authenticated access, and adds authenticated select/insert/update policies.

Safety:
- No secret/service-role key is embedded.
- No DELETE permission is granted for Stage 2A reference tables.
- Upload is manual and requires confirmation.
- Cloud snapshot does not mutate local records.
- Operational sync is intentionally deferred.

Visible marker:
v0.10.12 DEV

Known-good connection inherited from v0.10.11:
- Supabase URL: https://bzgkeshxbnhnlrpdgbtb.supabase.co
- Authentication: email/password
- public.shops verification returns BM Bangrak and Lamai Minimart after authenticated SELECT grant/RLS.

Deployment note:
The v0.10.11 diagnostic service-worker cleanup remains in place for DEV so stale Safari workers cannot interfere with Supabase requests while Stage 2A is validated.
