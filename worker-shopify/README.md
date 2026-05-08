# Shopify Admin API · sync worker

Cloudflare Worker that proxies the Shopify Admin GraphQL API for the dashboard. Read-only, 60-second cache, free tier. Replaces the current browser-scrape with a continuous live sync.

After deploy, the dashboard fetches `https://wolfburn-shopify-sync.<your-subdomain>.workers.dev/all` on the Shopify page and on Overview, refreshes every minute.

---

## What you need

- Cloudflare account (free): https://dash.cloudflare.com/sign-up — same one used for the Meta worker
- Shopify Admin access to wolfburn-distillery
- ~10 minutes total

---

## Step 1 · Create a Shopify Custom App · 5 min

1. **🔗 https://admin.shopify.com/store/wolfburn-distillery/settings/apps/development**
2. Click **Allow custom app development** if first time
3. Click **Create an app**
4. Name: `Divergence Operations Sync`
5. App developer: yourself
6. **Create app**

### 1a. Configure Admin API scopes (read-only)

Click into the new app → **Configuration** tab → **Admin API integration** → **Configure**.

Tick these read scopes (uncheck everything else):
- `read_orders`
- `read_products`
- `read_customers`
- `read_inventory`
- `read_locations`
- `read_analytics`
- `read_assigned_fulfillment_orders`
- `read_marketing_events` (optional, for campaign attribution)

Click **Save**.

### 1b. Install the app

- **Install app** button at the top right
- Confirm the scopes
- You land on a page showing the **Admin API access token**

⚠️ The token starts with `shpat_` and is shown ONCE. **Copy it immediately.**

---

## Step 2 · Deploy the Worker · 5 min

From the `worker-shopify/` directory:

```bash
npm install
wrangler login                                     # browser → Allow
wrangler secret put SHOPIFY_SHOP_DOMAIN
# paste: wolfburn-distillery.myshopify.com
wrangler secret put SHOPIFY_ADMIN_ACCESS_TOKEN
# paste: shpat_xxxxxxxxxxxxxxxxxxxxxxxxx
wrangler deploy
```

You'll see:

```
Published wolfburn-shopify-sync (1.32 sec)
  https://wolfburn-shopify-sync.<your-subdomain>.workers.dev
```

Copy that URL.

---

## Step 3 · Verify

```bash
curl https://wolfburn-shopify-sync.<your-subdomain>.workers.dev/healthz
```

Should return:
```json
{ "ok": true, "shop": "Wolfburn Distillery", "domain": "wolfburn-distillery.myshopify.com", "api_version": "2025-01", "latency_ms": 142 }
```

Then:
```bash
curl https://wolfburn-shopify-sync.<your-subdomain>.workers.dev/all
```

Returns shop info + 10 most recent orders + top products + top customers.

---

## Step 4 · Wire dashboard

In `index.html`, find:

```js
const CONNECTORS = {
  ...
  shopify:  { url: "", refreshMs: 60 * 1000 },
  ...
};
```

Paste your Worker URL between the quotes. Save, commit, push. Live in ~30 seconds.

---

## Endpoints

| Endpoint | Returns |
|---|---|
| `/all` | Bundle: shop + 10 recent orders + 5 top products + 5 top customers |
| `/shop` | Shop name, currency, plan, domain |
| `/orders` | Last 25 orders with line items, customer, source |
| `/products/top` | Top 10 products by best-selling rank |
| `/customers/top` | Top 10 customers by lifetime spend |
| `/inventory/low` | All variants with inventory ≤ 25 |
| `/healthz` | Connectivity + token validation |

All cached 60 seconds. CORS open to `*` until you lock it down via `ALLOWED_ORIGIN` in `wrangler.toml`.

---

## Cost

Cloudflare Workers free tier: 100,000 requests/day. Shopify Admin API: free, ~2 req/sec on basic plan. Worker caches at 60s so the dashboard hits Shopify ~1 req/min.

---

## Going beyond read

If you later want to:
- Tag orders, edit products, manage inventory → add `write_*` scopes to the same app
- Trigger fulfillments, refunds → add the relevant write scopes
- Push back to PIM systems → wire the worker to make mutations on a schedule

Same worker, just expand. No re-install needed if you add scopes within the same app.

---

## Troubleshooting

**`401` from Shopify** → token wrong. Check `wrangler secret list`, re-paste with `wrangler secret put`.

**`403` "missing access scope"** → scope wasn't ticked when you installed. Re-configure scopes in the Custom App, hit **Update** in the install screen.

**Slow first response** → cold start, expected. Subsequent requests <100ms within 60s cache window.

**Dashboard still shows old data** → hard refresh (Cmd+Shift+R), and check the Worker URL is set in `CONNECTORS.shopify.url` in `index.html`.
