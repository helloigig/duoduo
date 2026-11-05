// Share images (1200×630 JPG) for link previews: one per project from its first tile, plus the homepage.
//   node scripts/build-og-images.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PROJECTS } from '../src/lib/site.js';

const OUT = path.resolve('public/og');
fs.mkdirSync(OUT, { recursive: true });
const make = async (src, out) => {
    const info = await sharp(path.resolve('public' + src)).resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
        .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, out));
    console.log(out, Math.round(info.size / 1024) + 'KB');
};
for (const p of PROJECTS) if (p.images?.[0]) await make(p.images[0].src, `${p.key}.jpg`);
await make(PROJECTS[0].images[0].src, 'home.jpg');
