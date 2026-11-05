'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { SITE } from '@/lib/site';
import Brief from '@/components/Brief';
import '@/styles/site.css';

const tagById = Object.fromEntries(SITE.tags.map((t) => [t.id, t]));
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
    return (
        <span className="dots" aria-label={tags.map((id) => tagById[id]?.label).join(', ')}>
            {tags.map((id) => <i key={id} style={{ '--c': tagById[id]?.color }} />)}
        </span>
    );
}

function Gallery({ project }) {
    const ref = useRef(null);
    const images = project.images || [];

    // Drag to scroll with a mouse
    const onPointerDown = (e) => {
        const g = ref.current;
        if (!g || e.pointerType !== 'mouse') return;
        const x0 = e.clientX, s0 = g.scrollLeft;
        g.classList.add('is-dragging');
        const move = (ev) => { g.scrollLeft = s0 - (ev.clientX - x0); };
        const up = () => {
            g.classList.remove('is-dragging');
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    return (
        <div className="gallery" ref={ref} onPointerDown={onPointerDown}>
            {images.map((img, i) => (
                <figure key={img.src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className="tile"
                        src={img.src}
                        alt={`${project.title}, image ${i + 1}`}
                        style={{ aspectRatio: img.ratio }}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                    />
                    <figcaption className="h3">{i + 1}/{images.length}</figcaption>
                </figure>
            ))}
        </div>
    );
}

function Row({ project, open, onToggle, onPopOut, hidden }) {
    const id = `p-${project.title.replace(/\W+/g, '-').toLowerCase()}`;
    const showClient = project.client && project.client !== project.title;
    return (
        <li className={`row${open ? ' is-open' : ''}`} hidden={hidden}>
            <button className="row__btn h2" type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>
                <span className="row__name"><span>{project.title}</span><Dots tags={project.tags} /></span>
                <span className="row__client">{showClient ? project.client : ''}</span>
                <span className="row__years">{project.years}</span>
            </button>
            <div className="row__panel" id={id} inert={!open}>
                <div className="row__inner">
                    <div className="row__content">
                        {project.images?.length ? <Gallery project={project} /> : null}
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
                                <button className="popout h3" type="button" onClick={onPopOut}>
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

function Lightbox({ project, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
        const d = ref.current;
        if (project && d && !d.open) d.showModal();
        if (!project && d?.open) d.close();
    }, [project]);
    return (
        <dialog
            className="lightbox"
            ref={ref}
            aria-label="Image gallery"
            onClose={onClose}
            onClick={(e) => e.target === ref.current && onClose()}
        >
            <button className="lightbox__close h3" type="button" onClick={onClose}>Close</button>
            <div className="lightbox__track">
                {project?.images.map((img, i) =>
                    img.full ? (
                        <div className="lightbox__long" key={img.src}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.full} alt={`${project.title}, page ${i + 1}`} />
                        </div>
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={img.src} className="tile" src={img.src} alt={`${project.title}, image ${i + 1}`} style={{ aspectRatio: img.ratio }} />
                    )
                )}
            </div>
        </dialog>
    );
}

export default function Home() {
    const [openKey, setOpenKey] = useState(null);
    const [active, setActive] = useState([]);
    const [popOut, setPopOut] = useState(null);
    const [headerOn, setHeaderOn] = useState(false);
    const listRef = useRef(null);
    const introRef = useRef(null);
    const rootRef = useRef(null);

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

    const toggleTag = (id) => setActive((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
    const isHidden = (p) => active.length > 0 && !active.some((a) => p.tags.includes(a));
    const closePopOut = useCallback(() => setPopOut(null), []);

    const list = (projects, group) =>
        projects.map((p, i) => {
            const key = `${group}-${i}`;
            return (
                <Row
                    key={key}
                    project={p}
                    open={openKey === key}
                    hidden={isHidden(p)}
                    onToggle={() => setOpenKey((k) => (k === key ? null : key))}
                    onPopOut={() => setPopOut(p)}
                />
            );
        });

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

                <div className="sheet">
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
                            </div>
                        </div>
                        <ul className="projects">{list(SITE.selected, 's')}</ul>

                        <div className="list__head list__head--archive">
                            <h2 className="h3">Project archive (newest to oldest)</h2>
                        </div>
                        <ul className="projects">{list(SITE.archive, 'a')}</ul>

                        <Brief onBookCall={openCall} />

                        <footer className="list__foot">
                            <a className="h2" href={SITE.contact} onClick={openCall}>Book a 15-minute call</a>
                            <span className="h2 muted">London &amp; Shenzhen</span>
                        </footer>
                    </section>
                </div>
            </main>

            <Lightbox project={popOut} onClose={closePopOut} />
        </div>
    );
}
