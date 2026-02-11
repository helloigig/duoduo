'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '@/styles/About.module.css';
import Spring from '@/components/Spring';
import NameCard from '@/components/NameCard';
import Poster from '@/components/Poster';
import BluePoster from '@/components/BluePoster';

function randomRotation() {
    return Math.random() * 20 - 10;
}

const ITEMS = [
    { id: 'poster', x: '20%', y: '15%', rotation: -6 },
    { id: 'card1', x: '25%', y: '18%', rotation: 2 },
    { id: 'receipt', x: '40%', y: '22%', rotation: -1 },
    { id: 'bluePoster', x: '52%', y: '22%', rotation: -4 },
    { id: 'card2', x: '52%', y: '19%', rotation: -3 }
];

export default function About() {
    const canvasRef = useRef(null);
    const topZRef = useRef(10);
    const [zIndices, setZIndices] = useState(() => {
        const initial = {};
        ITEMS.forEach((item, i) => { initial[item.id] = i + 1; });
        return initial;
    });
    const [rotations, setRotations] = useState(() => {
        const initial = {};
        ITEMS.forEach((item) => { initial[item.id] = item.rotation; });
        return initial;
    });

    const bringToFront = useCallback((id) => {
        topZRef.current += 1;
        setZIndices((z) => ({ ...z, [id]: topZRef.current }));
    }, []);

    const handleDragEnd = useCallback((id) => {
        setRotations((prev) => ({ ...prev, [id]: randomRotation() }));
    }, []);

    const handlePointerDown = useCallback((id) => {
        bringToFront(id);
    }, [bringToFront]);

    const itemProps = (id) => {
        const item = ITEMS.find((i) => i.id === id);
        return {
            className: styles.canvasItem,
            drag: true,
            dragConstraints: canvasRef,
            dragElastic: 0.1,
            dragMomentum: false,
            animate: { rotate: rotations[id] },
            transition: { type: 'spring', stiffness: 300, damping: 20 },
            onDragEnd: () => handleDragEnd(id),
            onPointerDown: () => handlePointerDown(id),
            style: { zIndex: zIndices[id], left: item.x, top: item.y },
        };
    };

    return (
        <main ref={canvasRef} className={styles.canvas}>
            {/* Top logo / spring */}
            <header className={styles.logoContainer}>
                <div className={styles.logoSpring}>
                    <Spring />
                </div>
            </header>

            <motion.div {...itemProps('poster')}>
                <Poster />
            </motion.div>

            <motion.div {...itemProps('card1')}>
                <NameCard
                    pronoun="her"
                    name="K"
                    employeeCode="000"
                    avatarSrc="/kw.png"
                    facts="Kiwi designs interfaces for things that exist in both physical and digital worlds. Kiwi believes good interaction should survive engineering, manufacturing, and bad network conditions. Kiwi can prototype ideas before meetings end. Kiwi writes code when necessary. Kiwi is calm under complex constraints."
                    assignment="Turning complex systems into experiences that feel inevitable."
                />
            </motion.div>

            <motion.div {...itemProps('receipt')}>
                <img src="/receipt.png" alt="DuoDuo Receipt" draggable={false} />
            </motion.div>

            <motion.div {...itemProps('card2')}>
                <NameCard
                    pronoun="her"
                    name="W"
                    employeeCode="001"
                    avatarSrc="/gg.png"
                    facts="Gigi designs experiences for products that think. Gigi turns complex AI systems into stories humans can understand. Gigi believes brand is not decoration, but a decision-making tool. Gigi leads with narrative, then builds systems to support it. Gigi sees the product as a whole before others see features."
                    assignment="Helping AI products feel less like systems and more like something you can trust."
                />
            </motion.div>

            <motion.div {...itemProps('bluePoster')}>
                <BluePoster />
            </motion.div>

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
