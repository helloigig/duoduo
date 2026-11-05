'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { SITE } from '@/lib/site';
import Brief from '@/components/Brief';
import '@/styles/site.css';

const tagById = Object.fromEntries(SITE.tags.map((t) => [t.id, t]));
const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ALL = [
    ...SITE.selected.map((p) => ({ ...p, group: 'selected', key: slug(p.title) })),
    ...SITE.archive.map((p) => ({ ...p, group: 'archive', key: slug(p.title) })),
];
const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const openCall = (e) => {
    e?.preventDefault();
    window.dispatchEvent(new CustomEvent('open-cal'));
};

// "[word]" in copy renders grey
function Highlighted({ text }) {
    return text.split(/\[([^\]]+)\]/g).map((part, i) =>
        i % 2 ? <span key={i} className="hl">{part}</span> : <Fragment key={i}>{part}</Fragment>
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
            alt={alt}
            style={{ aspectRatio: img.ratio }}
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
                    <figure key={img.src}>
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

function Row({ project, open, onToggle, onOpenImage, hidden }) {
    const id = `panel-${project.key}`;
    const showClient = project.client && project.client !== project.title;
    return (
        <li className={`row${open ? ' is-open' : ''}`} hidden={hidden} id={project.key} data-key={project.key}>
            <button className="row__btn h2" type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>
                <span className="row__name"><span>{project.title}</span><Dots tags={project.tags} /></span>
                <span className="row__client">{showClient ? project.client : ''}</span>
                <span className="row__years">
                    {project.years}
                    <span className="row__toggle" aria-hidden="true">{open ? '−' : '+'}</span>
                </span>
            </button>
            <div className="row__panel" id={id} inert={!open}>
                <div className="row__inner">
                    <div className="row__content">
                        {project.images?.length ? <Gallery project={project} onOpenImage={onOpenImage} /> : null}
                        <div className="details">
                            <div className="meta">
                                <span className="h3 meta__disc">{project.disciplines}</span>
                                {project.links?.length ? (
                                    <>
                                        <span className="h3">External links</span>
                                        <div className="links">
                                            {project.links.map((l) => (
                                                <a key={l.href} className="h3" href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
                                            ))}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                            {project.description ? <p className="h2 desc">{project.description}</p> : null}
                            {project.images?.length ? (
                                <button className="popout h3" type="button" onClick={() => onOpenImage(0)}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/pop-out.svg" alt="" width={16} height={15} />Pop out
                                </button>
                            ) : null}
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
                        <img key={img.src} className="tile is-loaded" src={img.src} alt={`${project.title}, image ${i + 1}`} style={{ aspectRatio: img.ratio }} />
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

    // Desktop header slides in once the list covers the intro
    useEffect(() => {
        const onScroll = () => setHeaderOn((listRef.current?.getBoundingClientRect().top ?? 999) <= 58);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
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
        return (
            <ul className="projects">
                {projects.map((p) => (
                    <Row
                        key={p.key}
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
            <header className={`site-header${headerOn ? ' is-visible' : ''}`} aria-hidden={!headerOn}>
                <a className="h1" href="#top" tabIndex={headerOn ? 0 : -1}>{SITE.name}</a>
                <span className="h1 site-header__role">{SITE.role}</span>
                <a className="h1 muted" href={SITE.contact} onClick={openCall} tabIndex={headerOn ? 0 : -1}>Contact</a>
            </header>

            <main id="top">
                <section className="intro">
                    <p className="h1" ref={introRef}><Highlighted text={SITE.intro} /></p>
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

            <Lightbox view={lightbox} onClose={closeLightbox} />
        </div>
    );
}
