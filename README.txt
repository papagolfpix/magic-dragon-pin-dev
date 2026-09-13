MAGIC DRAGON PIN v0.10.35 DEV — CORRECTION EQUILIBRIUM

Built from v0.10.34 after on-device testing exposed a second-order correction bug.

BUG FIXED
Sequence:
1. Historical paid Sunday data was corrected +฿87.
2. The app correctly queued +฿87 for the next Sunday invoice.
3. The source was then restored to its original values.
4. v0.10.34 created a second -฿87 adjustment instead of cancelling the unapplied +฿87.

v0.10.35 NETTING RULE
For the same branch + source Sunday + affected invoice:
- unapplied Sunday-source corrections are always netted together;
- +฿87 followed by -฿87 = ฿0, both are closed as EQUILIBRIUM RESTORED;
- nothing carries forward;
- the original paid invoice returns to normal PAID state;
- the correction alert disappears because there is no active financial balance;
- the audit trail remains in the stored correction history.

PARTIAL EXAMPLE
+฿87 followed by -฿30 before either is applied = one active +฿57 carry-forward, not two separate adjustments.

IMPORTANT HISTORY RULE
If the earlier +฿87 has already been APPLIED to a later invoice, it is historical and is never erased.
A later -฿87 remains a real new correction and carries forward normally.

HISTORICAL IMPORT STATE
Replacing a historical Sunday report no longer reopens that old date as the active Sunday workflow merely because it was re-imported.

AUTOMATIC REPAIR
On startup v0.10.35 reconciles existing unapplied Sunday correction groups.
The current test state (+฿87 and -฿87) should therefore cancel automatically after deployment.
It also clears a stale historical active-Sunday pointer when a newer Sunday cycle is already recorded complete.

TEST
1. Deploy v0.10.35.
2. Dashboard should no longer show a -฿87 correction queued for the restored 23 Aug source.
3. The affected paid invoice should return to PAID with no active correction warning.
4. Sunday Status should not be reopened to 23 Aug merely because of the historical replacement.
5. Settings -> DEV Self-Test -> Sunday correction equilibrium should PASS.
