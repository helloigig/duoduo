// One page per project: /work/<slug>. Fully server-rendered for search and AI crawlers.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE, PROJECTS, projectBySlug, tagLabel } from '@/lib/site';
import '@/styles/site.css';

export const dynamicParams = false;

export function generateStaticParams() {
    return PROJECTS.map((p) => ({ slug: p.key }));
}

const summary = (p) => {
    const scope = p.disciplines ? ` Scope: ${p.disciplines}.` : '';
    return `${p.description || p.title}${scope} A project by duoduo, product engineering studio.`.slice(0, 300);
};

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const p = projectBySlug(slug);
    if (!p) return {};
    const title = `${p.title} — duoduo`;
    const image = p.images?.[0] ? `/og/${p.key}.jpg` : undefined;
    return {
        title,
        description: summary(p),
        alternates: { canonical: `/work/${p.key}` },
        openGraph: {
            title,
            description: summary(p),
            url: `/work/${p.key}`,
            type: 'article',
            images: image ? [{ url: image, width: 1200, height: 630, alt: `${p.title}, by duoduo` }] : undefined,
        },
        twitter: { card: 'summary_large_image', title, description: summary(p), images: image ? [image] : undefined },
    };
}

export default async function ProjectPage({ params }) {
    const { slug } = await params;
    const p = projectBySlug(slug);
    if (!p) notFound();

    const i = PROJECTS.indexOf(p);
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length];
    const url = `${SITE.url.replace(/\/$/, '')}/work/${p.key}`;
    const fullPage = p.images?.find((img) => img.full)?.full;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CreativeWork',
                '@id': `${url}#work`,
                name: p.title,
                url,
                description: p.description,
                dateCreated: p.years || undefined,
                image: p.images?.map((img) => `${SITE.url.replace(/\/$/, '')}${img.src}`),
                keywords: [p.disciplines, ...p.tags.map(tagLabel)].filter(Boolean).join(', '),
                creator: { '@id': `${SITE.url}#studio` },
                ...(p.client && p.client !== p.title && p.client !== 'Self initiated'
                    ? { sourceOrganization: { '@type': 'Organization', name: p.client } }
                    : {}),
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'duoduo', item: SITE.url },
                    { '@type': 'ListItem', position: 2, name: 'Work', item: `${SITE.url.replace(/\/$/, '')}/#top` },
                    { '@type': 'ListItem', position: 3, name: p.title, item: url },
                ],
            },
        ],
    };

    return (
        <div className="dd dd-project">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <header className="site-header is-visible">
                <Link className="h2" href="/">{SITE.name}</Link>
                <span className="h2 muted site-header__role">{SITE.role}</span>
                <a className="h2 muted" href={SITE.contact} target="_blank" rel="noopener noreferrer">Contact</a>
            </header>

            <main className="project">
                <nav className="project__crumbs h3" aria-label="Breadcrumb">
                    <Link href="/" className="muted">Work</Link>
                    <span className="muted" aria-hidden="true"> / </span>
                    <span>{p.title}</span>
                </nav>

                <h1 className="h1 project__title">{p.title}</h1>

                <dl className="project__facts">
                    {p.client && p.client !== p.title ? <div><dt className="h3 muted">Client</dt><dd className="h2">{p.client}</dd></div> : null}
                    {p.years ? <div><dt className="h3 muted">Year</dt><dd className="h2">{p.years}</dd></div> : null}
                    {p.disciplines ? <div><dt className="h3 muted">Scope</dt><dd className="h2">{p.disciplines}</dd></div> : null}
                    <div><dt className="h3 muted">Discipline</dt><dd className="h2">{p.tags.map(tagLabel).join(', ')}</dd></div>
                </dl>

                {p.description ? <p className="h1 project__desc">{p.description}</p> : null}

                <section className="project__images" aria-label={`${p.title} images`}>
                    {p.images?.map((img, n) => (
                        <figure key={img.src} className={n === 0 && p.images.length % 2 === 1 ? 'is-lead' : ''}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.src}
                                srcSet={`${img.small} 800w, ${img.src} 1600w`}
                                sizes={n === 0 && p.images.length % 2 === 1 ? '100vw' : '(max-width: 767px) 100vw, 50vw'}
                                alt={`${p.title} by duoduo — ${p.disciplines || 'project'}, image ${n + 1} of ${p.images.length}`}
                                width={1600}
                                height={1200}
                                loading={n === 0 ? 'eager' : 'lazy'}
                                decoding="async"
                            />
                            <figcaption className="h3">{n + 1}/{p.images.length}</figcaption>
                        </figure>
                    ))}
                </section>

                {fullPage ? (
                    <section className="project__fullpage" aria-label="Full page">
                        <h2 className="h3">Full page</h2>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fullPage} alt={`${p.title} — full page design by duoduo`} loading="lazy" decoding="async" />
                    </section>
                ) : null}

                <nav className="project__pager" aria-label="More projects">
                    <Link className="h2" href={`/work/${prev.key}`}><span className="h3 muted">Previous</span>{prev.title}</Link>
                    <Link className="h2" href={`/work/${next.key}`}><span className="h3 muted">Next</span>{next.title}</Link>
                </nav>

                <footer className="list__foot project__foot">
                    <Link className="h2" href="/#brief-title">Start a project with duoduo →</Link>
                    <span className="h2 muted">London &amp; Shenzhen</span>
                </footer>
            </main>
        </div>
    );
}
