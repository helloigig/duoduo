import { SITE } from '@/lib/site';

// Open to search engines and AI crawlers alike; only the brief endpoint is off-limits.
export default function robots() {
    return {
        rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
        sitemap: `${SITE.url.replace(/\/$/, '')}/sitemap.xml`,
        host: SITE.url,
    };
}
