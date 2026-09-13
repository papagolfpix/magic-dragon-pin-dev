MAGIC DRAGON PIN v0.10.34 DEV — SUNDAY CORRECTION CARRY-FORWARD

Built directly from the user-tested v0.10.33 DEV baseline.

FOCUSED CHANGE ONLY
This release fixes the accounting treatment and explanation when an already-imported Sunday report is replaced with different figures after an invoice has been issued/paid.

NEW BEHAVIOUR
- Before replacement, the app calculates the exact financial delta between old and new Sunday data.
- Delta uses the master product cost/retail and the correct standard/edible profit split.
- The replacement confirmation shows:
  Sales delta
  Cost delta
  Pin profit-share delta
  Total delta payable to Pin
- A source-correction audit record is stored.
- If an affected invoice is already paid, that historic paid invoice remains unchanged.
- The amount still payable to Pin is queued automatically as a prior-period adjustment for the next eligible Sunday invoice.
- The invoice screen shows a clear breakdown instead of misleading "Verified difference +฿0".
- Dashboard shows the queued correction with its actual money breakdown.
- DEV Self-Test verifies the Sunday correction carry-forward helper path exists.

EXAMPLE
One extra standard item sold at ฿150 with ฿60 cost:
Sales +฿150
Cost +฿60
Profit +฿90
Pin profit share +฿27
Still payable to Pin +฿87

TEST PATH
1. Start with an already-imported Sunday week.
2. Upload a changed copy where one standard ฿150 / ฿60 product changes from 0 sold to 1 sold.
3. Confirm the replacement warning shows Sales +฿150, Cost +฿60, Pin profit +฿27, Pay Pin +฿87.
4. Accept replacement.
5. Open the affected paid invoice.
6. Confirm it says PAID · CORRECTION QUEUED and clearly shows +฿87 queued for next Sunday.
7. Open the next eligible Sunday workflow and confirm +฿87 appears as an automatic previous-week correction.

NO OTHER MAJOR WORKFLOW CHANGES
Mapping-review cleanup remains the next roadmap block after this test passes.
