'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SITE, PROJECTS, STUDIO } from '@/lib/site';
import Brief from '@/components/Brief';
import '@/styles/site.css';

const base = SITE.url.replace(/\/$/, '');
// Structured data: who the studio is and what it has made (read by search and AI answer engines)
const STUDIO_LD = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': ['Organization', 'ProfessionalService'],
            '@id': `${SITE.url}#studio`,
            name: SITE.name,
            url: SITE.url,
            description: SITE.intro.replace(/[[\]]/g, ''),
            slogan: SITE.role,
            founder: STUDIO.founders.map((name) => ({ '@type': 'Person', name })),
            areaServed: 'Worldwide',
            location: STUDIO.locations.map((addressLocality) => ({ '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality } })),
            knowsAbout: STUDIO.services,
            hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Services',
                itemListElement: STUDIO.services.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
            },
        },
        { '@type': 'WebSite', '@id': `${SITE.url}#site`, url: SITE.url, name: SITE.name, publisher: { '@id': `${SITE.url}#studio` } },
        {
            '@type': 'ItemList',
            name: 'duoduo projects',
            itemListElement: PROJECTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${base}/work/${p.key}`, name: p.title })),
        },
    ],
};

const tagById = Object.fromEntries(SITE.tags.map((t) => [t.id, t]));
const ALL = PROJECTS;
let revealIO = null;
const observeReveal = (el) => {
    if (!el || typeof window === 'undefined' || !document.querySelector('.dd.js-motion')) return;
    revealIO ??= new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) { e.target.dataset.in = ''; revealIO.unobserve(e.target); }
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    revealIO.observe(el);
};
const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const openCall = (e) => {
    e?.preventDefault();
    window.dispatchEvent(new CustomEvent('open-cal'));
};

// "[word]" in copy renders grey; every word is its own span for the load-in reveal
function Highlighted({ text }) {
    let n = 0;
    return text.split(/\[([^\]]+)\]/g).map((part, i) => {
        const words = part.split(/(\s+)/).map((w, j) =>
            /^\s+$/.test(w) || !w ? <Fragment key={j}>{w}</Fragment> : <span key={j} className="w" style={{ '--i': n++ }}>{w}</span>
        );
        return i % 2 ? <span key={i} className="hl">{words}</span> : <Fragment key={i}>{words}</Fragment>;
    });
}

// Desktop: a small preview of the hovered project follows the cursor (Figma "Desktop - 100")
function HoverPreview({ listRef, openKey }) {
    const cardRef = useRef(null);
    const [key, setKey] = useState(null);
    const keyRef = useRef(null);
    const target = useRef({ x: 0, y: 0 });
    const pos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const list = listRef.current;
        const fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 768px)');
        if (!list || !fine.matches) return;
        let raf = 0;
        const still = reducedMotion();
        const tick = () => {
            const k = still ? 1 : 0.18;
            pos.current.x += (target.current.x - pos.current.x) * k;
            pos.current.y += (target.current.y - pos.current.y) * k;
            if (cardRef.current) cardRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
            raf = requestAnimationFrame(tick);
        };
        const onMove = (e) => {
            const btn = e.target.closest?.('.row__btn');
            const row = btn?.closest('.row');
            const k = row && !row.classList.contains('is-open') ? row.dataset.key : null;
            target.current = { x: e.clientX + 28, y: e.clientY - 70 };
            if (!keyRef.current && k) pos.current = { ...target.current };
            if (keyRef.current !== k) { keyRef.current = k; setKey(k); }
        };
        const onLeave = () => { keyRef.current = null; setKey(null); };
        list.addEventListener('pointermove', onMove);
        list.addEventListener('pointerleave', onLeave);
        window.addEventListener('scroll', onLeave, { passive: true });
        raf = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(raf);
            list.removeEventListener('pointermove', onMove);
            list.removeEventListener('pointerleave', onLeave);
            window.removeEventListener('scroll', onLeave);
        };
    }, [listRef]);

    const shown = key && key !== openKey;
    return (
        <div className={`hover-preview${shown ? ' is-on' : ''}`} ref={cardRef} aria-hidden="true">
            {ALL.filter((p) => p.images?.length).map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.key} src={p.images[0].src} alt="" className={p.key === key ? 'is-active' : ''} loading="lazy" decoding="async" />
            ))}
        </div>
    );
}

function Dots({ tags }) {
    const label = tags.map((id) => tagById[id]?.label).join(', ');
    return (
        <span className="dots" role="img" aria-label={label} title={label}>
            {tags.map((id) => <i key={id} style={{ '--c': tagById[id]?.color }} />)}
        </span>
    );
}

function Tile({ img, alt, className = 'tile' }) {
    const [loaded, setLoaded] = useState(false);
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            className={`${className}${loaded ? ' is-loaded' : ''}`}
            src={img.src}
            srcSet={img.small ? `${img.small} 800w, ${img.src} 1600w` : undefined}
            sizes="(max-width: 767px) 291px, 571px"
            alt={alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => setLoaded(true)}
            ref={(el) => { if (el?.complete && el.naturalWidth && !loaded) setLoaded(true); }}
        />
    );
}

function Gallery({ project, onOpenImage }) {
    const ref = useRef(null);
    const dragged = useRef(false);
    const [edges, setEdges] = useState({ start: true, end: false });
    const images = project.images || [];

    const updateEdges = useCallback(() => {
        const g = ref.current;
        if (!g) return;
        setEdges({ start: g.scrollLeft <= 4, end: g.scrollLeft + g.clientWidth >= g.scrollWidth - 4 });
    }, []);

    useEffect(() => {
        updateEdges();
        const g = ref.current;
        const ro = new ResizeObserver(updateEdges);
        if (g) ro.observe(g);
        return () => ro.disconnect();
    }, [updateEdges]);

    // Drag to scroll with a mouse; a drag never counts as a click
    const onPointerDown = (e) => {
        const g = ref.current;
        if (!g || e.pointerType !== 'mouse' || e.button !== 0) return;
        const x0 = e.clientX, s0 = g.scrollLeft;
        dragged.current = false;
        const move = (ev) => {
            const dx = ev.clientX - x0;
            if (Math.abs(dx) > 5) { dragged.current = true; g.classList.add('is-dragging'); }
            if (dragged.current) g.scrollLeft = s0 - dx;
        };
        const up = () => {
            g.classList.remove('is-dragging');
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    const page = (dir) => {
        const g = ref.current;
        if (g) g.scrollBy({ left: dir * g.clientWidth * 0.8, behavior: reducedMotion() ? 'auto' : 'smooth' });
    };

    return (
        <div className="gallery-wrap">
            <div
                className="gallery"
                ref={ref}
                onPointerDown={onPointerDown}
                onScroll={updateEdges}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') { e.preventDefault(); page(1); }
                    if (e.key === 'ArrowLeft') { e.preventDefault(); page(-1); }
                }}
                tabIndex={0}
                role="group"
                aria-label={`${project.title} images`}
            >
                {images.map((img, i) => (
                    <figure key={img.src} style={{ '--i': i }}>
                        <button
                            type="button"
                            className="tile-btn"
                            onClick={() => { if (!dragged.current) onOpenImage(i); }}
                            aria-label={`Open ${project.title} image ${i + 1} full screen`}
                        >
                            <Tile img={img} alt={`${project.title}, image ${i + 1}`} />
                        </button>
                        <figcaption className="h3">{i + 1}/{images.length}</figcaption>
                    </figure>
                ))}
            </div>
            {images.length > 1 && (
                <>
                    <button type="button" className="gallery__nav gallery__nav--prev h3" onClick={() => page(-1)} hidden={edges.start} aria-label="Previous images">←</button>
                    <button type="button" className="gallery__nav gallery__nav--next h3" onClick={() => page(1)} hidden={edges.end} aria-label="Next images">→</button>
                </>
            )}
        </div>
    );
}

function Row({ project, open, onToggle, onOpenImage, hidden, index }) {
    const id = `panel-${project.key}`;
    const showClient = project.client && project.client !== project.title;
    return (
        <li ref={observeReveal} className={`row${open ? ' is-open' : ''}`} hidden={hidden} id={project.key} data-key={project.key} style={{ '--i': index }}>
            <button className="row__btn h2" type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>
                <span className="row__name"><span>{project.title}</span><Dots tags={project.tags} /></span>
                <span className="row__client">{showClient ? project.client : ''}</span>
                <span className="row__years">{project.years}</span>
            </button>
            <div className="row__panel" id={id} inert={!open}>
                <div className="row__inner">
                    <div className="row__content">
                        {project.images?.length ? <Gallery project={project} onOpenImage={onOpenImage} /> : null}
                        <div className="details">
                            <p className="h2 desc">{project.description}</p>
                            <div className="details__meta">
                                <span className="h3 muted">Scope</span>
                                <span className="h3">{project.disciplines}</span>
                            </div>
                            <div className="details__meta">
                                <Link className="h3 details__more" href={`/work/${project.key}`}>View project →</Link>
                                {project.links?.length ? (
                                    <>
                                        <span className="h3 muted">Links</span>
                                        {project.links.map((l) => (
                                            <a key={l.href} className="h3" href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
                                        ))}
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
}

function Lightbox({ view, onClose }) {
    const ref = useRef(null);
    const trackRef = useRef(null);
    const [index, setIndex] = useState(0);
    const project = view?.project;
    const count = project?.images.length || 0;

    const goTo = useCallback((i, smooth = true) => {
        const t = trackRef.current;
        const item = t?.children[i];
        if (!item) return;
        t.scrollTo({ left: item.offsetLeft - t.offsetLeft - 12, behavior: smooth && !reducedMotion() ? 'smooth' : 'auto' });
    }, []);

    useEffect(() => {
        const d = ref.current;
        if (view && d && !d.open) {
            d.showModal();
            requestAnimationFrame(() => { setIndex(view.index); goTo(view.index, false); });
        }
        if (!view && d?.open) d.close();
    }, [view, goTo]);

    // Track which image is in view for the counter
    const onScroll = () => {
        const t = trackRef.current;
        if (!t) return;
        const mid = t.scrollLeft + t.clientWidth / 3;
        let i = 0;
        [...t.children].forEach((c, n) => { if (c.offsetLeft - t.offsetLeft <= mid) i = n; });
        setIndex(i);
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.min(index + 1, count - 1)); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(Math.max(index - 1, 0)); }
    };

    return (
        <dialog
            className="lightbox"
            ref={ref}
            aria-label={project ? `${project.title} images` : 'Images'}
            onClose={onClose}
            onKeyDown={onKeyDown}
            onClick={(e) => e.target === ref.current && onClose()}
        >
            <div className="lightbox__bar">
                <span className="h3">{project?.title}</span>
                <span className="h3 muted" aria-live="polite">{count ? `${index + 1}/${count}` : ''}</span>
                <span className="lightbox__actions">
                    <button className="h3" type="button" onClick={() => goTo(Math.max(index - 1, 0))} disabled={index === 0} aria-label="Previous image">←</button>
                    <button className="h3" type="button" onClick={() => goTo(Math.min(index + 1, count - 1))} disabled={index >= count - 1} aria-label="Next image">→</button>
                    <button className="h3" type="button" onClick={onClose}>Close</button>
                </span>
            </div>
            <div className="lightbox__track" ref={trackRef} onScroll={onScroll}>
                {project?.images.map((img, i) =>
                    img.full ? (
                        <div className="lightbox__long" key={img.src}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.full} alt={`${project.title}, page ${i + 1}`} />
                        </div>
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={img.src} className="tile tile--natural is-loaded" src={img.src} alt={`${project.title}, image ${i + 1}`} style={{ aspectRatio: img.ratio }} />
                    )
                )}
            </div>
        </dialog>
    );
}

export default function Home() {
    const [openKey, setOpenKey] = useState(null);
    const [active, setActive] = useState([]);
    const [lightbox, setLightbox] = useState(null);
    const [headerOn, setHeaderOn] = useState(false);
    const listRef = useRef(null);
    const introRef = useRef(null);
    const rootRef = useRef(null);
    const sheetRef = useRef(null);

    // Scroll: header slides in once the list covers the intro; the intro recedes as it's covered
    useEffect(() => {
        let raf = 0;
        const update = () => {
            raf = 0;
            const list = listRef.current;
            const intro = introRef.current;
            if (!list || !intro) return;
            const top = list.getBoundingClientRect().top;
            setHeaderOn(top <= 58);
            const start = intro.offsetHeight + (isMobile() ? 72 : 124);
            const p = Math.min(1, Math.max(0, 1 - (top - (isMobile() ? 65 : 0)) / start));
            rootRef.current?.style.setProperty('--intro-p', p.toFixed(3));
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        const sheet = sheetRef.current;
        window.addEventListener('scroll', onScroll, { passive: true });
        sheet?.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            sheet?.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    // Rows fade up as they scroll into view (only once JS is running, so nothing is hidden without it)
    useEffect(() => {
        const root = rootRef.current;
        if (!root || reducedMotion()) return;
        root.classList.add('js-motion');
        root.querySelectorAll('.row, .list__head, .brief, .list__foot').forEach(observeReveal);
    }, []);

    // Intro height decides where the list starts
    useEffect(() => {
        const el = introRef.current;
        if (!el) return;
        const fit = () => rootRef.current?.style.setProperty('--intro-h', `${el.offsetHeight}px`);
        const ro = new ResizeObserver(fit);
        ro.observe(el);
        fit();
        return () => ro.disconnect();
    }, []);

    // After a row opens (and any other row has finished closing), bring it into view
    const reveal = useCallback((key) => {
        setTimeout(() => {
            const row = document.getElementById(key);
            if (!row) return;
            const top = row.getBoundingClientRect().top;
            const minTop = isMobile() ? 65 : 58;
            if (top < minTop || top > window.innerHeight * 0.45) {
                const behavior = reducedMotion() ? 'auto' : 'smooth';
                if (isMobile() && sheetRef.current) {
                    sheetRef.current.scrollBy({ top: top - minTop, behavior });
                } else {
                    window.scrollBy({ top: top - minTop, behavior });
                }
            }
        }, 480);
    }, []);

    const toggle = (key) => {
        const next = openKey === key ? null : key;
        setOpenKey(next);
        history.replaceState(null, '', next ? `#${next}` : location.pathname + location.search);
        if (next) reveal(next);
    };

    // Open a project from the URL (#basecamp-research)
    useEffect(() => {
        const fromHash = () => {
            const key = decodeURIComponent(location.hash.slice(1));
            if (!key || !ALL.some((p) => p.key === key)) return;
            setOpenKey(key);
            reveal(key);
        };
        const id = setTimeout(fromHash, 0);
        window.addEventListener('hashchange', fromHash);
        return () => { clearTimeout(id); window.removeEventListener('hashchange', fromHash); };
    }, [reveal]);

    const toggleTag = (id) => setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
    const isHidden = (p) => active.length > 0 && !active.some((a) => p.tags.includes(a));
    const closeLightbox = useCallback(() => setLightbox(null), []);

    const list = (group) => {
        const projects = ALL.filter((p) => p.group === group);
        const visible = projects.filter((p) => !isHidden(p)).length;
        let shown = 0;
        return (
            <ul className="projects" data-filter={active.join(' ')}>
                {projects.map((p) => (
                    <Row
                        key={`${p.key}-${active.join('.')}`}
                        index={isHidden(p) ? 0 : shown++}
                        project={p}
                        open={openKey === p.key}
                        hidden={isHidden(p)}
                        onToggle={() => toggle(p.key)}
                        onOpenImage={(index) => setLightbox({ project: p, index })}
                    />
                ))}
                {visible === 0 && (
                    <li className="row row--empty">
                        <span className="h2 muted">Nothing here under {active.map((a) => tagById[a].label).join(' or ')}.</span>
                        <button className="h3" type="button" onClick={() => setActive([])}>Clear filter</button>
                    </li>
                )}
            </ul>
        );
    };

    return (
        <div className="dd" ref={rootRef}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STUDIO_LD) }} />
            <header className={`site-header${headerOn ? ' is-visible' : ''}`} aria-hidden={!headerOn}>
                <a className="h2" href="#top" tabIndex={headerOn ? 0 : -1}>{SITE.name}</a>
                <span className="h2 muted site-header__role">{SITE.role}</span>
                <a className="h2 muted" href={SITE.contact} onClick={openCall} tabIndex={headerOn ? 0 : -1}>Contact</a>
            </header>

            <main id="top">
                <section className="intro">
                    <h1 className="h1" ref={introRef}><Highlighted text={SITE.intro} /></h1>
                </section>

                <div className="sheet" ref={sheetRef}>
                    <div className="sheet__spacer" aria-hidden="true" />
                    <section className="list" ref={listRef} aria-labelledby="selected-title">
                        <div className="list__head">
                            <h2 className="h3" id="selected-title">Selected projects</h2>
                            <div className="tags" role="group" aria-label="Filter by discipline">
                                {SITE.tags.map((t) => (
                                    <button
                                        key={t.id}
                                        className="tag h3"
                                        type="button"
                                        style={{ '--c': t.color }}
                                        aria-pressed={active.includes(t.id)}
                                        onClick={() => toggleTag(t.id)}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                                {active.length > 0 && (
                                    <button className="tags__clear h3 muted" type="button" onClick={() => setActive([])}>Clear</button>
                                )}
                            </div>
                        </div>
                        {list('selected')}

                        <div className="list__head list__head--archive">
                            <h2 className="h3">Project archive (newest to oldest)</h2>
                        </div>
                        {list('archive')}

                        <Brief onBookCall={openCall} />

                        <footer className="list__foot">
                            <a className="h2" href={SITE.contact} onClick={openCall}>Book a 15-minute call</a>
                            <span className="h2 muted">London &amp; Shenzhen</span>
                        </footer>
                    </section>
                </div>
            </main>

            <HoverPreview listRef={listRef} openKey={openKey} />
            <Lightbox view={lightbox} onClose={closeLightbox} />
        </div>
    );
}
