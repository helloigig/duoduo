'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/work.module.css';
import { PROJECTS } from '@/lib/projects';

/** Renders the project icon: a logo image if provided, otherwise a colored rounded square */
function ProjectIcon({ project, size = 22, radius = 5 }) {
    if (project.logo) {
        return (
            <div className={styles.footerIcon} style={{ width: size, height: size, borderRadius: radius }}>
                <img src={project.logo} alt={project.name} />
            </div>
        );
    }
    return (
        <div
            className={styles.footerIcon}
            style={{ width: size, height: size, borderRadius: radius, background: project.color }}
        />
    );
}

function Lightbox({ project, onClose }) {
    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.lightbox} onClick={e => e.stopPropagation()}>
                {project.isVideo ? (
                    <video
                        src={project.preview}
                        autoPlay muted loop playsInline
                        className={styles.lightboxMedia}
                    />
                ) : (
                    <img
                        src={project.preview}
                        alt={project.name}
                        className={styles.lightboxMedia}
                    />
                )}
                <div className={styles.lightboxFooter}>
                    <div className={styles.lightboxInfo}>
                        <ProjectIcon project={project} size={26} radius={6} />
                        <div className={styles.lightboxText}>
                            <div className={styles.lightboxName}>{project.name}</div>
                            <div className={styles.lightboxMeta}>{project.tag} · {project.subtitle}</div>
                        </div>
                    </div>
                    <button className={styles.lightboxClose} onClick={onClose}>×</button>
                </div>
            </div>
        </div>
    );
}

export default function WorkPage() {
    const [lightbox, setLightbox] = useState(null);
    const active = lightbox != null ? PROJECTS.find(p => p.id === lightbox) : null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoArrow}>←</span>
                    duoduo
                </Link>
                <span className={styles.headerRight}>Work</span>
            </header>

            <main className={styles.grid}>
                {PROJECTS.map(p => (
                    <div
                        key={p.id}
                        className={styles.cell}
                        onClick={() => setLightbox(p.id)}
                    >
                        <div className={styles.mediaWrap}>
                            {p.isVideo ? (
                                <video
                                    src={p.preview}
                                    autoPlay muted loop playsInline
                                    className={styles.media}
                                />
                            ) : (
                                <img
                                    src={p.preview}
                                    alt={p.name}
                                    className={styles.media}
                                />
                            )}
                        </div>

                        {/* Hover-reveal footer: slides up from below on hover */}
                        <div className={styles.footer}>
                            <ProjectIcon project={p} size={22} radius={5} />
                            <span className={styles.footerName}>{p.name}</span>
                            <span className={styles.footerTag}>{p.tag}</span>
                        </div>
                    </div>
                ))}
            </main>

            {active && (
                <Lightbox project={active} onClose={() => setLightbox(null)} />
            )}
        </div>
    );
}
