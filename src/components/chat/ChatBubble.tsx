'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookmarkCheck, Bookmark, Heart, Clock, Loader2 } from 'lucide-react';
import { HistoricalFigure } from '@/lib/figures';
import { ChatMessage, REACTION_EMOJIS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FigureAvatar } from '../figures/FigureAvatar';

export function ChatBubble({ 
  message, 
  figure, 
  index, 
  onBookmark,
  onReact,
  showTimestamps,
  isDark = true
}: { 
  message: ChatMessage; 
  figure?: HistoricalFigure; 
  index: number;
  onBookmark: () => void;
  onReact: (emoji: string) => void;
  showTimestamps: boolean;
  isDark?: boolean;
}) {
  const [showReactions, setShowReactions] = useState(false);

  if (!figure) return null;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className={cn(
        "group relative flex gap-4 p-4 rounded-2xl",
        isDark 
          ? cn(
              "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
              "backdrop-blur-xl border border-white/10",
              "hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04]"
            )
          : cn(
              "bg-gradient-to-br from-white to-slate-50",
              "border border-slate-200",
              "hover:border-amber-300 hover:shadow-md"
            ),
        "transition-all duration-500 ease-out",
        "shadow-xl shadow-black/10"
      )}
    >
      {/* Bookmark indicator */}
      {message.bookmarked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
        >
          <BookmarkCheck className="w-3 h-3 text-white" />
        </motion.div>
      )}

      {/* Subtle left accent */}
      <div 
        className="absolute left-0 top-4 bottom-4 w-1 rounded-full opacity-60"
        style={{ backgroundColor: figure.color }}
      />
      
      <FigureAvatar figure={figure} showPulse={message.isStreaming} isDark={isDark} />
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span 
            className="font-bold text-base tracking-tight"
            style={{ 
              background: `linear-gradient(135deg, ${figure.color}, ${figure.color}cc)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {figure.name}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            isDark ? "text-white/40 bg-white/5" : "text-slate-500 bg-slate-100"
          )}>
            {figure.era}
          </span>
          {showTimestamps && (
            <span className={cn(
              "text-xs flex items-center gap-1",
              isDark ? "text-white/30" : "text-slate-400"
            )}>
              <Clock className="w-3 h-3" />
              {formatTime(message.timestamp)}
            </span>
          )}
          {message.isStreaming && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1"
            >
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span className="text-xs text-amber-400/80">thinking...</span>
            </motion.div>
          )}
        </div>
        <p className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap",
          isDark ? "text-white/90" : "text-slate-700"
        )}>
          {message.content}
          {message.isStreaming && (
            <motion.span 
              className="inline-block w-0.5 h-4 ml-0.5 bg-amber-400"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </p>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-2">
            {message.reactions.map((emoji, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-lg"
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={cn(
        "absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        isDark ? "bg-slate-900/80" : "bg-white/90"
      )}>
        {/* Bookmark button */}
        <button
          onClick={onBookmark}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            message.bookmarked 
              ? "text-amber-400 bg-amber-400/10" 
              : isDark 
                ? "text-white/40 hover:text-amber-400 hover:bg-white/5"
                : "text-slate-400 hover:text-amber-500 hover:bg-slate-100"
          )}
        >
          {message.bookmarked ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>

        {/* Reaction button */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isDark 
                ? "text-white/40 hover:text-amber-400 hover:bg-white/5"
                : "text-slate-400 hover:text-amber-500 hover:bg-slate-100"
            )}
          >
            <Heart className="w-4 h-4" />
          </button>

          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "absolute right-0 top-full mt-1 flex gap-1 p-2 rounded-xl shadow-xl z-10",
                isDark ? "bg-slate-800 border border-white/10" : "bg-white border border-slate-200"
              )}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(emoji);
                    setShowReactions(false);
                  }}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
