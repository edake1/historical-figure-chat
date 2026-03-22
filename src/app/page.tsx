'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Send, Plus, X, Sparkles, Users, 
  Trash2, Download, RefreshCw, Loader2,
  Crown, Zap, Star, Quote, Bookmark, BookmarkCheck,
  Sun, Moon, Share2, History, Save, Settings, Volume2, VolumeX,
  Clock, Heart, ThumbsUp, Laugh, Flame, PartyPopper, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { historicalFigures, HistoricalFigure, getFigureById } from '@/lib/figures';
import { cn } from '@/lib/utils';

// ==================== TYPES ====================

interface ChatMessage {
  id: string;
  figureId: string;
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
  bookmarked?: boolean;
  reactions?: string[];
}

interface ConversationTurn {
  figureId: string;
  content: string;
}

interface SavedConversation {
  id: string;
  name: string;
  topic: string;
  figureIds: string[];
  messages: ChatMessage[];
  savedAt: Date;
  figureCount: number;
}

interface BookmarkItem {
  id: string;
  messageId: string;
  figureId: string;
  content: string;
  context: string;
  timestamp: Date;
  conversationId?: string;
}

interface SettingsType {
  soundEnabled: boolean;
  timestampsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

// ==================== CONSTANTS ====================

const suggestedTopics = [
  "Should we colonize Mars?",
  "What is the meaning of life?",
  "Is artificial intelligence a threat or opportunity?",
  "What makes a good leader?",
  "Does money equal happiness?",
  "Should there be limits on free speech?",
];

const STORAGE_KEYS = {
  CONVERSATIONS: 'historical-chat-conversations',
  BOOKMARKS: 'historical-chat-bookmarks',
  SETTINGS: 'historical-chat-settings',
  THEME: 'historical-chat-theme',
};

const REACTION_EMOJIS = ['❤️', '👍', '😂', '🔥', '🤔'];

// ==================== SOUND EFFECTS ====================

class SoundEngine {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) {
    if (!this.audioContext || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playMessageSent() {
    // Whoosh sound - descending frequency sweep
    if (!this.audioContext || !this.enabled) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.15);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  playFigureSpeak() {
    // Soft chime - pleasant bell-like sound
    this.playTone(880, 0.1, 'sine', 0.06);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.04), 50);
  }

  playConversationStart() {
    // Triumphant ascending arpeggio
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.3, 'sine', 0.08), i * 100);
    });
  }

  playBookmark() {
    // Satisfying click
    this.playTone(1200, 0.05, 'square', 0.03);
  }

  playConfetti() {
    // Sparkle sound
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(1500 + Math.random() * 1000, 0.1, 'sine', 0.03);
      }, i * 50);
    }
  }

  playCharacterEntrance() {
    // Dramatic reveal sound
    this.playTone(200, 0.3, 'sawtooth', 0.05);
    setTimeout(() => this.playTone(300, 0.2, 'sine', 0.08), 100);
    setTimeout(() => this.playTone(400, 0.3, 'sine', 0.1), 200);
  }
}

const soundEngine = new SoundEngine();

// ==================== CONFETTI COMPONENT ====================

