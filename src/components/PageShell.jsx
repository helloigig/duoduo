'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from '@/styles/Shell.module.css';
import Spring from '@/components/Spring';

const NAV_ITEMS = [
    { label: 'Work', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Collaborate', href: null },
];

export default function PageShell({ children }) {
    const pathname = usePathname();

    return (
        <div className={styles.shell}>
            <header className={styles.logoContainer}>
                <div className={styles.logoSpring}>
                    <Spring />
                </div>
            </header>

            <div className={styles.content}>
                {children}
            </div>

            <footer className={styles.bottomNav} aria-label="Site navigation">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.href === pathname;
                    const className = `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`;

                    if (item.href) {
                        return (
                            <Link key={item.label} href={item.href} className={className}>
                                {isActive && (
                                    <motion.span
                                        className={styles.navIndicator}
                                        layoutId="nav-indicator"
                                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                    />
                                )}
                                {item.label}
                            </Link>
                        );
                    }

                    return (
                        <button key={item.label} type="button" className={className}>
                            {item.label}
                        </button>
                    );
                })}
            </footer>
        </div>
    );
}
