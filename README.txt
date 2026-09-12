MAGIC DRAGON PIN v0.10.19 DEV — PERMANENT A–Z SCRUBBER FIX

Built from v0.10.18 DEV Stage 2D.

ROOT CAUSE
The alphabet was displayed as one spaced text string while pointer selection used proportional math across the scrubber width.
On wider displays, rendered text spacing and touch geometry could still diverge.

PERMANENT FIX
- Replaced the text string with 26 real DOM letter cells.
- Each cell owns exactly 1/26 of the rendered track width.
- Pointer/touch index is calculated from the exact same rendered track.
- The floating thumb snaps to the center of the real selected cell.
- Selected cell receives a visual emphasis.
- Font/word spacing can no longer distort the letter geometry.

REUSABLE LEGO CONTRACT
PROPORTIONAL SCRUBBER =
  ONE RENDERED TRACK
  + N EQUAL VISUAL CELLS
  + POINTER INDEX CALCULATED FROM THAT SAME TRACK
  + OPTIONAL THUMB POSITIONED FROM THE SELECTED CELL

Never use text spacing as touch geometry.

NO BUSINESS LOGIC CHANGES
Supabase Stage 2D, reference sync guard, Delivery business logic, Sunday workflow,
invoices, Backup & Recovery, catalogue behavior and keyboard-safe input logic are unchanged.

TEST
1. Open New Delivery on iPad.
2. Drag slowly from A to Z.
3. Confirm the selected letter/thumb follows the visible letter under the finger.
4. Repeat in landscape if convenient.
5. Repeat on iPhone to confirm no regression.
