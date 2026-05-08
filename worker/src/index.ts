/**
 * Wolfburn Operations · Meta Marketing API sync
 *
 * Cloudflare Worker that polls Meta on demand (with a 5-minute in-memory cache)
 * and exposes a tidy JSON shape the dashboard can consume.
 *
 * Endpoints:
 *   GET /all              → bundle: account, campaigns, insights, fetched_at
 *   GET /account          → ad account meta (name, currency, balance, status)
 *   GET /campaigns        → active campaigns with insights
 *   GET /insights         → ad-account-level insights, last 30 days
 *   GET /audiences        → custom audiences (lookalikes, retargeting)
 *   GET /healthz          → connectivity check
 *
 * All responses include CORS so the GitHub Pages dashboard can fetch directly.
 */

export interface Env {
  META_ACCESS_TOKEN: string;     // System User token, ads_read scope
  META_AD_ACCOUNT_ID: string;    // numeric ad account ID, no act_ prefix (e.g. "1234567890")
  ALLOWED_ORIGIN?: string;       // optional CORS lockdown, defaults to *
}

// --- in-memory cache (5 min TTL) ---
type CacheEntry = { data: unknown; expires: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

const META_API_VERSION = "v19.0";

function cors(env: Env): HeadersInit {
  return {
    "access-control-allow-origin": env.ALLOWED_ORIGIN || "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json"
  };
}

async function metaFetch<T = unknown>(path: string, env: Env): Promise<T> {
  const cacheKey = path;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  const sep = path.includes("?") ? "&" : "?";
  const url = `https://graph.facebook.com/${META_API_VERSION}/${path}${sep}access_token=${env.META_ACCESS_TOKEN}`;
  const r = await fetch(url, { cf: { cacheTtl: 60, cacheEverything: true } });

  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Meta API ${r.status}: ${body.slice(0, 400)}`);
  }
  const data = (await r.json()) as T;
  CACHE.set(cacheKey, { data, expires: Date.now() + TTL_MS });
  return data;
}

interface CampaignInsight {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  reach?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  insights?: { data: CampaignInsight[] };
}

function summariseInsights(insights: CampaignInsight | undefined) {
  if (!insights) return null;
  const purchases = insights.actions?.find(a => a.action_type === "purchase" || a.action_type === "omni_purchase");
  const purchaseValue = insights.action_values?.find(a => a.action_type === "purchase" || a.action_type === "omni_purchase");
  const spend = parseFloat(insights.spend || "0");
  const revenue = parseFloat(purchaseValue?.value || "0");
  const roas = spend > 0 ? revenue / spend : null;
  return {
    spend,
    revenue,
    roas: roas !== null ? Math.round(roas * 100) / 100 : null,
    impressions: parseInt(insights.impressions || "0", 10),
    clicks: parseInt(insights.clicks || "0", 10),
    ctr: insights.ctr ? parseFloat(insights.ctr) : null,
    cpc: insights.cpc ? parseFloat(insights.cpc) : null,
    reach: insights.reach ? parseInt(insights.reach, 10) : null,
    frequency: insights.frequency ? parseFloat(insights.frequency) : null,
    purchases: purchases ? parseInt(purchases.value, 10) : 0
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors(env) });
    }

    const url = new URL(request.url);
    const accountId = env.META_AD_ACCOUNT_ID;

    // sanity check env
    if (!env.META_ACCESS_TOKEN || !env.META_AD_ACCOUNT_ID) {
      return new Response(
        JSON.stringify({
          error: "Worker not configured",
          missing: [
            !env.META_ACCESS_TOKEN ? "META_ACCESS_TOKEN" : null,
            !env.META_AD_ACCOUNT_ID ? "META_AD_ACCOUNT_ID" : null
          ].filter(Boolean)
        }, null, 2),
        { status: 500, headers: cors(env) }
      );
    }

    try {
      let result: unknown;

      switch (url.pathname) {
        case "/healthz":
          result = { ok: true, version: META_API_VERSION, ts: new Date().toISOString() };
          break;

        case "/account": {
          const acc = await metaFetch<{ name: string; currency: string; balance: string; amount_spent: string; account_status: number }>(
            `act_${accountId}?fields=name,currency,balance,amount_spent,account_status,timezone_name,age`,
            env
          );
          result = acc;
          break;
        }

        case "/campaigns": {
          const data = await metaFetch<{ data: Campaign[] }>(
            `act_${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpc,actions,action_values,reach,frequency}&limit=50&effective_status=["ACTIVE","PAUSED"]`,
            env
          );
          result = {
            campaigns: data.data.map(c => ({
              id: c.id,
              name: c.name,
              status: c.status,
              objective: c.objective,
              daily_budget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : null,
              lifetime_budget: c.lifetime_budget ? parseFloat(c.lifetime_budget) / 100 : null,
              start_time: c.start_time,
              insights: summariseInsights(c.insights?.data?.[0])
            }))
          };
          break;
        }

        case "/insights": {
          const data = await metaFetch<{ data: CampaignInsight[] }>(
            `act_${accountId}/insights?fields=spend,impressions,clicks,ctr,cpc,reach,frequency,actions,action_values&date_preset=last_30d`,
            env
          );
          result = { account: summariseInsights(data.data[0]), period: "last_30d" };
          break;
        }

        case "/audiences": {
          const data = await metaFetch<{ data: { id: string; name: string; subtype: string; approximate_count?: number; description?: string }[] }>(
            `act_${accountId}/customaudiences?fields=id,name,subtype,approximate_count,description&limit=50`,
            env
          );
          result = data;
          break;
        }

        case "/all":
        case "/": {
          const [account, campaignsResp, insights] = await Promise.all([
            metaFetch<any>(`act_${accountId}?fields=name,currency,balance,amount_spent,account_status,timezone_name`, env),
            metaFetch<{ data: Campaign[] }>(
              `act_${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpc,actions,action_values,reach,frequency}&limit=50&effective_status=["ACTIVE","PAUSED"]`,
              env
            ),
            metaFetch<{ data: CampaignInsight[] }>(
              `act_${accountId}/insights?fields=spend,impressions,clicks,ctr,cpc,reach,frequency,actions,action_values&date_preset=last_30d`,
              env
            )
          ]);

          result = {
            account: {
              id: accountId,
              name: account.name,
              currency: account.currency,
              status: account.account_status === 1 ? "ACTIVE" : "INACTIVE",
              balance: account.balance ? parseFloat(account.balance) / 100 : null,
              amount_spent_30d: account.amount_spent ? parseFloat(account.amount_spent) / 100 : null
            },
            insights_30d: summariseInsights(insights.data[0]),
            campaigns: campaignsResp.data.map(c => ({
              id: c.id,
              name: c.name,
              status: c.status,
              objective: c.objective,
              daily_budget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : null,
              start_time: c.start_time,
              insights: summariseInsights(c.insights?.data?.[0])
            })),
            fetched_at: new Date().toISOString()
          };
          break;
        }

        default:
          return new Response(
            JSON.stringify({
              error: "Unknown endpoint",
              endpoints: ["/all", "/account", "/campaigns", "/insights", "/audiences", "/healthz"]
            }, null, 2),
            { status: 404, headers: cors(env) }
          );
      }

      return new Response(JSON.stringify(result, null, 2), { headers: cors(env) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ error: msg }, null, 2), { status: 500, headers: cors(env) });
    }
  }
};
