'use client';

import { motion } from 'framer-motion';
import { HistoricalFigure } from '@/lib/figures';
import { cn } from '@/lib/utils';

export function FigureAvatar({ figure, size = 'md', showPulse = false, glow = true, isDark = true }: { 
  figure: HistoricalFigure; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPulse?: boolean;
  glow?: boolean;
  isDark?: boolean;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl'
  };

  const glowSizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  };

  return (
    <div className="relative">
      {glow && (
        <div 
          className={cn(
            "absolute -inset-1 rounded-full blur-md",
            isDark ? "opacity-60" : "opacity-40",
            glowSizeClasses[size]
          )}
          style={{ 
            background: `radial-gradient(circle, ${figure.color}40, transparent 70%)`,
          }}
        />
      )}
      
      <div 
        className={cn(
          "rounded-full flex items-center justify-center font-bold text-white relative overflow-hidden",
          isDark 
            ? "ring-2 ring-white/30 ring-offset-2 ring-offset-slate-900/50"
            : "ring-2 ring-slate-300/50 ring-offset-2 ring-offset-white/50",
          "shadow-lg shadow-black/20",
          sizeClasses[size]
        )}
        style={{ 
          background: `linear-gradient(135deg, ${figure.color}, ${figure.color}dd)`,
        }}
      >
        <img 
          src={`/portraits/${figure.id}.png`}
          alt={figure.name}
          className="w-full h-full object-cover"
        />
        {showPulse && (
          <motion.span 
            className="absolute inset-0 rounded-full"
            animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ backgroundColor: figure.color }} 
          />
        )}
      </div>
    </div>
  );
}
