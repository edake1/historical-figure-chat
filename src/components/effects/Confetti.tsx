'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Confetti({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  const particles = useMemo(() => {
    if (!active) return [];
    const colors = ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9'];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      rotation: Math.random() * 360,
      size: Math.random() * 8 + 4,
    }));
  }, [active]);

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ 
            y: -20, 
            x: `${particle.x}vw`, 
            rotate: 0, 
            opacity: 1,
            scale: 1 
          }}
          animate={{ 
            y: '100vh', 
            rotate: particle.rotation * 3,
            opacity: [1, 1, 0],
            scale: [1, 1, 0.5]
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 2.5, 
            delay: particle.delay,
            ease: 'easeIn' 
          }}
          className="fixed top-0 z-[100] pointer-events-none"
          style={{ width: particle.size, height: particle.size }}
        >
          <div 
            className="w-full h-full rounded-sm"
            style={{ 
              backgroundColor: particle.color,
              transform: `rotate(${particle.rotation}deg)`,
            }} 
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
