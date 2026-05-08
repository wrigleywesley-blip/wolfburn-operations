# Meta Marketing API · sync worker

Tiny Cloudflare Worker that proxies the Meta Marketing API for the Wolfburn Operations dashboard. Read-only (`ads_read` scope), 5-minute in-memory cache, free tier.

After deploy, the dashboard fetches `https://wolfburn-meta-sync.<your-subdomain>.workers.dev/all` on the Meta page and replaces the illustrative numbers with live ones.

---

## What you need before starting

- A Cloudflare account (free): https://dash.cloudflare.com/sign-up
- A Meta Business account with admin access to the Wolfburn ad account
- ~25 minutes total

---

## Step 1 · Meta side · 15 min

### 1a. Create the Meta App

1. Go to https://developers.facebook.com/apps
2. Click **Create App**
3. Use case: **Other**
4. App type: **Business**
5. App name: `Wolfburn Operations Sync`
6. Contact email: yours
7. Business Account: select your **Wolfburn** business
8. Click **Create app**

You'll land on the App dashboard.

### 1b. Add Marketing API to the app

1. From the App dashboard, scroll to **Add products to your app**
2. Find **Marketing API** → click **Set up**
3. That's it. The product is now attached.

### 1c. Create a System User in Meta Business Manager

System Users get long-lived tokens that don't expire on a personal session. Right way to do this for production sync.

1. Go to https://business.facebook.com/settings
2. Left sidebar → **Users** → **System Users**
3. Click **Add**
4. Name: `Divergence Operations Sync`
5. Role: **Admin** (so it can read ads data)
6. Click **Create system user**

### 1d. Assign the System User to the Wolfburn ad account

1. Still in Business Settings → click the system user you just created
2. Click **Add Assets**
3. Choose **Ad Accounts**
4. Select the **Wolfburn** ad account
5. Toggle **Manage campaigns** OFF, **View performance** ON (read-only is what we want for v1)
6. Click **Save Changes**

### 1e. Generate the access token

1. Still on the system user page → click **Generate New Token**
2. App: select the `Wolfburn Operations Sync` app you created in Step 1a
3. Token expiration: **Never** (or 60 days if you want a renewal habit)
4. Permissions: tick **`ads_read`** (and only that — keep scope tight)
5. Click **Generate Token**
6. **Copy the token immediately and save it somewhere safe** — Meta won't show it again

### 1f. Get the Wolfburn ad account ID

1. Go to https://business.facebook.com/adsmanager/manage/
2. Top of the page, the URL bar will show `act=XXXXXXXXXX` or similar
3. Or: hover the account name in the top-left → "Account ID" appears
4. Copy the **numeric ID only**, no `act_` prefix (e.g. `1234567890123456`)

---

## Step 2 · Cloudflare side · 10 min

### 2a. Install wrangler (if not already)

```bash
npm install -g wrangler
```

### 2b. Authenticate to Cloudflare

```bash
wrangler login
```

A browser window opens. Click **Allow**. You're back at the terminal.

### 2c. Install worker dependencies

From this `worker/` directory:

```bash
npm install
```

### 2d. Set the Meta secrets

```bash
wrangler secret put META_ACCESS_TOKEN
# paste the token from Step 1e when prompted

wrangler secret put META_AD_ACCOUNT_ID
# paste the numeric ad account ID from Step 1f
```

### 2e. Deploy

```bash
wrangler deploy
```

You'll see something like:

```
Published wolfburn-meta-sync (1.32 sec)
  https://wolfburn-meta-sync.<your-subdomain>.workers.dev
```

**Copy that URL.** That's your Worker endpoint.

---

## Step 3 · Verify it works

```bash
curl https://wolfburn-meta-sync.<your-subdomain>.workers.dev/healthz
```

Should return:
```json
{ "ok": true, "version": "v19.0", "ts": "2026-05-08T..." }
```

Then try the live data:

```bash
curl https://wolfburn-meta-sync.<your-subdomain>.workers.dev/all
```

Should return your real Meta account, campaigns, insights.

If you get a `401` or `400` from Meta, the token is wrong. Re-do Step 1e.

---

## Step 4 · Wire the dashboard

Open `/Users/wesley/Desktop/Wolfburn_Operations/index.html` and find this line:

```js
const META_WORKER_URL = "";  // paste your Worker URL here
```

Paste the URL you got from Step 2e. Save.

Commit and push:

```bash
cd /Users/wesley/Desktop/Wolfburn_Operations
git add -A
git commit -m "Wire Meta sync"
git push
```

GitHub Pages rebuilds in ~30 seconds. The Meta page in the dashboard now pulls live data, refreshes every 5 minutes, and the "awaiting auth" banner flips to live.

---

## What the worker exposes

| Endpoint | Returns |
|---|---|
| `/all` | Bundled response: account, insights (last 30d), campaigns with insights · what the dashboard uses |
| `/account` | Ad account meta: name, currency, balance, status |
| `/campaigns` | Active + paused campaigns with insights, daily budget, objective |
| `/insights` | Account-level insights for last 30 days |
| `/audiences` | Custom audiences (lookalikes, retargeting) |
| `/healthz` | Connectivity check |

All cached 5 minutes in memory. CORS open to `*` by default — set `ALLOWED_ORIGIN` in `wrangler.toml` to lock it down to your dashboard URL once you're comfortable.

---

## Cost

Cloudflare Workers free tier: **100,000 requests/day**. The dashboard hits the worker once per Meta page load, so unless you have 100k visits/day you'll pay £0.

Meta Marketing API: free.

---

## Adding more connectors later

This same pattern plugs in Google Ads, Klaviyo, GA4 Reporting, Trustpilot. Each gets its own `worker/` sibling directory with the same shape:

```
Wolfburn_Operations/
├── worker/                  Meta (this one)
├── worker-google-ads/       Google Ads (next)
├── worker-klaviyo/          Klaviyo (after)
└── worker-ga4/              GA4 Reporting
```

Each is deployed independently. Each has its own URL the dashboard fetches from.

---

## Troubleshooting

**"Worker not configured" 500 error** — secrets not set. Re-do Step 2d.

**Meta API returns "Permissions error"** — System User needs `ads_read` permission on that specific ad account. Re-do Step 1d (assign assets) and check the role.

**Token works in `/healthz` but `/all` fails** — usually means the System User has access to the app but not to the ad account. Re-do Step 1d.

**Wrangler deploy hangs** — try `wrangler logout` then `wrangler login` again.

**Dashboard still shows mock data** — hard refresh the GitHub Pages site (Cmd+Shift+R), and make sure you committed the change in Step 4.

---

## When you want to go beyond read-only

For v2 (Atlas can launch + edit campaigns from voice), Meta requires the `ads_management` permission, which means going through Meta's **App Review** process:

1. App Dashboard → App Review → Permissions and Features
2. Request `ads_management`
3. Submit screen recordings showing how the dashboard uses it
4. 2-week wait minimum

We do this once we have the read flow working and you've decided you want write access.
