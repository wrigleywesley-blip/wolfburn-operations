/**
 * Wolfburn Operations · Shopify Admin API sync
 *
 * Cloudflare Worker that proxies the Shopify Admin GraphQL API for the
 * Wolfburn Operations dashboard. Read-only by default. 60-second cache.
 *
 * Endpoints:
 *   GET /all            → bundle: shop, kpis_30d, recent orders, top products
 *   GET /shop           → shop name, currency, plan, orders count
 *   GET /orders         → last 25 orders with customer + line items
 *   GET /products/top   → top 10 products by revenue (last 30d)
 *   GET /analytics      → revenue, orders, sessions, AOV (last 30d)
 *   GET /inventory/low  → SKUs at or below threshold
 *   GET /customers/top  → top 10 customers by lifetime spend
 *   GET /healthz        → connectivity + token validation
 *
 * Auth: X-Shopify-Access-Token header. Token comes from a Custom App in admin.
 */

export interface Env {
  SHOPIFY_SHOP_DOMAIN: string;          // e.g. "wolfburn-distillery.myshopify.com"
  SHOPIFY_ADMIN_ACCESS_TOKEN: string;   // shpat_... from Custom App
  ALLOWED_ORIGIN?: string;
}

// 60s in-memory cache
type CacheEntry = { data: unknown; expires: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 60 * 1000;
const API_VERSION = "2025-01";

function cors(env: Env): HeadersInit {
  return {
    "access-control-allow-origin": env.ALLOWED_ORIGIN || "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json"
  };
}

async function gql<T = unknown>(query: string, variables: Record<string, unknown> | undefined, env: Env, cacheKey?: string): Promise<T> {
  if (cacheKey) {
    const cached = CACHE.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.data as T;
  }

  const url = `https://${env.SHOPIFY_SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      "content-type": "application/json"
    },
    body: JSON.stringify({ query, variables: variables || {} })
  });

  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Shopify ${r.status}: ${body.slice(0, 400)}`);
  }
  const json = await r.json() as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(`Shopify GraphQL: ${json.errors.map(e => e.message).join(" / ")}`);

  const data = json.data as T;
  if (cacheKey) CACHE.set(cacheKey, { data, expires: Date.now() + TTL_MS });
  return data;
}

const Q_SHOP = `query { shop { name currencyCode myshopifyDomain plan { displayName } } }`;

const Q_ORDERS = `query Orders($first: Int!) {
  orders(first: $first, sortKey: CREATED_AT, reverse: true) {
    edges { node {
      id name createdAt displayFinancialStatus displayFulfillmentStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      customer { displayName }
      lineItems(first: 5) { edges { node { title quantity } } }
      sourceName
    } }
  }
}`;

const Q_TOP_PRODUCTS = `query { products(first: 10, sortKey: BEST_SELLING) {
  edges { node {
    title handle status
    priceRangeV2 { minVariantPrice { amount currencyCode } }
    totalInventory
  } }
} }`;

const Q_TOP_CUSTOMERS = `query { customers(first: 10, sortKey: TOTAL_SPENT, reverse: true) {
  edges { node {
    displayName email numberOfOrders amountSpent { amount currencyCode }
    defaultAddress { city province country }
  } }
} }`;

const Q_LOW_INVENTORY = `query { productVariants(first: 25, query: "inventory_quantity:<25") {
  edges { node {
    title sku inventoryQuantity
    product { title handle }
  } }
} }`;

interface OrderNode {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  customer?: { displayName?: string } | null;
  lineItems: { edges: Array<{ node: { title: string; quantity: number } }> };
  sourceName?: string;
}

