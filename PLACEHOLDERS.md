# Still to fill in

## Content and config

| What | Where | Notes |
| --- | --- | --- |
| Phone number | `src/config/site.ts` → `phone` | Until set, the header hides the number, the mobile bar shows "Contact" instead of "Call", and schema leaves out `telephone` |
| Email | `src/config/site.ts` → `email` | Pre-filled with `justin@benchmarkdigital.agency`. Confirm |
| Calendly link | `src/config/site.ts` → `calendlyUrl` | `/contact` shows a labelled placeholder box until set |
| Photo of Justin | `src/pages/about.astro` | 4:5 placeholder box. Use `<Image>` from `astro:assets` |
| Short bio | `src/pages/about.astro` | Placeholder box above "How I work" |
| Final logo | `public/brand/mark.svg` + `src/components/Logo.astro` | Current mark is a simple vector benchmark disc. Re-run `bun run brand` and `bun run og` after changing it |
| Sample report screenshot | `src/pages/how-it-works.astro` (#reporting) | Placeholder box |
| Social links | `src/config/site.ts` → `links.facebook`, `links.googleBusinessProfile` | Used in schema `sameAs` |
| Privacy effective date | `src/pages/privacy.astro` → `effective` | Currently "TBD" |
| Response time promise | `src/config/site.ts` → `responseTime` | "within one business day" on the thank-you and free-scan pages |
| Client stories / reviews | `src/pages/index.astro` | Hidden placeholder section. Add only real, permissioned stories |

## Cloudflare setup

| What | Where |
| --- | --- |
| Turnstile site key + secret | Pages env vars `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` |
| n8n webhook URL + secret | Pages env vars `N8N_LEAD_WEBHOOK_URL`, `N8N_LEAD_WEBHOOK_SECRET` (an n8n workflow still needs to be built) |
| Clicky site ID | Pages env var `PUBLIC_CLICKY_SITE_ID` |

## Copy decisions to confirm

The brief didn't settle these, so the site makes an assumption. Change it if it's wrong.

- **Leads & Loyalty term.** The brief gives terms only for the other plans. The card shows no term, and the comparison table says "Ask".
- **Comparison table cells inferred from the plan summaries** (edit in `plans.json` → `comparison`):
  review monitoring and responses and the monthly insights report are marked included on every paid plan.
  Growth Builder is marked as having a stock-based logo, 50 citations and hosting. Leads & Loyalty is marked
  as having weekly Google and Facebook posts, automated review invitations and 50 citations. Every plan includes
  the review app and the Local Legends feature.
- **Authority Signals.** The brief names this section but doesn't define it. The Plans page treats it as
  citations + local backlinks (+ GeoGrid tracking) by plan.
- **Google profile ownership FAQ.** The home page says the profile stays in the owner's name and we're added as a manager.
- **Local Legends.** It's described as part of the free offer, with "features are never sold" and "paying clients get no special treatment".
- **Example searches** on the industry pages are labelled as examples, not data.
