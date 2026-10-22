/**
 * Renders public/brand/og-image.png (1200×630) through the Browserless service so the real web fonts are used.
 * Needs BROWSERLESS_TOKEN and BROWSERLESS_URL (default http://browserless:3000). Run: bun scripts/og.ts
 */
const b64 = async (p: string) => Buffer.from(await Bun.file(p).arrayBuffer()).toString('base64');
const zilla = await b64('public/fonts/zilla-slab-latin-700-normal.woff2');
const sans = await b64('public/fonts/source-sans-3-latin-wght-normal.woff2');
const mark = await Bun.file('public/brand/mark.svg').text();
const contours = (await Bun.file('public/brand/contours.svg').text()).replace('stroke-opacity=".13"', 'stroke-opacity=".2"');

const dots: string[] = [];
for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
  const d = Math.hypot(x - 3.6, y - 4.4) + Math.sin(x * 12.9898 + y * 78.233) * 0.4;
  const c = d < 2.4 ? '#2e9e5e' : d < 3.6 ? '#9fd3b2' : '#3a4b66';
  dots.push(`<circle cx="${20 + x * 42}" cy="${20 + y * 42}" r="13" fill="${c}"/>`);
}

const html = `<!doctype html><html><head><style>
@font-face{font-family:Zilla;src:url(data:font/woff2;base64,${zilla}) format('woff2');font-weight:700}
@font-face{font-family:Sans;src:url(data:font/woff2;base64,${sans}) format('woff2-variations');font-weight:200 900}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:#101c2e;color:#f7f3ea;font-family:Sans;position:relative}
.contours{position:absolute;left:-380px;top:-220px;width:950px;height:950px}
.contours svg{width:100%;height:100%}
.brand{position:absolute;left:80px;top:72px;display:flex;align-items:center;gap:22px;font:700 44px Zilla}
.brand svg{width:88px;height:88px}.brand span{color:#c9973f}
h1{position:absolute;left:80px;top:205px;width:640px;margin:0;font:700 66px/1.06 Zilla;letter-spacing:-.5px}
p{position:absolute;left:80px;top:470px;width:640px;margin:0;font-size:28px;font-weight:500;color:#b8c0cc}
.grid{position:absolute;right:70px;top:115px;width:378px;height:378px}
.rule{position:absolute;left:80px;bottom:0;width:120px;height:8px;background:#c9973f}
</style></head><body>
<div class="contours">${contours}</div>
<div class="brand">${mark}<div>Benchmark <span>Digital</span></div></div>
<h1>Be the first name neighbors find on Google.</h1>
<p>Local marketing for service businesses in Franklin Township, Beech Grove and Greenwood.</p>
<svg class="grid" viewBox="0 0 378 378">${dots.join('')}</svg>
<div class="rule"></div>
</body></html>`;

const base = process.env.BROWSERLESS_URL ?? 'http://browserless:3000';
const res = await fetch(`${base}/screenshot?token=${process.env.BROWSERLESS_TOKEN}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ html, options: { type: 'png' }, viewport: { width: 1200, height: 630 } }),
});
if (!res.ok) throw new Error(`Browserless ${res.status}: ${await res.text()}`);
await Bun.write('public/brand/og-image.png', await res.arrayBuffer());
console.log('wrote public/brand/og-image.png');
