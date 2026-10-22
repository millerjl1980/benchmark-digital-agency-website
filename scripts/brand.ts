/**
 * Renders the raster brand files from public/brand/mark.svg:
 *   public/favicon-32.png, public/apple-touch-icon.png, public/brand/mark.png
 * The social card (public/brand/og-image.png) is rendered by scripts/og.ts.
 * Run with `bun run brand` after changing the mark or the OG text.
 */
import sharp from 'sharp';

const mark = await Bun.file('public/brand/mark.svg').text();

await sharp(Buffer.from(mark)).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(mark)).resize(512, 512).png().toFile('public/brand/mark.png');
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#101c2e' } })
  .composite([{ input: await sharp(Buffer.from(mark)).resize(140, 140).png().toBuffer(), top: 20, left: 20 }])
  .png()
  .toFile('public/apple-touch-icon.png');

console.log('Brand files written');
