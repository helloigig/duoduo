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
      scaleY: [1, 0.5, 1.2, 1],
      transition: { duration: 0.6, times: [0, 0.25, 0.55, 1], ease: 'easeInOut' },
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
