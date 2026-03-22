'use client';

import { motion } from 'framer-motion';
import { Sparkles, Users, Zap, Plus, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { historicalFigures } from '@/lib/figures';
import { suggestedTopics } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';
import { useSettingsStore } from '@/stores/settings-store';
import { FloatingParticles } from '@/components/effects/BackgroundEffects';
import { FigureAvatar } from '@/components/figures/FigureAvatar';
import { FigureCard } from '@/components/figures/FigureCard';
import { TopicPill } from '@/components/figures/TopicPill';

export function SetupScreen() {
  const { isDark, settings } = useSettingsStore();
  const { selectedFigures, topic, setTopic, toggleFigure, startConversation } = useChatStore();

  return (
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
                onClick={() => startConversation(settings.soundEnabled)}
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
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                <PartyPopper className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Start the Conversation</span>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.section>
    </motion.div>
  );
}
