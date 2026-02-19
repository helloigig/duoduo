'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from '@/styles/Shell.module.css';
import Spring from '@/components/Spring';
import NameCard from '@/components/NameCard';

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


export default function PageShell({ children }) {
    const pathname = usePathname();
    const { london, shenzhen } = useClocks();
    const [aboutOpen, setAboutOpen] = useState(false);
    const [calOpen, setCalOpen] = useState(false);
    const [avatarHovered, setAvatarHovered] = useState(false);
    const [cardRotation, setCardRotation] = useState(-3);

    const isWorkActive = pathname === '/';

    return (
        <div className={styles.shell}>
            <header className={styles.logoContainer}>
                <div className={styles.logoSpring}>
                    <Spring london={london} shenzhen={shenzhen} />
                </div>
                <nav className={styles.topNav} aria-label="Site navigation">
                    <Link
                        href="/"
                        className={`${styles.topNavItem} ${isWorkActive ? styles.topNavItemActive : ''}`}
                    >
                        Work
                    </Link>
                    <button
                        type="button"
                        className={styles.topNavItem}
                        onClick={() => {
                            setCardRotation((Math.random() - 0.5) * 20);
                            setAboutOpen(true);
                        }}
                        onMouseEnter={() => setAvatarHovered(true)}
                        onMouseLeave={() => setAvatarHovered(false)}
                        aria-label="About Gigi"
                    >
                        <img src={avatarHovered ? '/avatar-pink.svg' : '/avatar-black.svg'} className={styles.navAvatar} alt="About" />
                    </button>
                </nav>
            </header>

            <div className={styles.content}>
                {children}
            </div>

            {/* Book a call floating button */}
            <button
                type="button"
                className={styles.calButton}
                onClick={() => setCalOpen(true)}
                aria-label="Book a call"
            >
                <img src="/book a call.svg" className={styles.calButtonIcon} alt="Book a call" />
            </button>

            <AnimatePresence>
                {calOpen && (
                    <motion.div
                        className={styles.calBackdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setCalOpen(false)}
                    >
                        <motion.div
                            className={styles.calModal}
                            initial={{ opacity: 0, scale: 0.94, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <iframe
                                src="https://cal.com/duo-duo/15min?theme=light&embed=true"
                                className={styles.calFrame}
                                title="Book a call"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {aboutOpen && (
                    <motion.div
                        className={styles.modalBackdrop}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setAboutOpen(false)}
                    >
                        <motion.div
                            className={styles.modalCard}
                            initial={{ opacity: 0, scale: 0.85, rotate: cardRotation * 1.5 }}
                            animate={{ opacity: 1, scale: 1, rotate: cardRotation }}
                            exit={{ opacity: 0, scale: 0.88, rotate: cardRotation * 1.2 }}
                            whileHover={{ rotate: 0, scale: 1.03 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <NameCard
                                pronoun="her"
                                name="G"
                                facts="Gigi designs experiences for products that think. Gigi turns complex AI systems into stories humans can understand. Gigi believes brand is not decoration, but a decision-making tool. Gigi leads with narrative, then builds systems to support it. Gigi sees the product as a whole before others see features."
                                assignment="Helping AI products feel less like systems and more like something you can trust."
                                hideName={true}
                                hideLogo={true}
                                hideFooter={true}
                                email="wuyuqi827@gmail.com"
                                linkedin="https://www.linkedin.com/in/gigiwu/"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
