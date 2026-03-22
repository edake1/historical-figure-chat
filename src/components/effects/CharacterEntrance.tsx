'use client';

import { motion } from 'framer-motion';
import { HistoricalFigure } from '@/lib/figures';

export function CharacterEntrance({ figure, onComplete }: { figure: HistoricalFigure; onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-lg"
      onClick={onComplete}
    >
      {/* Particle effects */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: figure.color,
              left: '50%',
              top: '50%',
            }}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              x: (Math.random() - 0.5) * 400,
              y: (Math.random() - 0.5) * 400,
            }}
            transition={{ 
              duration: 1,
              delay: i * 0.05,
              ease: 'easeOut'
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div 
        className="relative flex flex-col items-center gap-6 p-8"
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute w-64 h-64 rounded-full"
          style={{
            background: `radial-gradient(circle, ${figure.color}40, transparent 70%)`,
            filter: 'blur(30px)',
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Avatar */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', damping: 10, stiffness: 100 }}
        >
          <div 
            className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white ring-4 ring-white/30 shadow-2xl overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${figure.color}, ${figure.color}dd)`,
              boxShadow: `0 0 60px ${figure.color}60`,
            }}
          >
            <img 
              src={`/portraits/${figure.id}.png`}
              alt={figure.name}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        {/* Name and era */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 
            className="text-4xl font-bold mb-2"
            style={{ 
              background: `linear-gradient(135deg, ${figure.color}, white)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {figure.name}
          </h2>
          <p className="text-white/60 text-lg">{figure.era}</p>
          <p className="text-white/40 text-sm">{figure.years}</p>
        </motion.div>

        {/* Tagline */}
        <motion.div
          className="max-w-md text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-white/80 italic text-lg">&ldquo;{figure.tagline}&rdquo;</p>
        </motion.div>

        {/* Tap to continue */}
        <motion.p
          className="text-white/30 text-sm mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Tap anywhere to continue
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
