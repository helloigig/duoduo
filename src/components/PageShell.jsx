'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Lottie from 'lottie-react';
import styles from '@/styles/PageShell.module.css';
import Spring from '@/components/Spring';
import callAnimation from '../../public/call.json';

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
    const { london, shenzhen } = useClocks();
    const [calOpen, setCalOpen] = useState(false);
    const [callHovered, setCallHovered] = useState(false);
    const lottieRef = useRef(null);

    useEffect(() => {
        const handler = () => setCalOpen(true);
        window.addEventListener('open-cal', handler);
        return () => window.removeEventListener('open-cal', handler);
    }, []);

    const handleCallEnter = () => {
        setCallHovered(true);
        lottieRef.current?.play();
    };

    const handleCallLeave = () => {
        setCallHovered(false);
        lottieRef.current?.stop();
    };

    return (
        <div className={styles.shell}>
            {/* Logo hidden on new design */}
            {/* <header className={styles.logoContainer}>
                <div className={styles.logoSpring}>
                    <Spring london={london} shenzhen={shenzhen} />
                </div>
            </header> */}

            <div className={styles.content}>
                {children}
            </div>

            {/* Book a call floating button — hidden for now */}
            <button
                type="button"
                className={styles.calButton}
                style={{ display: 'none' }}
                onClick={() => setCalOpen(true)}
                onMouseEnter={handleCallEnter}
                onMouseLeave={handleCallLeave}
                aria-label="Book a call"
            >
                <img
                    src="/call 0.svg"
                    className={`${styles.calButtonIcon} ${callHovered ? styles.calButtonIconHidden : ''}`}
                    alt="Book a call"
                />
                <Lottie
                    lottieRef={lottieRef}
                    animationData={callAnimation}
                    loop={true}
                    autoplay={false}
                    className={`${styles.calLottie} ${callHovered ? styles.calLottieVisible : ''}`}
                />
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
                                scrolling="no"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
