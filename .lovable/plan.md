## Problem

The gallery already subscribes to INSERTs on `public.results` via a Supabase Realtime channel, but the table isn't in the `supabase_realtime` publication — so no events are broadcast and new submissions only appear after a manual refresh.

## Change

Add a one-line migration that enables Realtime for the results table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.results;
```

No frontend changes needed — the existing subscription in `GalleryScreen` (src/routes/index.tsx ~line 1042) will start receiving INSERT events immediately, prepending new cards with the falling animation as participants submit.