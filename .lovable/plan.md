## Plan

1. **Fix the clipping source**
   - Increase the gallery canvas height so it reserves enough vertical space for the real card height after the analysis body was enlarged to 10px.
   - Stop the scroller from hiding vertical overflow that belongs to full result cards.

2. **Keep the 4-card gallery rule**
   - Keep only 4 visible result slots at a time.
   - Keep older submissions pushed left in the horizontal history lane.
   - Keep the random horizontal placement, but make the vertical placement safe so no card is cut off at the bottom.

3. **Make card height deterministic**
   - Use a taller fixed gallery card frame, or calculate the screen height from a larger `CARD_H`, so the card/footer always fit within the visible gallery area.
   - Preserve the current larger 10px analysis body unless you want it reduced.

4. **Verify visually**
   - Re-open the gallery at the current desktop/iPad-sized viewport.
   - Confirm each visible card shows the full result, including the bottom logo and `No.` footer, without being cut off.