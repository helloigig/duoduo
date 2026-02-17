'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from '@/styles/Shell.module.css';
import Spring from '@/components/Spring';

function useClocks() {
    const [times, setTimes] = useState({ london: '', shenzhen: '' });

    useEffect(() => {
        const fmt = (tz) => new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false, timeZone: tz,
        });
        const londonFmt = fmt('Europe/London');
        const shenzhenFmt = fmt('Asia/Shanghai');

        const update = () => setTimes({
            london: londonFmt.format(new Date()),
            shenzhen: shenzhenFmt.format(new Date()),
        });
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    return times;
}

const NAV_ITEMS = [
    { label: 'Work', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Collaborate', href: null },
];

export default function PageShell({ children }) {
    const pathname = usePathname();
    const { london, shenzhen } = useClocks();

    return (
        <div className={styles.shell}>
            <header className={styles.logoContainer}>
                <div className={styles.logoSpring}>
                    <Spring />
                </div>
                <nav className={styles.topNav} aria-label="Site navigation">
                    {NAV_ITEMS.map((item) => {
                        const isActive = item.href === pathname;
                        const className = `${styles.topNavItem} ${isActive ? styles.topNavItemActive : ''}`;

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
                </nav>
            </header>

            <div className={styles.content}>
                {children}
            </div>

            <footer className={styles.bottomInfo}>
                <span className={styles.clockLeft}>LDN {london}</span>
                <span className={styles.clockRight}>SHENZHEN {shenzhen}</span>
            </footer>
        </div>
    );
}
