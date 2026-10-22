/**
 * POST /api/lead  (Cloudflare Pages Function)
 *
 * Validates the lead form, verifies Cloudflare Turnstile, and forwards the lead as JSON
 * to an n8n webhook with a secret header. Nothing secret ever reaches the browser.
 *
 * Environment variables (Pages > Settings > Variables and Secrets; locally in .dev.vars):
 *   N8N_LEAD_WEBHOOK_URL     n8n production webhook URL
 *   N8N_LEAD_WEBHOOK_SECRET  sent as the X-Webhook-Secret header; check it in n8n (Header Auth)
 *   TURNSTILE_SECRET_KEY     Turnstile secret. Required: without it every lead is rejected.
 *   TURNSTILE_VERIFY_URL     optional, local testing only: point siteverify at a mock (see scripts/mock-services.ts)
 *
 * Responds with JSON when the request sends `Accept: application/json` (the site's form script),
 * otherwise redirects: 303 to /thank-you on success, or back to the form with ?error=1.
 */

interface Env {
  N8N_LEAD_WEBHOOK_URL?: string;
  N8N_LEAD_WEBHOOK_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_VERIFY_URL?: string;
}

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const SOURCES = ['free-scan', 'contact', 'plans'] as const;
const PLANS = ['free', 'maps-reviews', 'local-essentials', 'growth-builder', 'leads-loyalty'];
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

const FIELDS = {
  businessName: { max: 120, required: true, label: 'Business name' },
  ownerName: { max: 120, required: true, label: 'Your name' },
  email: { max: 160, required: true, label: 'Email' },
  phone: { max: 30, required: true, label: 'Phone' },
  category: { max: 60, required: true, label: 'Type of business' },
  gbp: { max: 500, required: true, label: 'Google Business Profile link or address' },
  contactTime: { max: 60, required: true, label: 'Best time to reach you' },
  plan: { max: 40, required: false, label: 'Plan' },
  message: { max: 2000, required: false, label: 'Message' },
} as const;
type Field = keyof typeof FIELDS;

const GENERIC_ERROR = 'Something went wrong on our end.';

function reply(request: Request, ok: boolean, error?: string, status = ok ? 200 : 400): Response {
  if ((request.headers.get('Accept') ?? '').includes('application/json')) {
    return Response.json(ok ? { ok } : { ok, error }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
  let back = '/contact';
  try {
    const ref = new URL(request.headers.get('Referer') ?? '');
    if (ref.origin === new URL(request.url).origin) back = ref.pathname;
  } catch {}
  const to = ok ? '/thank-you' : `${back}?error=1`;
  return Response.redirect(new URL(to, request.url).toString(), 303);
}

function parseJson(value: string): Record<string, unknown> {
  try {
    const v = JSON.parse(value);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

async function verifyTurnstile(url: string, token: string, secret: string, ip: string): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch(url, { method: 'POST', body });
    const result = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
    if (!result.success) console.warn('Turnstile rejected', result['error-codes']);
    return result.success === true;
  } catch (err) {
    console.error('Turnstile verify failed', err);
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(request, false, 'That form submission was empty.');
  }

  // Honeypot: people never see this field. Pretend it worked so bots move on.
  if (String(form.get('website') ?? '').trim()) return reply(request, true);

  const lead = {} as Record<Field, string>;
  for (const [name, rule] of Object.entries(FIELDS) as [Field, (typeof FIELDS)[Field]][]) {
    const value = String(form.get(name) ?? '').trim();
    if (rule.required && !value) return reply(request, false, `${rule.label} is required.`);
    if (value.length > rule.max) return reply(request, false, `${rule.label} is too long.`);
    lead[name] = value;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) return reply(request, false, 'Please check your email address.');
  if (lead.phone.replace(/\D/g, '').length < 10) return reply(request, false, 'Please include your area code in the phone number.');
  if (lead.plan && !PLANS.includes(lead.plan)) lead.plan = '';

  const sourceRaw = String(form.get('source') ?? '');
  const source = (SOURCES as readonly string[]).includes(sourceRaw) ? sourceRaw : 'contact';

  // UTM parameters: from the form's hidden field (captured on landing) and the page URL as a fallback
  const utmIn = parseJson(String(form.get('utm') ?? ''));
  let refererParams = new URLSearchParams();
  try { refererParams = new URL(request.headers.get('Referer') ?? '').searchParams; } catch {}
  const utm: Record<string, string> = {};
  for (const k of UTM_KEYS) {
    const v = utmIn[k] ?? refererParams.get(k);
    if (typeof v === 'string' && v) utm[k] = v.slice(0, 200);
  }
  const pageIn = parseJson(String(form.get('page') ?? ''));
  const ctx = (k: string) => (typeof pageIn[k] === 'string' ? (pageIn[k] as string).slice(0, 300) : '');

  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not set; rejecting lead');
    return reply(request, false, GENERIC_ERROR, 500);
  }
  const token = String(form.get('cf-turnstile-response') ?? '');
  if (!token || !(await verifyTurnstile(env.TURNSTILE_VERIFY_URL || SITEVERIFY, token, env.TURNSTILE_SECRET_KEY, ip))) {
    return reply(request, false, 'The spam check failed. Please try again.', 403);
  }

  if (!env.N8N_LEAD_WEBHOOK_URL) {
    console.error('N8N_LEAD_WEBHOOK_URL is not set; lead not delivered', lead.email);
    return reply(request, false, GENERIC_ERROR, 500);
  }

  const payload = {
    ...lead,
    source,
    utm,
    page: ctx('page'),
    landingPage: ctx('landing'),
    referrer: ctx('referrer'),
    submittedAt: new Date().toISOString(),
    ip,
    country: request.headers.get('CF-IPCountry') ?? '',
    userAgent: (request.headers.get('User-Agent') ?? '').slice(0, 300),
    site: 'benchmarkdigital.agency',
  };

  try {
    const res = await fetch(env.N8N_LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.N8N_LEAD_WEBHOOK_SECRET ?? '',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Lead webhook failed', res.status, (await res.text()).slice(0, 500));
      return reply(request, false, GENERIC_ERROR, 502);
    }
  } catch (err) {
    console.error('Lead webhook unreachable', err);
    return reply(request, false, GENERIC_ERROR, 502);
  }

  return reply(request, true);
};

export const onRequest: PagesFunction<Env> = async () =>
  new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
