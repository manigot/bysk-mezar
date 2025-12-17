# Supabase board demo

Next.js (App Router) + Supabase demo where 10–15 users can drop simple sticky notes on a shared board. Items are persisted in Supabase and loaded on page refresh or via the manual **Refresh** button—no realtime subscription.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local` (use your Supabase project URL and anon key):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. Apply the SQL in [`supabase/sql/board_items.sql`](supabase/sql/board_items.sql) to your Supabase project. This creates the `board_items` table, trigger, and RLS policies (owner-only updates/deletes by default, optional collaborative update policy commented out).

4. Run the app:

   ```bash
   npm run dev
   ```

## Deploying to Vercel

If you import this repo directly into Vercel, it will build and deploy as long as you set the two Supabase env vars in the projec
t settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Use the same SQL from [`supabase/sql/board_items.sql`](supabase/sql/board_items.sql) against your Supabase project. No extra Verc
el configuration is required—the default Next.js build command (`next build`) and output work out of the box.

## What the UI does

- Loads items on initial page render and when the **Refresh** button is clicked.
- Drop text onto the board (or drag the template chip from the palette) to create an item; the drop position is stored.
- Drag items to move them; drag the bottom-right corner to resize. Text is editable in-place. Updates are debounced before writing to Supabase.
- Delete your own items with the `✕` button (allowed by the default RLS policy).

## RLS snapshot

- **Read:** any authenticated user can `select` rows.
- **Insert:** `created_by` must equal `auth.uid()`.
- **Update/Delete:** only the owner can change/remove items. Uncomment the collaborative policy in the SQL if you want everyone to move/resize anything.
