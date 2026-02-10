'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from '@/styles/Home.module.css';
import Spring from '@/components/Spring';

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
            <div className={styles.projectNameRow}>
                <span className={styles.projectName}>{project.name}</span>
                <span className={styles.projectTag}>{project.tag}</span>
            </div>
            <span
                className={`${styles.projectSubtitle} ${bouncing ? styles.projectSubtitleBounce : ''}`}
                onAnimationEnd={() => setBouncing(false)}
            >
                {project.subtitle}
            </span>
        </button>
    );
}

const LEFT_PROJECTS = [
    {
        name: 'Helios Analytics',
        tag: 'B2B SaaS',
        subtitle: 'Product Strategy',
    },
    {
        name: 'Nebula',
        tag: 'Productivity',
        subtitle: 'Interface Systems',
    },
    {
        name: 'Aether Labs',
        tag: 'R&D',
        subtitle: 'Visual Language',
    },
];

const RIGHT_PROJECTS = [
    {
        name: 'Quant Systems',
        tag: 'Fintech',
        subtitle: 'Design Systems',
    },
    {
        name: 'Signal Studio',
        tag: 'Brand',
        subtitle: 'Identity',
    },
    {
        name: 'Northwind',
        tag: 'Platform',
        subtitle: 'Experience',
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
            {/* Top logo / spring */}
            <header className={styles.logoContainer}>
                <div className={styles.logoSpring}>
                    <Spring />
                </div>
            </header>

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
                    <div className={styles.previewInner}>
                        <span className={styles.previewLabel}>
                            {activeSide === 'left' ? LEFT_PROJECTS[activeIndex].name : RIGHT_PROJECTS[activeIndex].name}
                        </span>
                    </div>
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
                            >
                                <div className={styles.projectNameRow}>
                                    <span className={styles.projectName}>{project.name}</span>
                                    <span className={styles.projectTag}>{project.tag}</span>
                                </div>
                                <span className={styles.projectSubtitle}>{project.subtitle}</span>
                            </div>
                        );
                    })}
                </div>
                <div className={styles.mobilePreview}>
                    <div className={styles.previewInner}>
                        <span className={styles.previewLabel}>
                            {ALL_PROJECTS[activeStep].name}
                        </span>
                    </div>
                </div>
            </section>

            {/* Bottom navigation */}
            <footer className={styles.bottomNav} aria-label="Site navigation">
                <button type="button" className={`${styles.bottomNavItem} ${styles.bottomNavItemActive}`}>
                    Work
                </button>
                <button type="button" className={styles.bottomNavItem}>
                    About
                </button>
                <button type="button" className={styles.bottomNavItem}>
                    Collaborate
                </button>
            </footer>
        </main>
    );
}
