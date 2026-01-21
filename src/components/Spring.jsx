'use client';

import { useScroll, useTransform, useSpring, motion } from 'framer-motion';


export default function Spring() {
  const { scrollYProgress } = useScroll();

  // Physics Spring Config
  const smoothProgress = useSpring(scrollYProgress, {
    mass: 1,
    stiffness: 120,
    damping: 15,
  });

  // Map scroll progress to height (stretching the spring)
  // Base height 400px, expanding to 900px
  const height = useTransform(smoothProgress, [0, 1], [400, 900]);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '50px' }}>
      <motion.img
        src="/spring.png"
        alt="Spring"
        style={{
          width: '100px', // Slightly smaller than container width for aesthetics
          height: height,
          objectFit: 'fill' // Explicitly allow stretching
        }}
      />
    </div>
  );
}
