MAGIC DRAGON PIN v0.10.37 DEV — SUNDAY READY AFTER RESTORE

Built directly from v0.10.36.

INTENDED TEST PROCEDURE
1. Deploy v0.10.37.
2. Restore a known-good Full Backup from BEFORE today's experimental Sunday-correction testing and BEFORE the 13 Sep Sunday import.
3. Confirm the restored historical data looks correct.
4. Import the real 13 Sep shop files fresh.
5. Walk through Import -> Reconcile -> Financial -> Invoice.
6. Do not save/send/pay the invoice until the figures are verified.
7. After the Sunday cycle is proven, create a new Full Backup.

FIXES INCLUDED

A. SUNDAY WORKFLOW PREVIEW
The simplified Sunday Wizard now uses the same classification as the full import screen:
- NEW
- ALREADY IMPORTED
- CONFLICT
The Import button counts only selected/new blocks.
A workbook that contains three old Lamai weeks plus one new Lamai week will no longer misleadingly say Import 4 reports.

B. SUGGESTED DELIVERY DASHBOARD
Dashboard shows only the latest Sunday suggestion group.
Older unsent suggested dockets remain preserved in Delivery Records/history, but they are no longer mixed with today's suggested dockets on the Dashboard.

C. CORRECTION WORDING
"Correction from previous week" is replaced with "Prior-period correction", because an adjustment can originate several weeks earlier.

D. MONEY DISPLAY
Fractional baht always display two decimals:
฿8,136.50
Whole-baht values remain compact:
฿1,020

E. CORRECTION-CHAIN SAFETY
All v0.10.36 correction-chain fixes are retained:
- unsettled source corrections net by branch + source Sunday date
- internal status alone does not make a correction immutable
- only a saved invoice containing the adjustment makes it applied history
- stock-only zero-financial corrections create no invoice action

WHY RESTORE FIRST
Today's DEV test sequence intentionally modified historical Sunday data and created/saved experimental correction states.
A known-good pre-test Full Backup is the cleanest reset.
Restoring first means v0.10.37 gets a clean database and the real 13 Sep reports can be tested as a genuine first import.
