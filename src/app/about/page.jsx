'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '@/styles/About.module.css';
import NameCard from '@/components/NameCard';
import Poster from '@/components/Poster';
import BluePoster from '@/components/BluePoster';

function randomRotation() {
    return Math.random() * 10 - 5;
}

const ITEMS = [
    { id: 'poster', x: '33%', y: '44%', rotation: -6, w: 400 },
    { id: 'card1', x: '35%', y: '47%', rotation: 2, w: 320 },
    { id: 'receipt', x: '50%', y: '51%', rotation: -1, w: 492 },
    { id: 'bluePoster', x: '70%', y: '51%', rotation: -4, w: 440 },
    { id: 'card2', x: '66%', y: '44%', rotation: -3, w: 320 }
];

const cardTransition = { duration: 0.4, ease: 'easeIn'};

function renderCardContent(id) {
    switch (id) {
        case 'poster':
            return <Poster />;
        case 'card1':
            return (
                <NameCard
                    pronoun="her"
                    name="K"
                    employeeCode="000"
                    avatarSrc="/kw.png"
                    facts="Kiwi designs interfaces for things that exist in both physical and digital worlds. Kiwi believes good interaction should survive engineering, manufacturing, and bad network conditions. Kiwi can prototype ideas before meetings end. Kiwi writes code when necessary. Kiwi is calm under complex constraints."
                    assignment="Turning complex systems into experiences that feel inevitable."
                />
            );
        case 'receipt':
            return <img src="/receipt.png" alt="DuoDuo Receipt" draggable={false} style={{ display: 'block' }} />;
        case 'card2':
            return (
                <NameCard
                    pronoun="her"
                    name="G"
                    employeeCode="001"
                    avatarSrc="/gg.png"
                    facts="Gigi designs experiences for products that think. Gigi turns complex AI systems into stories humans can understand. Gigi believes brand is not decoration, but a decision-making tool. Gigi leads with narrative, then builds systems to support it. Gigi sees the product as a whole before others see features."
                    assignment="Helping AI products feel less like systems and more like something you can trust."
                />
            );
        case 'bluePoster':
            return <BluePoster />;
        default:
            return null;
    }
}

export default function About() {
    const canvasRef = useRef(null);
    const innerRef = useRef(null);
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

    // Mobile card stack state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [vw, setVw] = useState(375);
    const [mobileRotations, setMobileRotations] = useState(() =>
        ITEMS.map(() => 0)
    );

    useEffect(() => {
        setMobileRotations(ITEMS.map(() => randomRotation()));
        const update = () => setVw(window.innerWidth);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

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

    const handleSwipe = useCallback((_e, info) => {
        const swiped = Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 300;
        if (swiped) {
            setCurrentIndex((prev) => {
                const swipedIndex = prev;
                setMobileRotations((rots) => {
                    const next = [...rots];
                    next[swipedIndex] = randomRotation();
                    return next;
                });
                return (prev + 1) % ITEMS.length;
            });
        }
    }, []);

    const itemProps = (id) => {
        const item = ITEMS.find((i) => i.id === id);
        return {
            className: styles.canvasItem,
            drag: true,
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
            {/* Desktop: free-form draggable canvas */}
            <div ref={innerRef} className={styles.canvasInner}>
            <motion.div {...itemProps('poster')}>
                <div className={styles.canvasItemInner}><Poster /></div>
            </motion.div>

            <motion.div {...itemProps('card1')}>
                <div className={styles.canvasItemInner}>
                <NameCard
                    pronoun="her"
                    name="K"
                    employeeCode="000"
                    avatarSrc="/kw.png"
                    facts="Kiwi designs interfaces for things that exist in both physical and digital worlds. Kiwi believes good interaction should survive engineering, manufacturing, and bad network conditions. Kiwi can prototype ideas before meetings end. Kiwi writes code when necessary. Kiwi is calm under complex constraints."
                    assignment="Turning complex systems into experiences that feel inevitable."
                />
                </div>
            </motion.div>

            <motion.div {...itemProps('receipt')}>
                <div className={styles.canvasItemInner}>
                <img src="/receipt.png" alt="DuoDuo Receipt" draggable={false} />
                </div>
            </motion.div>

            <motion.div {...itemProps('card2')}>
                <div className={styles.canvasItemInner}>
                <NameCard
                    pronoun="her"
                    name="G"
                    employeeCode="001"
                    avatarSrc="/gg.png"
                    facts="Gigi designs experiences for products that think. Gigi turns complex AI systems into stories humans can understand. Gigi believes brand is not decoration, but a decision-making tool. Gigi leads with narrative, then builds systems to support it. Gigi sees the product as a whole before others see features."
                    assignment="Helping AI products feel less like systems and more like something you can trust."
                />
                </div>
            </motion.div>

            <motion.div {...itemProps('bluePoster')}>
                <div className={styles.canvasItemInner}><BluePoster /></div>
            </motion.div>
            </div>

            {/* Mobile: swipeable card stack */}
            <div className={styles.mobileStack}>
                <div className={styles.mobileStackContainer}>
                    {ITEMS.map((item, i) => {
                        const pos = (i - currentIndex + ITEMS.length) % ITEMS.length;
                        const isTop = pos === 0;
                        return (
                            <motion.div
                                key={item.id}
                                className={isTop ? styles.mobileTopCard : styles.mobileStackCard}
                                animate={{
                                    zIndex: ITEMS.length - pos,
                                }}
                                transition={cardTransition}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.7}
                                onDragEnd={isTop ? handleSwipe : undefined}
                                style={{ pointerEvents: isTop ? 'auto' : 'none', touchAction: isTop ? 'pan-y' : 'none' }}
                            >
                                <div style={{ zoom: (vw * 0.66) / item.w, transform: `rotate(${mobileRotations[i]}deg)` }}>
                                    {renderCardContent(item.id)}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}