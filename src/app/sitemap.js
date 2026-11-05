import { SITE, PROJECTS } from '@/lib/site';

const base = SITE.url.replace(/\/$/, '');

export default function sitemap() {
    const now = new Date();
    return [
        { url: `${base}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
        ...PROJECTS.map((p) => ({
            url: `${base}/work/${p.key}`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: p.group === 'selected' ? 0.8 : 0.6,
            images: p.images?.map((img) => `${base}${img.src}`),
        })),
    ];
}
