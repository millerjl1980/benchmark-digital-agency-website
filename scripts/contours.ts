// Generates public/brand/contours.svg, the faint topographic texture used on dark sections.
const rings = 9;
const paths: string[] = [];
for (let r = 0; r < rings; r++) {
  const base = 60 + r * 46;
  const pts: string[] = [];
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const wobble = 1 + 0.09 * Math.sin(a * 3 + r * 0.7) + 0.05 * Math.cos(a * 5 - r * 0.4);
    const x = 450 + Math.cos(a) * base * wobble * 1.15;
    const y = 450 + Math.sin(a) * base * wobble;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  paths.push(`<polyline points="${pts.join(' ')}"/>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" fill="none" stroke="#c9973f" stroke-opacity=".13" stroke-width="1.5">${paths.join('')}</svg>\n`;
await Bun.write('public/brand/contours.svg', svg);
console.log('wrote public/brand/contours.svg', svg.length, 'bytes');
