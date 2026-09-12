MAGIC DRAGON PIN v0.10.18 DEV — SUPABASE STAGE 2D

REUSABLE LEGO BLOCK: Reference Sync Decision / Conflict Guard

This module gives a local-first/cloud-backed app a standard decision layer before reference data moves in either direction.

STATE CLASSIFICATION
- MATCH
- LOCAL CHANGED
- CLOUD CHANGED
- CONFLICT
- FIRST CONTACT
- CLOUD EMPTY

MECHANISM
- deterministic local reference fingerprint
- deterministic cloud reference fingerprint
- persistent per-device ID
- local last-common sync anchor
- cloud snapshot metadata stored in the EXISTING snapshot_meta settings row
- stronger confirmation for potentially conflicting upload or merge directions

SNAPSHOT META
- schema_version
- snapshot_id
- app_version
- product_count
- alias_count
- uploaded_at
- source_device_id
- reference_fingerprint

IMPORTANT
- No new Supabase table
- No SQL migration
- Older cloud snapshots remain compatible; cloud fingerprint can be calculated from returned rows
- Stage 2C preview/apply/undo is preserved
- No automatic direction is chosen during a conflict
- Operational data remains local-only

REUSABLE CONTRACT
AUTHENTICATED REFERENCE STORE + DETERMINISTIC FINGERPRINT + LAST-COMMON ANCHOR + CONFLICT CLASSIFICATION + EXPLICIT DIRECTION + UNDO.
