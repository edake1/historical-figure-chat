'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function TopicPill({ topic, onClick, isDark = true }: { topic: string; onClick: () => void; isDark?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium",
        "transition-all duration-300",
        isDark 
          ? cn(
              "bg-gradient-to-r from-white/5 to-white/[0.02]",
              "border border-white/10 hover:border-amber-400/50",
              "text-white/70 hover:text-white",
              "shadow-lg shadow-black/10 hover:shadow-amber-500/10"
            )
          : cn(
              "bg-gradient-to-r from-slate-100 to-white",
              "border border-slate-200 hover:border-amber-400",
              "text-slate-600 hover:text-slate-900",
              "shadow-sm hover:shadow-md"
            )
      )}
    >
      {topic}
    </motion.button>
  );
}
