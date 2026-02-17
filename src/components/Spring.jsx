'use client';

import { useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import styles from '@/styles/Spring.module.css';

function DuoLogo({ delay = 0 }) {
  const controls = useAnimationControls();
  const [isAnimating, setIsAnimating] = useState(false);

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
    <motion.img
      src="/duo.svg"
      alt="Duo"
      className={styles.duoLogo}
      animate={controls}
      onMouseEnter={handleHover}
    />
  );
}

export default function Spring() {
  return (
    <div className={styles.logoContainer}>
      <DuoLogo />
      <DuoLogo delay={0.05} />
    </div>
  );
}
