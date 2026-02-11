'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '@/styles/About.module.css';
import Spring from '@/components/Spring';

function randomRotation() {
    return Math.random() * 20 - 10;
}

export default function About() {
    const canvasRef = useRef(null);
    const [receiptRotation, setReceiptRotation] = useState(() => randomRotation());

    return (
        <main className={styles.page}>
            {/* Top logo / spring */}
            <header className={styles.logoContainer}>
                <div className={styles.logoSpring}>
                    <Spring />
                </div>
            </header>

            {/* Draggable canvas area */}
            <section ref={canvasRef} className={styles.canvas}>
                <motion.div
                    className={styles.canvasItem}
                    drag
                    dragConstraints={canvasRef}
                    dragElastic={0.1}
                    dragMomentum={false}
                    animate={{ rotate: receiptRotation }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onDragEnd={() => setReceiptRotation(randomRotation())}
                >
                    <img src="/receipt.png" alt="DuoDuo Receipt" draggable={false} />
                </motion.div>
            </section>

            {/* Bottom navigation */}
            <footer className={styles.bottomNav} aria-label="Site navigation">
                <Link href="/" className={styles.bottomNavItem}>
                    Work
                </Link>
                <Link href="/about" className={`${styles.bottomNavItem} ${styles.bottomNavItemActive}`}>
                    About
                </Link>
                <button type="button" className={styles.bottomNavItem}>
                    Collaborate
                </button>
            </footer>
        </main>
    );
}