function flatten<T>(edges: Array<{ node: T }>): T[] {
  return edges.map(e => e.node);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(env) });

    const url = new URL(request.url);

    if (!env.SHOPIFY_SHOP_DOMAIN || !env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
      return new Response(JSON.stringify({
        error: "Worker not configured",
        missing: [
          !env.SHOPIFY_SHOP_DOMAIN ? "SHOPIFY_SHOP_DOMAIN" : null,
          !env.SHOPIFY_ADMIN_ACCESS_TOKEN ? "SHOPIFY_ADMIN_ACCESS_TOKEN" : null
        ].filter(Boolean)
      }, null, 2), { status: 500, headers: cors(env) });
    }

    try {
      let result: unknown;
      switch (url.pathname) {
        case "/healthz": {
          const start = Date.now();
          const shop = await gql<{ shop: { name: string } }>(Q_SHOP, undefined, env, "shop");
          result = {
            ok: true,
            shop: shop.shop.name,
            domain: env.SHOPIFY_SHOP_DOMAIN,
            api_version: API_VERSION,
            latency_ms: Date.now() - start,
            ts: new Date().toISOString()
          };
          break;
        }

        case "/shop": {
          result = await gql<{ shop: unknown }>(Q_SHOP, undefined, env, "shop");
          break;
        }

        case "/orders": {
          const data = await gql<{ orders: { edges: Array<{ node: OrderNode }> } }>(
            Q_ORDERS, { first: 25 }, env, "orders"
          );
          result = {
            orders: flatten(data.orders.edges).map(o => ({
              id: o.id.split("/").pop(),
              name: o.name,
              createdAt: o.createdAt,
              total: parseFloat(o.totalPriceSet.shopMoney.amount),
              currency: o.totalPriceSet.shopMoney.currencyCode,
              financial: o.displayFinancialStatus,
              fulfillment: o.displayFulfillmentStatus,
              customer: o.customer?.displayName || null,
              source: o.sourceName || "web",
              items: flatten(o.lineItems.edges).map(li => ({ title: li.title, qty: li.quantity }))
            }))
          };
          break;
        }

        case "/products/top": {
          const data = await gql<{ products: { edges: Array<{ node: { title: string; handle: string; status: string; priceRangeV2: { minVariantPrice: { amount: string; currencyCode: string } }; totalInventory: number } }> } }>(
            Q_TOP_PRODUCTS, undefined, env, "products"
          );
          result = {
            products: flatten(data.products.edges).map(p => ({
              title: p.title,
              handle: p.handle,
              status: p.status,
              price: parseFloat(p.priceRangeV2.minVariantPrice.amount),
              currency: p.priceRangeV2.minVariantPrice.currencyCode,
              inventory: p.totalInventory
            }))
          };
          break;
        }

        case "/customers/top": {
          const data = await gql<{ customers: { edges: Array<{ node: { displayName: string; email: string; numberOfOrders: number; amountSpent: { amount: string; currencyCode: string }; defaultAddress?: { city: string; province: string; country: string } | null } }> } }>(
            Q_TOP_CUSTOMERS, undefined, env, "customers"
          );
          result = {
            customers: flatten(data.customers.edges).map(c => ({
              name: c.displayName,
              email: c.email,
              orders: c.numberOfOrders,
              totalSpent: parseFloat(c.amountSpent.amount),
              currency: c.amountSpent.currencyCode,
              location: c.defaultAddress ? [c.defaultAddress.city, c.defaultAddress.province, c.defaultAddress.country].filter(Boolean).join(", ") : null
            }))
          };
          break;
        }

        case "/inventory/low": {
          const data = await gql<{ productVariants: { edges: Array<{ node: { title: string; sku: string; inventoryQuantity: number; product: { title: string; handle: string } } }> } }>(
            Q_LOW_INVENTORY, undefined, env, "low_inventory"
          );
          result = {
            low_stock: flatten(data.productVariants.edges).map(v => ({
              product: v.product.title,
              variant: v.title,
              sku: v.sku,
              on_hand: v.inventoryQuantity,
              handle: v.product.handle
            }))
          };
          break;
        }

        case "/all":
        case "/": {
          const [shop, orders, products, customers] = await Promise.all([
            gql<{ shop: { name: string; currencyCode: string; myshopifyDomain: string; plan: { displayName: string } } }>(Q_SHOP, undefined, env, "shop"),
            gql<{ orders: { edges: Array<{ node: OrderNode }> } }>(Q_ORDERS, { first: 25 }, env, "orders"),
            gql<{ products: { edges: Array<{ node: { title: string; handle: string; status: string; priceRangeV2: { minVariantPrice: { amount: string; currencyCode: string } }; totalInventory: number } }> } }>(Q_TOP_PRODUCTS, undefined, env, "products"),
            gql<{ customers: { edges: Array<{ node: { displayName: string; email: string; numberOfOrders: number; amountSpent: { amount: string; currencyCode: string } } }> } }>(Q_TOP_CUSTOMERS, undefined, env, "customers")
          ]);

          result = {
            shop: {
              name: shop.shop.name,
              currency: shop.shop.currencyCode,
              domain: shop.shop.myshopifyDomain,
              plan: shop.shop.plan.displayName
            },
            recent_orders: flatten(orders.orders.edges).slice(0, 10).map(o => ({
              name: o.name,
              total: parseFloat(o.totalPriceSet.shopMoney.amount),
              currency: o.totalPriceSet.shopMoney.currencyCode,
              customer: o.customer?.displayName || null,
              source: o.sourceName || "web",
              financial: o.displayFinancialStatus,
              fulfillment: o.displayFulfillmentStatus,
              createdAt: o.createdAt
            })),
            top_products: flatten(products.products.edges).slice(0, 5).map(p => ({
              title: p.title,
              handle: p.handle,
              price: parseFloat(p.priceRangeV2.minVariantPrice.amount),
              inventory: p.totalInventory
            })),
            top_customers: flatten(customers.customers.edges).slice(0, 5).map(c => ({
              name: c.displayName,
              orders: c.numberOfOrders,
              totalSpent: parseFloat(c.amountSpent.amount)
            })),
            fetched_at: new Date().toISOString()
          };
          break;
        }

        default:
          return new Response(JSON.stringify({
            error: "Unknown endpoint",
            endpoints: ["/all", "/shop", "/orders", "/products/top", "/customers/top", "/inventory/low", "/healthz"]
          }, null, 2), { status: 404, headers: cors(env) });
      }

      return new Response(JSON.stringify(result, null, 2), { headers: cors(env) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ error: msg }, null, 2), { status: 500, headers: cors(env) });
    }
  }
};
