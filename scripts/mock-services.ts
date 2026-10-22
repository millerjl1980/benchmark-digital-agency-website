/**
 * Local stand-ins for the two outside services the lead function calls, for end-to-end tests:
 *   POST /siteverify    fake Turnstile: success when the token is "pass" or Cloudflare's test token
 *   POST /relay/siteverify  forwards to Cloudflare's REAL siteverify. wrangler's local runtime ignores
 *                       HTTPS_PROXY, so behind a proxy point TURNSTILE_VERIFY_URL here to test real verification
 *   POST /test-webhook  fake n8n: checks X-Webhook-Secret and appends each lead to .wrangler/test-leads.jsonl
 * Run: bun scripts/mock-services.ts   (listens on :8799)
 */
const SECRET = process.env.N8N_LEAD_WEBHOOK_SECRET ?? 'change-me';
const log = '.wrangler/test-leads.jsonl';

Bun.serve({
  port: 8799,
  hostname: '0.0.0.0',
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'POST' && url.pathname === '/siteverify') {
      const form = await req.formData();
      const token = String(form.get('response') ?? '');
      const success = token === 'pass' || token === 'XXXX.DUMMY.TOKEN.XXXX';
      return Response.json(success ? { success } : { success, 'error-codes': ['invalid-input-response'] });
    }
    if (req.method === 'POST' && url.pathname === '/relay/siteverify') {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: await req.formData() });
      const body = await res.text();
      console.log('siteverify relay', res.status, body.slice(0, 200));
      return new Response(body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }
    if (req.method === 'POST' && url.pathname === '/test-webhook') {
      if (req.headers.get('X-Webhook-Secret') !== SECRET) return new Response('bad secret', { status: 401 });
      const body = await req.text();
      const file = Bun.file(log);
      await Bun.write(log, ((await file.exists()) ? await file.text() : '') + body + '\n');
      console.log('lead received', body.slice(0, 200));
      return Response.json({ received: true });
    }
    return new Response('not found', { status: 404 });
  },
});
console.log('mock services on :8799');
