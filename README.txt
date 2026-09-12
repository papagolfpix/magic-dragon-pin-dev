MAGIC DRAGON PIN v0.10.9 DEV — SUPABASE STAGE 1 HOTFIX

Purpose:
Development/staging build only. Production remains separate.

What changed in v0.10.9 DEV:
- Added the Magic Dragon Pin DEV Supabase project URL and publishable browser key.
- Added Settings > DEV Cloud Connection.
- Existing DEV users can sign in with email/password.
- App verifies authenticated Row Level Security access by reading the DEV shops table.
- Session is retained on the device so the connection can survive reloads.
- Added explicit Sign out and Verify Database Access controls.

Important staged-safety rule:
THIS BUILD DOES NOT SYNC OR REPLACE MAGIC DRAGON BUSINESS DATA YET.
All existing products, Sunday reports, delivery dockets, invoices, mappings and settings continue to use the existing local browser database. This build proves secure authentication/database access first. Cloud migration/sync will be introduced deliberately in later DEV builds after verification.

Security:
- Only the Supabase publishable key is embedded in this browser build.
- No sb_secret/service-role key is included.
- Protected table access still requires an authenticated Supabase user and RLS policies.

Visible marker:
v0.10.9 DEV

Hotfix v0.10.9: Service worker now bypasses all cross-origin API traffic so Supabase authentication is handled directly by Safari instead of the offline asset cache.
