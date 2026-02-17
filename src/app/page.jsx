'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from '@/styles/Home.module.css';

function ProjectItem({ project, isActive, onHover }) {
    const [bouncing, setBouncing] = useState(false);

    const handleMouseEnter = () => {
        onHover();
        if (bouncing) return;
        setBouncing(true);
    };

    return (
        <button
            type="button"
            className={`${styles.projectItem} ${isActive ? styles.projectItemActive : ''}`}
            onMouseEnter={handleMouseEnter}
        >
            <span className={styles.projectName}>{project.name}</span>
            <span
                className={`${styles.projectSubtitle} ${bouncing ? styles.projectSubtitleBounce : ''}`}
                onAnimationEnd={() => setBouncing(false)}
            >
                <span className={styles.projectTag}>{project.tag}</span> · {project.subtitle}
            </span>
        </button>
    );
}

const LEFT_PROJECTS = [
    {
        name: 'AnyApp',
        tag: 'Mobile App',
        subtitle: 'AI Widgets · UI/UX',
        preview: '/AnyApp.png',
    },
    {
        name: 'Cuto',
        tag: 'Mobile App',
        subtitle: 'Wallpaper · Redesign',
        preview: '/cuto.png',
    },
    {
        name: 'Bloc1',
        tag: 'Mobile App',
        subtitle: 'Gym · Service Design',
        preview: '/Bloc1.png',
    },
];

const RIGHT_PROJECTS = [
    {
        name: 'Dify Website',
        tag: 'Website',
        subtitle: 'AI Platform',
        preview: '/Dify.mp4',
        isVideo: true,
    },
    {
        name: 'Basecamp Research Website',
        tag: 'Website',
        subtitle: 'Brand · Research',
        preview: '/BCR.mp4',
        isVideo: true,
    },
    {
        name: 'AI Platform',
        tag: 'Platform',
        subtitle: 'Experience',
        preview: '/aiplatform.png',
    },
];

const ALL_PROJECTS = [...LEFT_PROJECTS, ...RIGHT_PROJECTS];

const MOBILE_ITEM_HEIGHT = 52;
const LOOP_COUNT = 20;
const LOOPED_PROJECTS = Array.from({ length: LOOP_COUNT }, () => ALL_PROJECTS).flat();

