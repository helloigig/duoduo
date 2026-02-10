'use client';

import { useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

export default function Spring() {
  const controls = useAnimationControls();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleHover = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    await controls.start({
      scaleY: [1, 0.3, 0.3, 1.25, 1],
      transition: { duration: 1, times: [0, 0.15, 0.5, 0.65, 1], ease: 'easeInOut' },
    });
    setIsAnimating(false);
  };

  return (
    <motion.img
      src="/duoduo.svg"
      alt="DuoDuo"
      style={{ height: 44, width: 'auto' }}
      animate={controls}
      onMouseEnter={handleHover}
    />
  );
}
