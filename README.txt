MAGIC DRAGON PIN v0.10.26 DEV — DELIVERY ENTRY USABILITY REBUILD

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


v0.10.26 DEV TEST RELEASE
- Compacts Create Delivery substantially on iPhone: hides redundant module heading while creating, tightens title/meta/product/variant/search/A-Z/Qty spacing, and reduces line-item height.
- Product and Variant now share one compact row on mobile.
- Keeps Clear + Save Delivery on one compact sticky action row so Save remains reachable.
- Restores real vertical scrolling in Create Delivery and adds bottom/safe-area scroll room for Safari.
- Quantity uses the shared keyboard-safe focus Lego block and 16px mobile input text to prevent iOS focus zoom/jump.
- Service-worker cache bumped to v0.10.26-dev for reliable DEV refresh.


v0.10.26 DEV DELIVERY ENTRY USABILITY REBUILD
- Removed the visible A–Z picker and product-name filter from Create Delivery; the shorter product dropdown is now the primary selector.
- Product, Variant and Qty now share one compact row.
- Add line and Save Delivery + Create Docket now share the row directly underneath.
- Added-products list is a scrollable box below the entry controls.
- Corrected the added-products table so Product / Qty / Cost / remove controls align with their headers on iPhone.
- Clear is fixed to the bottom of the viewport while creating/editing a delivery.
- Existing data, pricing, variant logic, docket generation and edit workflow are preserved.


v0.10.26 DEV DELIVERY FOOTER + PRICE VISIBILITY
- Add line is now a full-width row directly below Product / Variant / Qty.
- Save Delivery + Create Docket and Clear are fixed together at the bottom of the viewport, 50/50 width, so neither scrolls away.
- Added-product table now shows Product / Qty / Cost / Sale / remove.
- Sale price uses the same validated retail price already stored in the master catalogue and saved into the docket.
- Added safe-area spacing so the fixed action row does not cover the product list on iPhone Safari.
- Service-worker cache bumped to v0.10.26-dev.
