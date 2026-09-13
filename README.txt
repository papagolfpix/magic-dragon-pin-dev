MAGIC DRAGON PIN v0.10.33 DEV — SUNDAY IMPORT SESSION RESET

Built from v0.10.32 after the user validated multi-week detection and duplicate/conflict classification.

FIX
- Clear Selection now fully clears the transient Sunday import session: selected File objects, detected weekly blocks, checkboxes/preflight list, file input value, result messages and import-button count.
- Close Import now also abandons/resets that transient import session. Reopening + Import Reports starts clean instead of resurrecting the previous workbook.
- If the native file picker returns with no files selected, the same reset path is used so stale preflight data cannot remain.
- One reusable resetSundayImportSession() helper owns this behavior for both controls.

PRESERVED
- v0.10.32 multi-week preflight (Week block 1/N etc.)
- NEW / ALREADY IMPORTED / CONFLICT classification
- identical duplicate protection
- explicit conflict replacement
- safe Sunday deletion
- existing archive/history records are never touched by Clear Selection or Close Import
- Parent/Variant, Delivery, Backup/Recovery and Stage 2D behavior unchanged

TEST
1. Choose the 3-week workbook and confirm all 3 blocks appear.
2. Tap Clear Selection. The filename card, 3 blocks, checkboxes and result state should disappear/reset immediately.
3. Tap Close Import, then + Import Reports. It should reopen blank with no previous workbook state.
4. Choose the workbook again; detection should run fresh.
5. Settings -> DEV Self-Test: Sunday import transient-state reset should PASS.

LEGO BLOCK
Transient Import Session Reset = one idempotent helper resets File input + in-memory selected files + parsed/detected blocks + preflight UI + action count + transient result UI, while preserving persisted archive/database records.