function Confetti({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  // Pre-generate particles to avoid setState in effect
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

// ==================== CHARACTER ENTRANCE ANIMATION ====================

function CharacterEntrance({ figure, onComplete }: { figure: HistoricalFigure; onComplete: () => void }) {
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
            {['einstein', 'cleopatra', 'shakespeare', 'tesla', 'davinci', 
              'curie', 'lincoln', 'plato', 'archimedes', 'edison', 'newton', 
              'genghis', 'socrates', 'frida', 'gandhi', 'churchill', 'mlk'
            ].includes(figure.id) ? (
              <img 
                src={`/portraits/${figure.id}.png`}
                alt={figure.name}
                className="w-full h-full object-cover"
              />
            ) : (
              figure.name.charAt(0)
            )}
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

        {/* Tagline/Quote */}
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

// ==================== TOAST COMPONENT ====================

function Toast({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-24 left-1/2 z-[300] px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-xl shadow-amber-500/30 flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==================== FLOATING PARTICLES ====================

function FloatingParticles({ isDark }: { isDark: boolean }) {
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

// ==================== ANIMATED GRID ====================

function AnimatedGrid({ isDark }: { isDark: boolean }) {
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

// ==================== FIGURE AVATAR ====================

function FigureAvatar({ figure, size = 'md', showPulse = false, glow = true, isDark = true }: { 
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

  const hasPortrait = [
    'einstein', 'cleopatra', 'shakespeare', 'tesla', 'davinci', 
    'curie', 'lincoln', 'plato', 'archimedes', 'edison', 'newton', 
    'genghis', 'socrates', 'frida', 'gandhi', 'churchill', 'mlk'
  ].includes(figure.id);

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
          background: hasPortrait ? 'transparent' : `linear-gradient(135deg, ${figure.color}, ${figure.color}dd)`,
        }}
      >
        {hasPortrait ? (
          <img 
            src={`/portraits/${figure.id}.png`}
            alt={figure.name}
            className="w-full h-full object-cover"
          />
        ) : (
          figure.name.charAt(0)
        )}
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

// ==================== CHAT BUBBLE ====================

function ChatBubble({ 
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

// ==================== FIGURE CARD ====================

function FigureCard({ figure, isSelected, onToggle, isDark = true }: {
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

// ==================== TOPIC PILL ====================

function TopicPill({ topic, onClick, isDark = true }: { topic: string; onClick: () => void; isDark?: boolean }) {
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

// ==================== MAIN COMPONENT ====================

export default function HistoricalChatPage() {
  // Core state
  const [selectedFigures, setSelectedFigures] = useState<HistoricalFigure[]>([]);
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFigureDialog, setShowFigureDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Premium features state
  const [isDark, setIsDark] = useState(true);
  const [settings, setSettings] = useState<SettingsType>({
    soundEnabled: true,
    timestampsEnabled: true,
    theme: 'dark',
  });
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showEntrance, setShowEntrance] = useState<HistoricalFigure | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showBookmarksSheet, setShowBookmarksSheet] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [typingFigure, setTypingFigure] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (savedConvs) {
      try {
        setSavedConversations(JSON.parse(savedConvs));
      } catch (e) {
        console.error('Failed to parse saved conversations:', e);
      }
    }

    const savedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error('Failed to parse bookmarks:', e);
      }
    }

    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        soundEngine.setEnabled(parsed.soundEnabled);
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
      const isDarkTheme = savedTheme === 'dark';
      setIsDark(isDarkTheme);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(savedConversations));
  }, [savedConversations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show toast helper
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  // Toggle figure selection
  const toggleFigure = useCallback((figure: HistoricalFigure) => {
    setSelectedFigures(prev => {
      const isSelected = prev.some(f => f.id === figure.id);
      if (isSelected) {
        return prev.filter(f => f.id !== figure.id);
      } else if (prev.length < 6) {
        return [...prev, figure];
      }
      return prev;
    });
  }, []);

  // Start conversation
  const startConversation = async () => {
    if (selectedFigures.length === 0 || !topic.trim()) return;

    setIsChatStarted(true);
    setIsGenerating(true);
    setMessages([]);

    // Play sound and confetti
    if (settings.soundEnabled) {
      soundEngine.playConversationStart();
    }
    setShowConfetti(true);

    // Show first figure entrance
    if (selectedFigures.length > 0) {
      setShowEntrance(selectedFigures[0]);
      if (settings.soundEnabled) {
        soundEngine.playCharacterEntrance();
      }
    }

    // Generate initial responses from all figures
    await generateInitialResponses();
  };

  // Generate initial responses from all selected figures
  const generateInitialResponses = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figureIds: selectedFigures.map(f => f.id),
          topic,
          conversationHistory: []
        })
      });

      if (!response.ok) throw new Error('Failed to generate responses');

      const data = await response.json();
      
      // Add messages with staggered animation
      for (let i = 0; i < data.responses.length; i++) {
        const { figureId, content } = data.responses[i];
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Show typing indicator
        const figure = getFigureById(figureId);
        if (figure) {
          setTypingFigure(figure.name);
          if (settings.soundEnabled) {
            soundEngine.playFigureSpeak();
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        setTypingFigure(null);
        
        setMessages(prev => [...prev, {
          id: `${Date.now()}-${i}`,
          figureId,
          content,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error generating responses:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Stream a single response
  const streamResponse = async (message?: string) => {
    abortControllerRef.current = new AbortController();
    
    try {
      const conversationHistory: ConversationTurn[] = messages.map(m => ({
        figureId: m.figureId,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figureIds: selectedFigures.map(f => f.id),
          topic,
          conversationHistory,
          message
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let currentFigureId = '';
      let currentContent = '';
      let messageId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'figure') {
                currentFigureId = data.figureId;
                messageId = `${Date.now()}-${Math.random()}`;
                currentContent = '';
                
                // Show typing indicator
                const figure = getFigureById(currentFigureId);
                if (figure) {
                  setTypingFigure(figure.name);
                  if (settings.soundEnabled) {
                    soundEngine.playFigureSpeak();
                  }
                }

                await new Promise(resolve => setTimeout(resolve, 300));
                setTypingFigure(null);

                // Add streaming message
                setMessages(prev => [...prev, {
                  id: messageId,
                  figureId: currentFigureId,
                  content: '',
                  isStreaming: true,
                  timestamp: new Date()
                }]);
              } else if (data.type === 'token') {
                currentContent += data.content;
                setMessages(prev => prev.map(m => 
                  m.id === messageId 
                    ? { ...m, content: currentContent }
                    : m
                ));
              } else if (data.type === 'done') {
                setMessages(prev => prev.map(m => 
                  m.id === messageId 
                    ? { ...m, isStreaming: false, content: data.fullContent }
                    : m
                ));
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error streaming response:', error);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Send user message
  const sendMessage = async () => {
    if (!userInput.trim() || isGenerating) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsGenerating(true);

    if (settings.soundEnabled) {
      soundEngine.playMessageSent();
    }

    // Add user message to chat
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: userMsgId,
      figureId: 'moderator',
      content: userMessage,
      timestamp: new Date()
    }]);

    // Generate AI response
    await streamResponse(userMessage);
  };

  // Generate more conversation
  const generateMore = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    await streamResponse();
  };

  // Reset conversation
  const resetConversation = () => {
    setMessages([]);
    setIsChatStarted(false);
    setTopic('');
    setIsGenerating(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Add figure to active conversation
  const addFigureToChat = (figure: HistoricalFigure) => {
    if (!selectedFigures.some(f => f.id === figure.id)) {
      setSelectedFigures(prev => [...prev, figure]);
      setShowEntrance(figure);
      if (settings.soundEnabled) {
        soundEngine.playCharacterEntrance();
      }
    }
    setShowFigureDialog(false);
  };

  // Remove figure from conversation
  const removeFigure = (figureId: string) => {
    setSelectedFigures(prev => prev.filter(f => f.id !== figureId));
  };

  // Export conversation
  const exportConversation = () => {
    const text = messages.map(m => {
      const figure = getFigureById(m.figureId);
      return `${figure?.name || 'Moderator'}: ${m.content}`;
    }).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historical-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Conversation exported!');
  };

  // Save conversation
  const saveConversation = () => {
    if (!saveName.trim() || messages.length === 0) return;

    const newConversation: SavedConversation = {
      id: `conv-${Date.now()}`,
      name: saveName.trim(),
      topic,
      figureIds: selectedFigures.map(f => f.id),
      messages,
      savedAt: new Date(),
      figureCount: selectedFigures.length,
    };

    setSavedConversations(prev => [newConversation, ...prev]);
    setSaveName('');
    setShowSaveDialog(false);
    showToast('Conversation saved!');
  };

  // Load conversation
  const loadConversation = (conv: SavedConversation) => {
    const figures = conv.figureIds
      .map(id => getFigureById(id))
      .filter((f): f is HistoricalFigure => f !== undefined);
    
    setSelectedFigures(figures);
    setTopic(conv.topic);
    setMessages(conv.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    setIsChatStarted(true);
    setShowHistorySheet(false);
    showToast('Conversation loaded!');
  };

  // Delete saved conversation
  const deleteConversation = (id: string) => {
    setSavedConversations(prev => prev.filter(c => c.id !== id));
  };

  // Toggle bookmark
  const toggleBookmark = (message: ChatMessage) => {
    if (message.bookmarked) {
      // Remove bookmark
      setBookmarks(prev => prev.filter(b => b.messageId !== message.id));
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, bookmarked: false } : m
      ));
    } else {
      // Add bookmark
      const figure = getFigureById(message.figureId);
      const newBookmark: BookmarkItem = {
        id: `bm-${Date.now()}`,
        messageId: message.id,
        figureId: message.figureId,
        content: message.content,
        context: figure?.name || 'Moderator',
        timestamp: new Date(),
      };
      setBookmarks(prev => [newBookmark, ...prev]);
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, bookmarked: true } : m
      ));
      if (settings.soundEnabled) {
        soundEngine.playBookmark();
      }
    }
  };

  // Delete bookmark
  const deleteBookmark = (id: string) => {
    const bookmark = bookmarks.find(b => b.id === id);
    if (bookmark) {
      setMessages(prev => prev.map(m => 
        m.id === bookmark.messageId ? { ...m, bookmarked: false } : m
      ));
    }
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  // Add reaction
  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions || [];
        return { ...m, reactions: [...reactions, emoji] };
      }
      return m;
    }));
  };

  // Share conversation
  const shareConversation = async () => {
    const shareData = {
      title: 'Historical Figure Chat',
      text: `Check out this conversation about "${topic}" with ${selectedFigures.map(f => f.name).join(', ')}!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!');
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${shareData.title}\n\n${shareData.text}\n\n${window.location.href}`;
      await navigator.clipboard.writeText(shareText);
      showToast('Link copied to clipboard!');
    }
  };

  // Toggle settings
  const toggleSound = () => {
    const newSettings = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(newSettings);
    soundEngine.setEnabled(newSettings.soundEnabled);
  };

  const toggleTimestamps = () => {
    setSettings(prev => ({ ...prev, timestampsEnabled: !prev.timestampsEnabled }));
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden transition-colors duration-500",
      isDark 
        ? "bg-slate-950 text-white"
        : "bg-gradient-to-br from-amber-50 via-white to-orange-50 text-slate-900"
    )}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary gradient */}
        <div className={cn(
          "absolute inset-0",
          isDark 
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-amber-50 via-white to-orange-50"
        )} />
        
        {/* Ambient glows */}
        <motion.div
          className={cn(
            "absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full",
            isDark ? "opacity-100" : "opacity-50"
          )}
          style={{
            background: `radial-gradient(circle, ${isDark ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.15)'}, transparent 60%)`,
            filter: 'blur(40px)',
          }}
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={cn(
            "absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full",
            isDark ? "opacity-100" : "opacity-50"
          )}
          style={{
            background: `radial-gradient(circle, ${isDark ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.12)'}, transparent 60%)`,
            filter: 'blur(40px)',
          }}
          animate={{ 
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <AnimatedGrid isDark={isDark} />

      {/* Confetti */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Character Entrance Animation */}
      <AnimatePresence>
        {showEntrance && (
          <CharacterEntrance 
            figure={showEntrance} 
            onComplete={() => setShowEntrance(null)} 
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-2xl border-b",
        isDark 
          ? "border-white/5 bg-slate-950/80"
          : "border-amber-200/50 bg-white/80"
      )}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-lg opacity-50" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">
                  <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent">
                    Historical Chat
                  </span>
                </h1>
                <p className={cn("text-xs", isDark ? "text-white/40" : "text-slate-500")}>Where history comes alive</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1 sm:gap-2"
            >
              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleTheme}
                className={cn(
                  "rounded-full",
                  isDark 
                    ? "text-white/50 hover:text-white hover:bg-white/5"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>

              {/* Sound Toggle */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSound}
                className={cn(
                  "rounded-full",
                  isDark 
                    ? "text-white/50 hover:text-white hover:bg-white/5"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

              {isChatStarted && (
                <>
                  {/* Share Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={shareConversation}
                    className={cn(
                      "rounded-full",
                      isDark 
                        ? "text-white/50 hover:text-white hover:bg-white/5"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">Share</span>
                  </Button>

                  {/* Save Button */}
                  <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "rounded-full",
                          isDark 
                            ? "text-white/50 hover:text-white hover:bg-white/5"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        )}
                      >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1.5">Save</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className={cn(
                      "border",
                      isDark 
                        ? "bg-slate-900 border-white/10 text-white"
                        : "bg-white border-slate-200 text-slate-900"
                    )}>
                      <DialogHeader>
                        <DialogTitle>Save Conversation</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          placeholder="Enter a name for this conversation..."
                          value={saveName}
                          onChange={(e) => setSaveName(e.target.value)}
                          className={cn(
                            isDark 
                              ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/30"
                              : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowSaveDialog(false)}
                          className={isDark ? "border-white/10" : "border-slate-200"}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={saveConversation}
                          disabled={!saveName.trim()}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                        >
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Export Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={exportConversation}
                    className={cn(
                      "rounded-full",
                      isDark 
                        ? "text-white/50 hover:text-white hover:bg-white/5"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">Export</span>
                  </Button>

                  {/* Reset Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetConversation}
                    className={cn(
                      "rounded-full",
                      isDark 
                        ? "text-white/50 hover:text-white hover:bg-white/5"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">Reset</span>
                  </Button>
                </>
              )}

              {/* History Sheet */}
              <Sheet open={showHistorySheet} onOpenChange={setShowHistorySheet}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "rounded-full",
                      isDark 
                        ? "text-white/50 hover:text-white hover:bg-white/5"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">History</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className={cn(
                  "overflow-y-auto",
                  isDark 
                    ? "bg-slate-900 border-white/10 text-white"
                    : "bg-white border-slate-200 text-slate-900"
                )}>
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-amber-500" />
                      Saved Conversations
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-3">
                    {savedConversations.length === 0 ? (
                      <p className={cn("text-center py-8", isDark ? "text-white/40" : "text-slate-400")}>
                        No saved conversations yet
                      </p>
                    ) : (
                      savedConversations.map((conv) => (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-4 rounded-xl border cursor-pointer group",
                            isDark 
                              ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          )}
                          onClick={() => loadConversation(conv)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{conv.name}</h4>
                              <p className={cn("text-sm mt-1", isDark ? "text-white/50" : "text-slate-500")}>
                                {conv.topic}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={cn(
                                  "text-xs",
                                  isDark 
                                    ? "border-amber-500/20 text-amber-200"
                                    : "border-amber-300 text-amber-700"
                                )}>
                                  {conv.figureCount} figures
                                </Badge>
                                <span className={cn("text-xs", isDark ? "text-white/30" : "text-slate-400")}>
                                  {formatDate(conv.savedAt)}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                              className={cn(
                                "opacity-0 group-hover:opacity-100",
                                isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-500 hover:bg-red-50"
                              )}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Bookmarks Sheet */}
              <Sheet open={showBookmarksSheet} onOpenChange={setShowBookmarksSheet}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "rounded-full",
                      isDark 
                        ? "text-white/50 hover:text-white hover:bg-white/5"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">Bookmarks</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className={cn(
                  "overflow-y-auto",
                  isDark 
                    ? "bg-slate-900 border-white/10 text-white"
                    : "bg-white border-slate-200 text-slate-900"
                )}>
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Bookmark className="w-5 h-5 text-amber-500" />
                      Bookmarked Moments
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-3">
                    {bookmarks.length === 0 ? (
                      <p className={cn("text-center py-8", isDark ? "text-white/40" : "text-slate-400")}>
                        No bookmarks yet. Click the bookmark icon on messages to save them.
                      </p>
                    ) : (
                      bookmarks.map((bm) => {
                        const figure = getFigureById(bm.figureId);
                        return (
                          <motion.div
                            key={bm.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "p-4 rounded-xl border group",
                              isDark 
                                ? "bg-white/[0.03] border-white/10"
                                : "bg-slate-50 border-slate-200"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {figure && <FigureAvatar figure={figure} size="sm" isDark={isDark} />}
                              <div className="flex-1">
                                <p className={cn("text-sm", isDark ? "text-white/80" : "text-slate-700")}>
                                  {bm.content.substring(0, 150)}{bm.content.length > 150 ? '...' : ''}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={cn("text-xs font-medium", isDark ? "text-white/50" : "text-slate-500")}>
                                    {bm.context}
                                  </span>
                                  <span className={cn("text-xs", isDark ? "text-white/30" : "text-slate-400")}>
                                    {formatDate(bm.timestamp)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteBookmark(bm.id)}
                                className={cn(
                                  "opacity-0 group-hover:opacity-100",
                                  isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-500 hover:bg-red-50"
                                )}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {!isChatStarted ? (
            // Setup Screen
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 sm:space-y-12"
            >
              {/* Hero Section */}
              <motion.section 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative text-center py-8 sm:py-16"
              >
                <FloatingParticles isDark={isDark} />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                >
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6",
                    isDark 
                      ? "bg-amber-500/10 border border-amber-500/20"
                      : "bg-amber-100 border border-amber-200"
                  )}>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className={cn(
                      "text-xs font-medium",
                      isDark ? "text-amber-200" : "text-amber-700"
                    )}>AI-Powered Conversations</span>
                  </div>
                  
                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                    <span className={cn(
                      "bg-clip-text text-transparent",
                      isDark 
                        ? "bg-gradient-to-r from-white via-white to-white/80"
                        : "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700"
                    )}>
                      What if Einstein & Cleopatra
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent">
                      were in a group chat?
                    </span>
                  </h2>
                  
                  <p className={cn(
                    "max-w-2xl mx-auto text-base sm:text-lg leading-relaxed",
                    isDark ? "text-white/50" : "text-slate-600"
                  )}>
                    Select history&apos;s greatest minds, choose a topic, and watch them debate in real-time. 
                    Jump in anytime as the moderator and steer the conversation.
                  </p>
                </motion.div>

                {/* Animated avatars preview */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center mt-8 -space-x-3"
                >
                  {['einstein', 'cleopatra', 'tesla', 'davinci', 'curie'].map((id, i) => {
                    const fig = historicalFigures.find(f => f.id === id);
                    if (!fig) return null;
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="relative"
                      >
                        <FigureAvatar figure={fig} size="lg" isDark={isDark} />
                      </motion.div>
                    );
                  })}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center",
                      isDark 
                        ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-dashed border-amber-500/40"
                        : "bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-dashed border-amber-300"
                    )}
                  >
                    <Plus className="w-5 h-5 text-amber-500" />
                  </motion.div>
                </motion.div>
              </motion.section>

              {/* Figure Selection */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className={cn(
                  "relative overflow-hidden backdrop-blur-xl",
                  isDark 
                    ? "bg-white/[0.02] border-white/5"
                    : "bg-white border-slate-200 shadow-lg"
                )}>
                  {/* Card glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                  
                  <CardContent className="relative p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>Select Figures</h3>
                          <p className={cn("text-xs", isDark ? "text-white/40" : "text-slate-500")}>Choose up to 6 historical figures</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "font-medium",
                          isDark 
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        )}
                      >
                        {selectedFigures.length}/6
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {historicalFigures.map((figure, i) => (
                        <motion.div
                          key={figure.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + i * 0.03 }}
                        >
                          <FigureCard
                            figure={figure}
                            isSelected={selectedFigures.some(f => f.id === figure.id)}
                            onToggle={() => toggleFigure(figure)}
                            isDark={isDark}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.section>

              {/* Topic Input */}
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className={cn(
                  "relative overflow-hidden backdrop-blur-xl",
                  isDark 
                    ? "bg-white/[0.02] border-white/5"
                    : "bg-white border-slate-200 shadow-lg"
                )}>
                  {/* Card glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                  
                  <CardContent className="relative p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h3 className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>Choose a Topic</h3>
                        <p className={cn("text-xs", isDark ? "text-white/40" : "text-slate-500")}>What should they discuss?</p>
                      </div>
                    </div>
                    
                    <Textarea
                      placeholder="What should they discuss? e.g., 'Is AI a threat to humanity?'"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className={cn(
                        "min-h-[100px] mb-4 rounded-xl resize-none transition-all",
                        isDark 
                          ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20"
                      )}
                    />
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {suggestedTopics.map((t, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.05 }}
                        >
                          <TopicPill topic={t} onClick={() => setTopic(t)} isDark={isDark} />
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Button
                        onClick={startConversation}
                        disabled={selectedFigures.length === 0 || !topic.trim()}
                        className={cn(
                          "w-full relative overflow-hidden",
                          "bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500",
                          "hover:from-amber-400 hover:via-amber-300 hover:to-orange-400",
                          "text-white font-semibold py-6 sm:py-7 text-base sm:text-lg rounded-xl",
                          "shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "transition-all duration-300"
                        )}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                        
                        <PartyPopper className="w-5 h-5 mr-2 relative z-10" />
                        <span className="relative z-10">Start the Conversation</span>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.section>
            </motion.div>
          ) : (
            // Chat Screen
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Active Figures Bar */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(
                  "backdrop-blur-xl",
                  isDark 
                    ? "bg-white/[0.02] border-white/5"
                    : "bg-white border-slate-200 shadow-sm"
                )}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
                      <span className={cn(
                        "text-xs whitespace-nowrap font-medium",
                        isDark ? "text-white/40" : "text-slate-500"
                      )}>Active:</span>
                      <AnimatePresence mode="popLayout">
                        {selectedFigures.map((figure, i) => (
                          <motion.div
                            key={figure.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                              "flex items-center gap-2 rounded-full pl-1 pr-2 py-1 border",
                              isDark 
                                ? "bg-white/[0.03] border-white/5"
                                : "bg-slate-50 border-slate-200"
                            )}
                          >
                            <FigureAvatar figure={figure} size="sm" isDark={isDark} />
                            <span className={cn(
                              "text-xs whitespace-nowrap",
                              isDark ? "text-white/70" : "text-slate-600"
                            )}>{figure.name}</span>
                            <button
                              onClick={() => removeFigure(figure.id)}
                              className={cn(
                                "transition-colors",
                                isDark 
                                  ? "text-white/30 hover:text-white/80"
                                  : "text-slate-400 hover:text-slate-600"
                              )}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      <Dialog open={showFigureDialog} onOpenChange={setShowFigureDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn(
                              "shrink-0 rounded-full",
                              isDark 
                                ? "text-white/40 hover:text-white hover:bg-white/5"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            )}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className={cn(
                          "max-h-[80vh] overflow-y-auto backdrop-blur-xl",
                          isDark 
                            ? "bg-slate-900/95 border-white/10 text-white"
                            : "bg-white border-slate-200 text-slate-900"
                        )}>
                          <DialogHeader>
                            <DialogTitle>Add Historical Figure</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {historicalFigures
                              .filter(f => !selectedFigures.some(sf => sf.id === f.id))
                              .map(figure => (
                                <Button
                                  key={figure.id}
                                  variant="outline"
                                  className={cn(
                                    "justify-start transition-all",
                                    isDark 
                                      ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-amber-500/30"
                                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-amber-300"
                                  )}
                                  onClick={() => addFigureToChat(figure)}
                                >
                                  <FigureAvatar figure={figure} size="sm" isDark={isDark} />
                                  <span className={cn("ml-2", isDark ? "text-white/80" : "text-slate-700")}>{figure.name}</span>
                                </Button>
                              ))
                            }
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Topic Display */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-center gap-2 py-2"
              >
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-sm px-4 py-1.5 rounded-full",
                    isDark 
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                      : "bg-amber-50 border-amber-200 text-amber-700"
                  )}
                >
                  <Quote className="w-3 h-3 mr-1.5" />
                  {topic}
                </Badge>
              </motion.div>

              {/* Chat Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className={cn(
                  "relative overflow-hidden backdrop-blur-xl",
                  isDark 
                    ? "bg-white/[0.02] border-white/5"
                    : "bg-white border-slate-200 shadow-sm"
                )}>
                  {/* Ambient glow at top */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-32 bg-gradient-to-b to-transparent pointer-events-none",
                    isDark ? "from-amber-500/5" : "from-amber-100/50"
                  )} />
                  
                  <CardContent className="relative p-0">
                    <ScrollArea className="h-[50vh] sm:h-[55vh] lg:h-[500px] p-4 sm:p-6" ref={scrollRef}>
                      <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                          {messages.map((message, index) => {
                            const figure = getFigureById(message.figureId);
                            if (message.figureId === 'moderator') {
                              return (
                                <motion.div
                                  key={message.id}
                                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="flex justify-end"
                                >
                                  <div className={cn(
                                    "rounded-2xl p-4 max-w-[85%] sm:max-w-[75%] shadow-lg",
                                    isDark 
                                      ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 shadow-amber-500/5"
                                      : "bg-gradient-to-br from-amber-100 to-orange-50 border border-amber-200"
                                  )}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                                      <span className="text-xs text-amber-500 font-semibold">You (Moderator)</span>
                                      {settings.timestampsEnabled && (
                                        <span className={cn("text-xs", isDark ? "text-white/30" : "text-slate-400")}>
                                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </div>
                                    <p className={cn("text-sm", isDark ? "text-white/90" : "text-slate-700")}>{message.content}</p>
                                  </div>
                                </motion.div>
                              );
                            }
                            return (
                              <ChatBubble 
                                key={message.id} 
                                message={message} 
                                figure={figure}
                                index={index}
                                onBookmark={() => toggleBookmark(message)}
                                onReact={(emoji) => addReaction(message.id, emoji)}
                                showTimestamps={settings.timestampsEnabled}
                                isDark={isDark}
                              />
                            );
                          })}
                        </AnimatePresence>
                        
                        {/* Typing indicator */}
                        {typingFigure && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 p-4"
                          >
                            <div className={cn(
                              "flex items-center gap-3 px-4 py-2 rounded-full border",
                              isDark 
                                ? "bg-white/[0.03] border-white/5"
                                : "bg-slate-50 border-slate-200"
                            )}>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              >
                                <Loader2 className="w-4 h-4 text-amber-400" />
                              </motion.div>
                              <span className={cn(
                                "text-sm",
                                isDark ? "text-white/50" : "text-slate-500"
                              )}>{typingFigure} is thinking...</span>
                            </div>
                          </motion.div>
                        )}

                        {/* Loading state */}
                        {isGenerating && messages.every(m => !m.isStreaming) && !typingFigure && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center py-8"
                          >
                            <div className={cn(
                              "flex items-center gap-3 px-4 py-2 rounded-full border",
                              isDark 
                                ? "bg-white/[0.03] border-white/5"
                                : "bg-slate-50 border-slate-200"
                            )}>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              >
                                <Loader2 className="w-5 h-5 text-amber-400" />
                              </motion.div>
                              <span className={cn(
                                "text-sm",
                                isDark ? "text-white/50" : "text-slate-500"
                              )}>A historical figure is thinking...</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Input Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className={cn(
                  "backdrop-blur-xl",
                  isDark 
                    ? "bg-white/[0.02] border-white/5"
                    : "bg-white border-slate-200 shadow-sm"
                )}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        onClick={generateMore}
                        disabled={isGenerating}
                        className={cn(
                          "shrink-0 transition-all",
                          isDark 
                            ? "border-white/10 hover:bg-white/5 hover:border-amber-500/30"
                            : "border-slate-200 hover:bg-slate-50 hover:border-amber-300"
                        )}
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">Continue</span>
                      </Button>
                      <Input
                        placeholder="Jump in as moderator..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        className={cn(
                          "rounded-xl transition-all",
                          isDark 
                            ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                            : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20"
                        )}
                        disabled={isGenerating}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!userInput.trim() || isGenerating}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shrink-0 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={cn(
        "relative border-t backdrop-blur-xl mt-auto",
        isDark 
          ? "border-white/5 bg-slate-950/50"
          : "border-slate-200 bg-white/50"
      )}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-center text-xs">
              <span className="bg-gradient-to-r from-amber-200/50 to-orange-200/50 bg-clip-text text-transparent font-medium">
                Historical Figure Group Chat
              </span>
              <span className={cn("mx-2", isDark ? "text-white/20" : "text-slate-400")}>—</span>
              <span className={isDark ? "text-white/20" : "text-slate-400"}>A 2026 AI Experiment</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTimestamps}
                className={cn(
                  "text-xs rounded-full",
                  isDark 
                    ? "text-white/30 hover:text-white/50"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Clock className="w-3 h-3 mr-1" />
                {settings.timestampsEnabled ? 'Hide Time' : 'Show Time'}
              </Button>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
