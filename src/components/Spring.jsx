'use client';

import { useState } from 'react';
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion';
import styles from '@/styles/Spring.module.css';

function DuoLogo({ delay = 0, label, time, position }) {
  const controls = useAnimationControls();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleHover = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    await controls.start({
      scaleY: [1, 0.3, 0.3, 1.25, 1],
      transition: { duration: 1, times: [0, 0.15, 0.5, 0.65, 1], ease: 'easeInOut', delay },
    });
    setIsAnimating(false);
  };

  return (
    <div
      className={styles.duoWrapper}
      onMouseEnter={() => {
        handleHover();
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.img
        src="/duo.svg"
        alt="Duo"
        className={styles.duoLogo}
        animate={controls}
      />
      <AnimatePresence>
        {isHovered && (
          <motion.span
            className={`${styles.timeLabel} ${position === 'left' ? styles.timeLabelLeft : styles.timeLabelRight}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {label} {time}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Spring({ london, shenzhen }) {
  return (
    <div className={styles.logoContainer}>
      <DuoLogo label="London" time={london} position="left" />
      <DuoLogo label="Shenzhen" time={shenzhen} position="right" delay={0.05} />
    </div>
  );
}
