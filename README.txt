MAGIC DRAGON PIN v0.10.20 DEV — RESPONSIVE/UI HARDENING

Built from v0.10.19 DEV.

FIXES
- Removed all A–Z scrubber styling coupled to #delivery or #docket.
- The A–Z is now a component-level reusable control.
- 26 real cells occupy the full rendered track width.
- Pointer geometry and visual geometry share the same track.
- Product stays above Find Product and A–Z.
- Product/search stay full width; Qty + Add Line remain compact on larger screens.
- Tablet text scales without altering hit geometry.

AUDIT
Static scan found 1 raw clientX/width proportional-interaction candidate(s) in the full source.
No unrelated control was rewritten without a proven defect.

LEGO CONTRACT
Component-scoped CSS + one rendered track + N equal visual cells + pointer index from same track + optional thumb from selected cell centre.

NO BUSINESS LOGIC CHANGES
Supabase Stage 2D, Delivery calculations, Sunday workflow, invoices, catalogue,
Backup & Recovery and keyboard-safe behavior are unchanged.