export default function Home() {
    const total = ALL_PROJECTS.length;
    const [activeStep, setActiveStep] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const pausedRef = useRef(false);
    const scrollContainerRef = useRef(null);
    const isUserScrolling = useRef(false);
    const isRecentering = useRef(false);
    const scrollTimeout = useRef(null);

    const activeSide = activeStep < LEFT_PROJECTS.length ? 'left' : 'right';
    const activeIndex = activeSide === 'left' ? activeStep : activeStep - LEFT_PROJECTS.length;

    const previewRef = useRef(null);
    const mobilePreviewRef = useRef(null);
    const activeStepRef = useRef(activeStep);
    activeStepRef.current = activeStep;

    const pause = useCallback(() => { pausedRef.current = true; }, []);
    const resume = useCallback(() => { pausedRef.current = false; }, []);

    useEffect(() => {
        if (!expanded) return;
        const handleClickOutside = (e) => {
            if (previewRef.current && !previewRef.current.contains(e.target)) {
                setExpanded(false);
            }
        };
        window.addEventListener('mousedown', handleClickOutside, true);
        return () => window.removeEventListener('mousedown', handleClickOutside, true);
    }, [expanded]);

    // Play active video on hover, pause others
    useEffect(() => {
        const playActive = () => {
            const container = previewRef.current;
            if (!container) return;
            container.querySelectorAll('video[data-project-index]').forEach((video) => {
                const idx = parseInt(video.dataset.projectIndex, 10);
                if (idx === activeStep) {
                    if (video.src) video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });
            if (mobilePreviewRef.current) {
                mobilePreviewRef.current.querySelectorAll('video[data-project-index]').forEach((video) => {
                    const idx = parseInt(video.dataset.projectIndex, 10);
                    if (idx === activeStep) {
                        if (video.src) video.play().catch(() => {});
                    } else {
                        video.pause();
                    }
                });
            }
        };
        playActive();
        // Retry after React has updated the DOM (video may get src in same tick)
        const id = setTimeout(playActive, 100);
        return () => clearTimeout(id);
    }, [activeStep]);

    // Initialize scroll position to center of looped list
    const midStart = Math.floor(LOOP_COUNT / 2) * total;
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.scrollTop = midStart * MOBILE_ITEM_HEIGHT;
        }
    }, [midStart]);

    // Detect which item is centered on scroll + recenter when near edges
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const lowerBound = total * 3 * MOBILE_ITEM_HEIGHT;
        const upperBound = total * (LOOP_COUNT - 3) * MOBILE_ITEM_HEIGHT;

        const handleScroll = () => {
            if (isRecentering.current) return;

            const containerCenter = el.scrollTop + el.clientHeight / 2;
            const idx = Math.floor(containerCenter / MOBILE_ITEM_HEIGHT);
            const realIdx = ((idx % total) + total) % total;
            setActiveStep(realIdx);

            // Silently recenter when approaching edges
            if (el.scrollTop < lowerBound || el.scrollTop > upperBound) {
                isRecentering.current = true;
                const currentIdx = Math.round(el.scrollTop / MOBILE_ITEM_HEIGHT);
                const equivalent = (currentIdx % total) + midStart;
                el.style.scrollBehavior = 'auto';
                el.scrollTop = equivalent * MOBILE_ITEM_HEIGHT;
                el.style.scrollBehavior = '';
                requestAnimationFrame(() => {
                    isRecentering.current = false;
                });
            }

            // Pause autoplay while user scrolls
            isUserScrolling.current = true;
            pausedRef.current = true;
            clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => {
                isUserScrolling.current = false;
                pausedRef.current = false;
            }, 2000);
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [total, midStart]);

    // Autoplay: mobile scrolls the list, desktop increments activeStep
    useEffect(() => {
        const interval = setInterval(() => {
            if (pausedRef.current || expanded) return;

            const isMobile = window.innerWidth <= 768;
            if (isMobile && scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({ top: MOBILE_ITEM_HEIGHT, behavior: 'smooth' });
            } else if (!isMobile) {
                setActiveStep((prev) => (prev + 1) % total);
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [total, expanded]);

    return (
        <main className={styles.page}>
            {/* Center layout: left / preview / right */}
            <section className={styles.layout} onMouseEnter={pause} onMouseLeave={resume}>
                <nav className={`${styles.navColumn} ${expanded ? styles.navColumnHidden : ''}`} aria-label="Project navigation left">
                    {LEFT_PROJECTS.map((project, index) => (
                        <ProjectItem
                            key={`left-${project.name}-${index}`}
                            project={project}
                            isActive={activeSide === 'left' && index === activeIndex}
                            onHover={() => setActiveStep(index)}
                        />
                    ))}
                </nav>

                <motion.div
                    ref={previewRef}
                    className={`${styles.preview} ${expanded ? styles.previewExpanded : ''}`}
                    aria-label="Project preview area"
                    layout
                    onClick={() => { if (!expanded) setExpanded(true); }}
                    style={{ cursor: 'pointer' }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                    {ALL_PROJECTS.map((project, i) => (
                        project.preview ? (
                            project.isVideo ? (
                                <video
                                    key={project.name}
                                    data-project-index={i}
                                    className={`${styles.previewImage} ${i === activeStep ? styles.previewVisible : styles.previewHidden}`}
                                    src={i === activeStep ? project.preview : undefined}
                                    preload={i === activeStep ? 'auto' : 'none'}
                                    loop
                                    muted
                                    playsInline
                                    draggable={false}
                                    onCanPlay={(e) => {
                                        if (activeStepRef.current === i) e.target.play().catch(() => {});
                                    }}
                                    onError={(e) => console.warn('Video failed to load:', project.name, e.target.error)}
                                />
                            ) : (
                                <img
                                    key={project.name}
                                    className={`${styles.previewImage} ${i === activeStep ? styles.previewVisible : styles.previewHidden}`}
                                    src={project.preview}
                                    alt={project.name}
                                    draggable={false}
                                />
                            )
                        ) : (
                            <div
                                key={project.name}
                                className={`${styles.previewInner} ${i === activeStep ? styles.previewVisible : styles.previewHidden}`}
                            >
                                <span className={styles.previewLabel}>{project.name}</span>
                            </div>
                        )
                    ))}
                </motion.div>

                <nav className={`${styles.navColumn} ${expanded ? styles.navColumnHidden : ''}`} aria-label="Project navigation right">
                    {RIGHT_PROJECTS.map((project, index) => (
                        <ProjectItem
                            key={`right-${project.name}-${index}`}
                            project={project}
                            isActive={activeSide === 'right' && index === activeIndex}
                            onHover={() => setActiveStep(LEFT_PROJECTS.length + index)}
                        />
                    ))}
                </nav>
            </section>

            {/* Mobile layout */}
            <section className={styles.mobileLayout}>
                <div
                    ref={scrollContainerRef}
                    className={styles.mobileScrollContainer}
                >
                    {LOOPED_PROJECTS.map((project, i) => {
                        const realIndex = i % total;
                        const isActive = realIndex === activeStep;
                        return (
                            <div
                                key={`mobile-${i}`}
                                className={`${styles.mobileProjectItem} ${isActive ? styles.projectItemActive : styles.projectItem}`}
                                style={{ height: MOBILE_ITEM_HEIGHT, minHeight: MOBILE_ITEM_HEIGHT }}
                                onClick={() => {
                                    const el = scrollContainerRef.current;
                                    if (!el) return;
                                    const targetTop = i * MOBILE_ITEM_HEIGHT + MOBILE_ITEM_HEIGHT / 2 - el.clientHeight / 2;
                                    el.scrollTo({ top: targetTop, behavior: 'smooth' });
                                }}
                            >
                                <span className={styles.projectName}>{project.name}</span>
                                <span className={styles.projectSubtitle}>
                                    <span className={styles.projectTag}>{project.tag}</span> · {project.subtitle}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div ref={mobilePreviewRef} className={styles.mobilePreview}>
                    {ALL_PROJECTS.map((project, i) => (
                        project.preview ? (
                            project.isVideo ? (
                                <video
                                    key={project.name}
                                    data-project-index={i}
                                    className={`${styles.previewImage} ${i === activeStep ? styles.previewVisible : styles.previewHidden}`}
                                    src={i === activeStep ? project.preview : undefined}
                                    preload={i === activeStep ? 'auto' : 'none'}
                                    loop
                                    muted
                                    playsInline
                                    draggable={false}
                                    onCanPlay={(e) => {
                                        if (activeStepRef.current === i) e.target.play().catch(() => {});
                                    }}
                                    onError={(e) => console.warn('Video failed to load:', project.name, e.target.error)}
                                />
                            ) : (
                                <img
                                    key={project.name}
                                    className={`${styles.previewImage} ${i === activeStep ? styles.previewVisible : styles.previewHidden}`}
                                    src={project.preview}
                                    alt={project.name}
                                    draggable={false}
                                />
                            )
                        ) : (
                            <div
                                key={project.name}
                                className={`${styles.previewInner} ${i === activeStep ? styles.previewVisible : styles.previewHidden}`}
                            >
                                <span className={styles.previewLabel}>{project.name}</span>
                            </div>
                        )
                    ))}
                </div>
            </section>

        </main>
    );
}
