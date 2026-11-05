// Builds every homepage project image as a uniform 4:3 tile (1600×1200 + 800×600 WebP).
//
//   node scripts/build-project-images.mjs <sourceDir> [<sourceDir2> …]
//
// Source files are Figma exports named like the outputs (e.g. fenway-1.jpg, widget-2.png,
// dify-3.jpg). When a name exists in several source dirs, the later dir wins (use it for
// higher-resolution re-exports).
//
// Three treatments, so the gallery reads as one set:
//   cover — 4:3-ish work, cropped to 4:3 around the most detailed region
//   frame — wide slides (16:9), shown whole as a card on the board
//   phone — a single phone screen, whole, on a light board with rounded corners + shadow
//   page  — a long web page, cut into sections, each shown as a page card on the board

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve('public/projects');
const W = 1600, H = 1200;
const BOARD = '#ececec';

const JOBS = [
    // name, treatment, options
    ['vision-1', 'cover'], ['vision-2', 'cover'],
    ['basecamp-1', 'cover'], ['basecamp-2', 'frame'], ['basecamp-3', 'cover'],
    ['fenway-1', 'cover'], ['fenway-2', 'frame'], ['fenway-3', 'cover'], ['fenway-4', 'cover'],
    ['data-1', 'frame'],
    ['arsenal-1', 'frame'], ['arsenal-2', 'frame'],
    ['characters-1', 'cover'],
    ['widget-0', 'cover'],
    ['widget-1', 'phone'], ['widget-2', 'phone'], ['widget-3', 'phone'], ['widget-4', 'phone'],
    ['cuto-1', 'cover'], ['bloc-1', 'cover'], ['workspace-1', 'cover'], ['ult-1', 'cover'], ['wwdc-1', 'cover'],
    ['dify-1', 'page'], ['dify-2', 'page'], ['dify-3', 'page'], ['dify-4', 'page'],
];

const dirs = process.argv.slice(2);
if (!dirs.length) { console.error('usage: node scripts/build-project-images.mjs <sourceDir> …'); process.exit(1); }
const findSource = (name) => {
    let hit = null;
    for (const d of dirs) for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
        const f = path.join(d, name + ext);
        if (fs.existsSync(f)) hit = f;
    }
    if (!hit) throw new Error(`No source for ${name}`);
    return hit;
};

const shadowSvg = (w, h, r, x, y) => Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
       <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter></defs>
       <rect x="${x}" y="${y + 18}" width="${w}" height="${h}" rx="${r}" fill="rgba(0,0,0,0.16)" filter="url(#s)"/>
     </svg>`
);
const roundMask = (w, h, r, { bottom = true } = {}) => Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
       ${bottom
        ? `<rect width="${w}" height="${h}" rx="${r}" fill="#fff"/>`
        : `<path d="M0 ${r} Q0 0 ${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h} H0 Z" fill="#fff"/>`}
     </svg>`
);
const rounded = async (buf, w, h, r, opts) =>
    sharp(buf).resize(w, h).composite([{ input: roundMask(w, h, r, opts), blend: 'dest-in' }]).png().toBuffer();

const board = () => sharp({ create: { width: W, height: H, channels: 3, background: BOARD } });

async function cover(src) {
    return sharp(src).resize(W, H, { fit: 'cover', position: sharp.strategy.attention }).flatten({ background: '#fff' });
}

async function frame(src) {
    const meta = await sharp(src).metadata();
    const fw = 1440, fh = Math.round(fw * meta.height / meta.width);
    const x = Math.round((W - fw) / 2), y = Math.round((H - fh) / 2);
    const card = await rounded(await sharp(src).flatten({ background: '#fff' }).toBuffer(), fw, fh, 10);
    return board().composite([{ input: shadowSvg(fw, fh, 10, x, y) }, { input: card, left: x, top: y }]);
}

async function phone(src) {
    const ph = 1040, meta = await sharp(src).metadata();
    const pw = Math.round(ph * meta.width / meta.height);
    const x = Math.round((W - pw) / 2), y = Math.round((H - ph) / 2);
    const screen = await rounded(await sharp(src).flatten({ background: '#fff' }).toBuffer(), pw, ph, 56);
    return board().composite([{ input: shadowSvg(pw, ph, 56, x, y) }, { input: screen, left: x, top: y }]);
}

// One long page → three cards (top, middle, lower)
async function pages(src) {
    const cw = 1080, top = 110, ch = H - top;
    const meta = await sharp(src).metadata();
    const sliceH = Math.round(ch * meta.width / cw);
    const span = Math.max(0, meta.height - sliceH);
    const offsets = [0, Math.round(span * 0.42), Math.round(span * 0.84)];
    const x = Math.round((W - cw) / 2);
    return Promise.all(offsets.map(async (o) => {
        const part = await sharp(src).extract({ left: 0, top: o, width: meta.width, height: Math.min(sliceH, meta.height - o) })
            .flatten({ background: '#fff' }).toBuffer();
        const card = await rounded(part, cw, ch, 18, { bottom: false });
        return board().composite([{ input: shadowSvg(cw, ch + 40, 18, x, top) }, { input: card, left: x, top }]);
    }));
}

async function write(img, name) {
    const buf = await img.png().toBuffer();
    const big = await sharp(buf).webp({ quality: 80 }).toFile(path.join(OUT, `${name}.webp`));
    const small = await sharp(buf).resize(800, 600).webp({ quality: 78 }).toFile(path.join(OUT, `${name}-800.webp`));
    console.log(`${name}.webp ${Math.round(big.size / 1024)}KB · -800 ${Math.round(small.size / 1024)}KB`);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [name, kind] of JOBS) {
    const src = findSource(name);
    if (kind === 'cover') await write(await cover(src), name);
    if (kind === 'frame') await write(await frame(src), name);
    if (kind === 'phone') await write(await phone(src), name);
    if (kind === 'page') {
        const parts = await pages(src);
        for (const [i, p] of parts.entries()) await write(p, `${name}-${'abc'[i]}`);
    }
}
