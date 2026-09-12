MAGIC DRAGON PIN v0.10.21 DEV — CATALOGUE CONTEXT + RESTOCK FOCUS

Built from v0.10.20 DEV.

BUSINESS RULE CORRECTION
Both BM Bangrak and Lamai now have access to the same full active master catalogue.
Removed the old hard-coded Lamai exclusions for:
- 5g products
- Gummy 4 Leaf
- Cali Mousse 1g

RESTOCK CONTEXT
When editing a Sunday-generated suggested delivery:
- Product picker defaults to products present in that branch's Sunday report.
- Products already on the suggested docket are always retained in the context.
- Pin can tap Show all products to temporarily expose the full active catalogue.
- Pin can switch back to Sunday list only.

NORMAL DELIVERY
Normal Create Delivery / ordinary docket editing uses the full active catalogue for either branch.

REUSABLE LEGO CONTRACT
MASTER CATALOGUE → CONTEXT FILTER → TASK-SPECIFIC PICKER

Master Catalogue answers "what is available?"
Context Filter answers "what is relevant here?"
Task-Specific Picker shows the relevant subset without changing underlying availability.

This pattern is reusable for branches, customers, seasonal menus, stock lists, audit tasks and other context-specific pickers.

NO OPERATIONAL CLOUD CHANGE
Supabase Stage 2D remains DEV-only and unchanged.
No delivery quantities, Sunday reports, invoices or payments are moved to cloud by this release.

TEST
1. Normal BM Bangrak delivery: confirm all active products are available.
2. Normal Lamai delivery: confirm the same active products are available.
3. Open a Sunday-generated suggested delivery.
4. Product picker should default to that branch's Sunday-report products.
5. Tap Show all products and confirm the full catalogue appears.
6. Switch back to Sunday list only.
