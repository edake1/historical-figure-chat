'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { HistoricalFigure } from '@/lib/figures';
import { cn } from '@/lib/utils';
import { FigureAvatar } from './FigureAvatar';

export function FigureCard({ figure, isSelected, onToggle, isDark = true }: {
  figure: HistoricalFigure;
  isSelected: boolean;
  onToggle: () => void;
  isDark?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className={cn(
        "group relative cursor-pointer rounded-2xl overflow-hidden",
        "transition-all duration-500 ease-out",
        isSelected 
          ? cn(
              "ring-2",
              isDark 
                ? "ring-amber-400/80 ring-offset-2 ring-offset-slate-900"
                : "ring-amber-500 ring-offset-2 ring-offset-white"
            ) 
          : cn(
              "ring-1",
              isDark 
                ? "ring-white/10 hover:ring-white/30"
                : "ring-slate-200 hover:ring-amber-300"
            )
      )}
    >
      {/* Holographic background effect */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          isSelected && isDark && "opacity-30"
        )}
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, ${figure.color}30, transparent 50%),
            radial-gradient(ellipse at 70% 80%, ${figure.color}20, transparent 50%)
          `,
        }}
      />
      
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.8 }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        }}
      />
      
      <div className={cn(
        "relative p-4 backdrop-blur-xl",
        isDark 
          ? cn(
              "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
              isSelected && "from-amber-500/10 to-amber-500/5"
            )
          : cn(
              "bg-gradient-to-br from-white to-slate-50",
              isSelected && "from-amber-50 to-orange-50"
            )
      )}>
        <div className="flex items-center gap-3">
          <FigureAvatar figure={figure} size="md" glow={isSelected} isDark={isDark} />
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-bold text-sm truncate transition-colors",
              isDark 
                ? "text-white/90 group-hover:text-white"
                : "text-slate-700 group-hover:text-slate-900"
            )}>
              {figure.name}
            </h3>
            <p className={cn(
              "text-xs truncate",
              isDark ? "text-white/40" : "text-slate-400"
            )}>{figure.era}</p>
          </div>
          
          {/* Selection indicator */}
          <motion.div
            initial={false}
            animate={{ 
              scale: isSelected ? 1 : 0.8,
              opacity: isSelected ? 1 : 0 
            }}
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-amber-400 to-orange-500",
              "shadow-lg shadow-amber-500/30"
            )}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: isSelected ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Star className="w-3 h-3 text-white fill-white" />
            </motion.span>
          </motion.div>
        </div>
        
        <p className={cn(
          "text-xs mt-3 line-clamp-2 leading-relaxed",
          isDark ? "text-white/50" : "text-slate-500"
        )}>
          {figure.tagline}
        </p>
        
        {/* Era badge */}
        <div className="mt-3 flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: figure.color }}
          />
          <span className={cn(
            "text-[10px] uppercase tracking-wider font-medium",
            isDark ? "text-white/30" : "text-slate-400"
          )}>
            {figure.years}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
