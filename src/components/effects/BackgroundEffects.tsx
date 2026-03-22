'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function FloatingParticles({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute w-1 h-1 rounded-full",
            isDark ? "bg-amber-400/30" : "bg-amber-600/20"
          )}
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.2,
          }}
          animate={{
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export function AnimatedGrid({ isDark }: { isDark: boolean }) {
  return (
    <div className={cn(
      "absolute inset-0 overflow-hidden pointer-events-none",
      isDark ? "opacity-20" : "opacity-10"
    )}>
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(217, 119, 6, 0.15)'} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(217, 119, 6, 0.15)'} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-transparent to-transparent",
          isDark ? "via-amber-500/5" : "via-amber-500/10"
        )}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ width: '50%' }}
      />
    </div>
  );
}
