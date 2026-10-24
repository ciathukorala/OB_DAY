# OB Day 2026 Liquor Reservation

Table liquor orders for the Bandaranayake College Old Boys' Association night. Guests scan a table QR, choose bottles, and send the request to the bar. Stewards deliver, collect cash or card, and close the order.

## Night-of flow

1. Print `/admin/qr` and put one card on each of the 50 tables.
2. A guest scans the QR → `/t/12` (table is already filled).
3. They pick bottles and send the request.
4. Stewards open `/admin` (PIN), tap **Send to table**, then **Mark delivered**.
5. Collect cash or card and tap **Paid & close**.

Stock starts at 132 bottles and drops when a request is placed. Cancelled requests put bottles back.

## Stock

| Bottle | Qty |
| --- | ---: |
| Ascot Dry Gin | 24 |
| Eristoff Vodka | 12 |
| V & A Black | 36 |
| Old Reserve | 24 |
| IDL Old | 12 |
| Black Bacardi | 12 |
| White Bacardi | 12 |
| **Total** | **132** |

Set rupee prices in the steward desk cellar panel before doors open. Guests can still order if a price is 0; the steward types the amount when collecting payment.

## Local run

```bash
npm install
npm run dev
```

- Guest app: http://localhost:3000
- Table example: http://localhost:3000/t/12
- Steward desk: http://localhost:3000/admin
- Default PIN: `obday2026`

Copy `.env.example` to `.env.local` and change `ADMIN_PIN` plus `ADMIN_SECRET` before the event.

## Deploy on Vercel (free)

The live event needs a database so every phone and the bar laptop see the same orders.

1. Push this folder to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. In the Vercel project open **Storage → Create Database → Neon** (Hobby / free).
4. Add environment variables:
   - `ADMIN_PIN` — steward PIN
   - `ADMIN_SECRET` — long random string
   - `DATABASE_URL` — Neon URL (Vercel fills this if Neon is created from Storage)
5. Redeploy. Open `/admin/qr` on the production URL and print the 50 cards.

Windows note: `vercel deploy` from this PC can fail on a symlink permission (`EPERM`). Importing from GitHub in the Vercel dashboard avoids that. If you want CLI deploys, turn on Windows Developer Mode or run the terminal as Administrator, then `npx vercel login` and `npx vercel --prod`.
