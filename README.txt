MAGIC DRAGON PIN v0.10.23 DEV — PARENT PRODUCT -> VARIANT PICKER

Built from v0.10.22 stability checkpoint.

NEW DELIVERY FLOW
- Product picker shows parent product names only.
- Variant is a separate selector.
- Variant always begins at "Choose variant..." and is never auto-selected.
- Add Line refuses to continue until Pin explicitly chooses a variant.
- The selected variant resolves to the existing SKU/product ID underneath.
- Existing prices, barcodes, reconciliation, invoices and historical records continue to use the resolved SKU.

SUNDAY RESTOCK
- Suggested delivery still defaults to the branch/week Sunday subset.
- The subset now shows parent product families.
- Variant choices are limited to eligible SKU variants inside that context.
- Show all products exposes the complete active master catalogue.
- Sunday context count now reports unique parent products rather than raw SKU rows.

PAPA GOLF LEGO BLOCK
Parent Product -> Available Variants -> Resolved SKU -> Business Record

DEV SELF-TEST
Settings -> DEV Self-Test runs non-destructive checks for:
- product family metadata
- duplicate active variants
- Bangrak/Lamai catalogue parity
- A-Z 26-cell presence
- Parent -> Variant picker structure
- no automatic variant
- Sunday context filter
- keyboard-safe input helper
- Stage 2D DEV guard

This is the first reusable Papa Golf testing/diagnostic Lego block.

TEST PLAN
1. Normal Delivery: select product; Variant must remain unselected.
2. Tap Add Line without a variant: app must stop and ask for a variant.
3. Select 1g / 5g / Pre-Roll as applicable, enter Qty and add.
4. Confirm the correct resolved SKU is shown on the line.
5. Sunday suggested delivery: verify product families are Sunday-context limited.
6. Show all products: verify full catalogue and variants appear.
7. Settings -> DEV Self-Test -> Run DEV Self-Test.

NOT YET PRODUCTION-SAFE
Parent -> Variant and DEV Self-Test remain DEV-only until device-tested.
