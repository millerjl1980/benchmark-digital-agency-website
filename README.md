# Benchmark Digital — benchmarkdigital.agency

Website for **Benchmark Digital**, a local marketing agency for service businesses on the south side of Indianapolis.
Static [Astro](https://astro.build) site built with bun, hosted on **Cloudflare Pages**, with one Pages Function
(`/api/lead`) that sends form leads to n8n.

## Quick start

```bash
bun install
bun run dev          # http://localhost:4321 (bound to 0.0.0.0)
bun run build        # static site -> dist/
bun run preview      # build, then serve dist/ + functions/ with wrangler (http://localhost:8788)
bun run check        # type-check .astro files
```

Astro 7 needs Node 22.22 or newer (`.nvmrc` pins 24). If your machine has an older Node, `bun --bun run dev` works.

## Where things live

```
src/
  config/site.ts         phone, email, Calendly link, service area, social links, nav  ← fill in TODOs
  data/plans.json        plans, comparison table, bolt-ons, discount, upgrade, founding-client and exclusivity text
  data/faqs.json         FAQs, grouped by page (home, plans, home-services, pet-services)
  data/industries.json   industry pages + form business categories
  data/pillars.json      the four pillars (home + How it works)
  lib/plans.ts           price formatting + {token} replacement for copy
  lib/faq.ts             FAQPage schema
  components/            GeoGrid, LeadForm, PlanCard, ValueLadder, Faq, CtaBand, Header, Footer, Logo
  layouts/Base.astro     <head>, SEO, Open Graph, ProfessionalService schema, Clicky loader
  pages/                 one file per route; industries/[slug].astro builds both industry pages
functions/api/lead.ts    Cloudflare Pages Function: validate → Turnstile → n8n webhook
public/                  fonts (self-hosted), favicons, brand/ (mark, OG image, contour texture), robots.txt, _headers
scripts/                 brand.ts (favicons), og.ts (social card), contours.ts (texture), mock-services.ts (local test)
```

### Changing prices

Edit `src/data/plans.json`. Every page that shows a price (home ladder, plan cards, comparison table, industry
pages, FAQs) reads from it. FAQ and industry copy never hard-codes a number. It uses tokens that `fill()` in
`src/lib/plans.ts` replaces at build:

| Token | Becomes |
| --- | --- |
| `{growth-builder.monthly}` | $875/mo |
| `{growth-builder.setup}` | $1,750 |
| `{maps-reviews.annual}` | $2,500/yr |
| `{growth-builder.name}` / `{growth-builder.term}` | Growth Builder / 6-month minimum |
| `{discount}` | $500 (the no-nurturing setup discount) |
| `{lsa.price}` / `{lsa.adspend}` | $200/mo + ad spend (about $450/mo minimum) / $450 a month |

An unknown token fails the build, so a typo can't ship.

### Adding a blog later

Create `src/pages/blog/index.astro` and `src/pages/blog/[slug].astro` (an Astro content collection in
`src/content/blog/` is the usual setup), then add `{ href: '/blog', label: 'Blog' }` to `nav` in
`src/config/site.ts`. The sitemap picks the new pages up automatically.

## Lead form

All three forms (`/free-scan`, `/contact`, `/plans`) use `src/components/LeadForm.astro` and POST to `/api/lead`.

1. The browser loads Cloudflare Turnstile only when the form scrolls near view or gets focus (zero cost on page load).
2. `functions/api/lead.ts` checks the honeypot, validates every field, and verifies the Turnstile token.
3. It forwards JSON to `N8N_LEAD_WEBHOOK_URL` with the header `X-Webhook-Secret: <N8N_LEAD_WEBHOOK_SECRET>`.
4. On success the browser goes to `/thank-you`. On failure the form shows a friendly error with the email address.
   Without JavaScript, the function redirects (303) to `/thank-you` or back to the form with `?error=1`.

Payload sent to n8n:

```json
{
  "businessName": "…", "ownerName": "…", "email": "…", "phone": "…",
  "category": "Roofing", "gbp": "Google Maps link or address", "contactTime": "Morning (8 to 11)",
  "plan": "growth-builder", "message": "",
  "source": "free-scan | contact | plans",
  "utm": { "utm_source": "…", "utm_medium": "…", "utm_campaign": "…", "utm_term": "…", "utm_content": "…", "gclid": "…", "fbclid": "…" },
  "page": "/plans", "landingPage": "/", "referrer": "https://…",
  "submittedAt": "ISO date", "ip": "…", "country": "US", "userAgent": "…", "site": "benchmarkdigital.agency"
}
```

UTM parameters are saved to `sessionStorage` on the first page of a visit, so they survive navigation to the form.
In n8n, protect the Webhook node with **Header Auth** (name `X-Webhook-Secret`, value = the secret).

### Environment variables

| Name | Where | Secret? | Purpose |
| --- | --- | --- | --- |
| `N8N_LEAD_WEBHOOK_URL` | Pages → Settings → Variables and Secrets (Production + Preview) | No (but keep it private) | n8n production webhook URL |
| `N8N_LEAD_WEBHOOK_SECRET` | same, as **Secret** | **Yes** | Sent as `X-Webhook-Secret` |
| `TURNSTILE_SECRET_KEY` | same, as **Secret** | **Yes** | Turnstile server-side check. If missing, every lead is rejected |
| `PUBLIC_TURNSTILE_SITE_KEY` | same (build variable) | No | Turnstile widget key, baked into the HTML at build. Unset = Cloudflare's test key |
| `PUBLIC_CLICKY_SITE_ID` | same (build variable) | No | Clicky analytics. Unset = no analytics script |
| `TURNSTILE_VERIFY_URL` | `.dev.vars` only | No | Local testing only: send siteverify to the mock. **Never set in production** |

`PUBLIC_*` values are read at build time, so redeploy after changing them. Secrets never reach the browser.

### Testing the form locally (end to end)

```bash
cp .dev.vars.example .dev.vars       # points at the local mocks, uses Turnstile test keys
bun scripts/mock-services.ts &       # fake n8n webhook + fake Turnstile verify on :8799
bun run preview                      # http://localhost:8788
```

Submit a form. Each lead the mock webhook receives is appended to `.wrangler/test-leads.jsonl`.

- **Real Turnstile verification:** remove `TURNSTILE_VERIFY_URL` to call Cloudflare directly. Behind an HTTP
  proxy (like the build sandbox), wrangler's local runtime ignores `HTTPS_PROXY`, so set
  `TURNSTILE_VERIFY_URL=http://localhost:8799/relay/siteverify` instead. The mock server forwards to Cloudflare's
  real endpoint through the proxy. Test secrets: `1x0000000000000000000000000000000AA` always passes,
  `2x0000000000000000000000000000000AA` always fails.
- **Real n8n:** set `N8N_LEAD_WEBHOOK_URL` in `.dev.vars` to an n8n **test** webhook URL.

## Deploying to Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**, pick this repo.
2. Build settings:
   - Framework preset: **Astro**
   - Build command: `bun run build`
   - Build output directory: `dist`
   - Environment variable `NODE_VERSION` = `24` (Bun is detected from `bun.lock`; set `BUN_VERSION` if you want to pin it)
3. Add the environment variables above (Production and Preview).
4. **Turnstile:** Cloudflare → Turnstile → Add widget, domain `benchmarkdigital.agency` (add the `*.pages.dev`
   preview domain too), mode **Managed**. Copy the site key into `PUBLIC_TURNSTILE_SITE_KEY` and the secret into
   `TURNSTILE_SECRET_KEY`.
5. **Custom domain:** Pages project → Custom domains → add `benchmarkdigital.agency` (and `www`). DNS is already on
   Cloudflare, so the records are created for you. The old GitHub Pages site used a `CNAME` file in the
   `benchmark-digital-agency-website` repo; turn GitHub Pages off there once the new site is live.
6. Push to `main` to deploy production; other branches get preview URLs.

The `functions/` folder is picked up automatically. `public/_headers` sets security headers and long caching for
fonts and hashed assets.

## Design notes

- **Palette** (tokens in `src/styles/global.css`): ink navy `#14233a` / `#101c2e`, brass `#c9973f` (use
  `--brass-text: #7a561b` for text on light backgrounds), off-white `#f7f3ea`, green `#2e9e5e` **only** for
  "ranking well". All text pairs meet WCAG AA.
- **Type:** Zilla Slab (headlines) and Source Sans 3 (body), self-hosted from `public/fonts/`, with metric-matched
  fallbacks so the font swap causes no layout shift.
- **Mark:** the brass benchmark disc in `public/brand/mark.svg` (inlined in `Logo.astro`, so keep them in sync).
  `bun run brand` rebuilds the favicons; `bun run og` re-renders the social card through Browserless.
- **GeoGrid:** `src/components/GeoGrid.astro`, a static SVG with a CSS fill-in animation, skipped for
  `prefers-reduced-motion`. It's always labelled as an illustration, never client data.
- **Photos:** none yet. Dashed `.placeholder` boxes with fixed aspect ratios mark where real local photos go.
  When you add them, use `<Image>` from `astro:assets` (WebP/AVIF, width and height set).

## Placeholders still to fill

See [PLACEHOLDERS.md](PLACEHOLDERS.md).

## Legacy assets

`brand/legacy/` holds the image assets from the previous one-page site. They aren't used: the neon purple/3D
style conflicts with the brand direction. They're kept here for reference.
