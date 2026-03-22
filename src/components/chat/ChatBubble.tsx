'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookmarkCheck, Bookmark, Heart, Clock, Volume2 } from 'lucide-react';
import { HistoricalFigure } from '@/lib/figures';
import { ChatMessage, REACTION_EMOJIS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FigureAvatar } from '../figures/FigureAvatar';

function AudioBars({ color }: { color: string }) {
  return (
    <div className="audio-bars">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="audio-bar" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

function TypingDots({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="typing-dot" style={{ backgroundColor: color }} />
      ))}
    </span>
  );
}

export function ChatBubble({ 
  message, 
  figure, 
  index, 
  isSpeaking = false,
  onBookmark,
  onReact,
  onReplay,
  showTimestamps,
  isDark = true
}: { 
  message: ChatMessage; 
  figure?: HistoricalFigure; 
  index: number;
  isSpeaking?: boolean;
  onBookmark: () => void;
  onReact: (emoji: string) => void;
  onReplay?: () => void;
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
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: Math.min(index * 0.05, 0.3),
        type: "spring",
        stiffness: 120,
        damping: 18
      }}
      className={cn(
        "group relative",
        "transition-all duration-300 ease-out"
      )}
    >
      {/* Main bubble */}
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden",
          isDark 
            ? "bg-white/[0.04] backdrop-blur-xl"
            : "bg-white shadow-sm",
        )}
        style={{
          borderLeft: `3px solid ${figure.color}`,
          ...(isSpeaking ? { 
            boxShadow: `0 0 0 2px ${isDark ? 'rgb(2,6,23)' : 'white'}, 0 0 0 4px ${figure.color}` 
          } : {})
        }}
      >
        {/* Figure-colored top gradient */}
        <div 
          className="absolute top-0 left-0 right-0 h-12 opacity-[0.06] pointer-events-none"
          style={{ background: `linear-gradient(to bottom, ${figure.color}, transparent)` }}
        />

        {/* Bookmark indicator */}
        {message.bookmarked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3 top-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-lg z-10"
          >
            <BookmarkCheck className="w-2.5 h-2.5 text-white" />
          </motion.div>
        )}

        <div className="relative flex gap-3 sm:gap-4 p-4 sm:p-5">
          {/* Avatar column */}
          <div className="shrink-0 pt-0.5">
            <FigureAvatar figure={figure} showPulse={message.isStreaming || isSpeaking} isDark={isDark} />
          </div>

          {/* Content column */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="font-bold text-[15px] tracking-tight"
                style={{ color: figure.color }}
              >
                {figure.name}
              </span>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase",
                isDark ? "text-white/30 bg-white/[0.06]" : "text-slate-400 bg-slate-100"
              )}>
                {figure.era}
              </span>
              {showTimestamps && (
                <span className={cn(
                  "text-[10px] flex items-center gap-1 ml-auto",
                  isDark ? "text-white/20" : "text-slate-300"
                )}>
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(message.timestamp)}
                </span>
              )}
            </div>

            {/* Status indicators */}
            {(message.isStreaming || isSpeaking) && (
              <div className="flex items-center gap-2">
                {message.isStreaming && (
                  <div className="flex items-center gap-1.5">
                    <TypingDots color={figure.color} />
                  </div>
                )}
                {isSpeaking && !message.isStreaming && (
                  <div className="flex items-center gap-2">
                    <AudioBars color={figure.color} />
                    <span className="text-[10px] font-medium" style={{ color: figure.color }}>speaking</span>
                  </div>
                )}
              </div>
            )}

            {/* Message text */}
            <p className={cn(
              "text-sm leading-[1.7] whitespace-pre-wrap",
              isDark ? "text-white/85" : "text-slate-700"
            )}>
              {message.content}
              {message.isStreaming && (
                <motion.span 
                  className="inline-block w-0.5 h-4 ml-0.5 rounded-full"
                  style={{ backgroundColor: figure.color }}
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </p>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex gap-1 pt-1">
                {message.reactions.map((emoji, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "text-base px-1.5 py-0.5 rounded-full",
                      isDark ? "bg-white/5" : "bg-slate-50"
                    )}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hover action bar */}
        <div className={cn(
          "absolute right-3 top-3 flex items-center gap-0.5 rounded-lg px-1 py-0.5",
          "opacity-0 group-hover:opacity-100 transition-all duration-200",
          "translate-y-1 group-hover:translate-y-0",
          isDark ? "bg-slate-800/90 backdrop-blur-sm border border-white/10" : "bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md",
          message.bookmarked && "mr-7"
        )}>
          {/* Replay TTS button */}
          {onReplay && !message.isStreaming && (
            <button
              onClick={onReplay}
              title="Replay speech"
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isDark 
                  ? "text-white/40 hover:text-amber-400 hover:bg-white/10"
                  : "text-slate-400 hover:text-amber-500 hover:bg-slate-100"
              )}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Bookmark button */}
          <button
            onClick={onBookmark}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              message.bookmarked 
                ? "text-amber-400" 
                : isDark 
                  ? "text-white/40 hover:text-amber-400 hover:bg-white/10"
                  : "text-slate-400 hover:text-amber-500 hover:bg-slate-100"
            )}
          >
            {message.bookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Reaction button */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isDark 
                  ? "text-white/40 hover:text-amber-400 hover:bg-white/10"
                  : "text-slate-400 hover:text-amber-500 hover:bg-slate-100"
              )}
            >
              <Heart className="w-3.5 h-3.5" />
            </button>

            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                  "absolute right-0 top-full mt-1 flex gap-1 p-1.5 rounded-xl shadow-xl z-10",
                  isDark ? "bg-slate-800 border border-white/10" : "bg-white border border-slate-200 shadow-lg"
                )}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(emoji);
                      setShowReactions(false);
                    }}
                    className="text-lg hover:scale-125 transition-transform px-0.5"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
