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

export default function Home() {
    const total = LEFT_PROJECTS.length + RIGHT_PROJECTS.length;
    const [activeStep, setActiveStep] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const pausedRef = useRef(false);

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

    useEffect(() => {
        const interval = setInterval(() => {
            if (!pausedRef.current && !expanded) {
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
