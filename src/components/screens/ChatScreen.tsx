'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Plus, X, Crown, Quote, Play, Pause, Volume2, VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { historicalFigures, getFigureById } from '@/lib/figures';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';
import { useSettingsStore } from '@/stores/settings-store';
import { AutoPlaySpeed } from '@/lib/types';
import { FigureAvatar } from '@/components/figures/FigureAvatar';
import { ChatBubble } from '@/components/chat/ChatBubble';

export function ChatScreen() {
  const { isDark, settings, toggleTTS, setAutoPlaySpeed } = useSettingsStore();
  const { 
    selectedFigures, topic, messages, userInput, isGenerating, typingFigure,
    speakingFigure, isAutoPlaying,
    setUserInput, removeFigure, addFigureToChat, sendMessage, startAutoPlay,
    stopAutoPlay, replayMessage, toggleBookmark, addReaction
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFigureDialog, setShowFigureDialog] = useState(false);

  // Auto scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAddFigure = (figure: typeof selectedFigures[0]) => {
    addFigureToChat(figure, settings.soundEnabled);
    setShowFigureDialog(false);
  };

  return (
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
                          onClick={() => handleAddFigure(figure)}
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
          <div className={cn(
            "absolute top-0 left-0 right-0 h-32 bg-gradient-to-b to-transparent pointer-events-none",
            isDark ? "from-amber-500/5" : "from-amber-100/50"
          )} />
          
          <CardContent className="relative p-0">
            <ScrollArea className="h-[50vh] sm:h-[55vh] lg:h-[500px] p-4 sm:p-6" ref={scrollRef}>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => {
                    const figure = getFigureById(message.figureId);
                    if (message.figureId === 'moderator') {
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ type: "spring", stiffness: 120, damping: 18 }}
                          className="flex justify-end"
                        >
                          <div className={cn(
                            "rounded-2xl p-4 max-w-[85%] sm:max-w-[70%]",
                            isDark 
                              ? "bg-gradient-to-br from-amber-500/15 to-orange-500/5 border border-amber-500/15"
                              : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60"
                          )}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Crown className="w-2.5 h-2.5 text-white" />
                              </div>
                              <span className={cn(
                                "text-xs font-semibold",
                                isDark ? "text-amber-300/80" : "text-amber-600"
                              )}>You (Moderator)</span>
                              {settings.timestampsEnabled && (
                                <span className={cn("text-[10px] ml-auto", isDark ? "text-white/20" : "text-slate-300")}>
                                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className={cn("text-sm leading-relaxed", isDark ? "text-white/85" : "text-slate-700")}>{message.content}</p>
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
                        isSpeaking={speakingFigure === message.figureId}
                        onBookmark={() => toggleBookmark(message, settings.soundEnabled)}
                        onReact={(emoji) => addReaction(message.id, emoji)}
                        onReplay={() => replayMessage(message)}
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
                    className="flex items-center gap-3 px-2"
                  >
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-2xl border",
                      isDark 
                        ? "bg-white/[0.03] border-white/5"
                        : "bg-slate-50 border-slate-200"
                    )}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="typing-dot bg-amber-400" />
                        <span className="typing-dot bg-amber-400" />
                        <span className="typing-dot bg-amber-400" />
                      </span>
                      <span className={cn(
                        "text-sm font-medium",
                        isDark ? "text-white/40" : "text-slate-400"
                      )}>{typingFigure} is thinking</span>
                    </div>
                  </motion.div>
                )}

                {/* Loading state */}
                {isGenerating && messages.every(m => !m.isStreaming) && !typingFigure && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center py-6"
                  >
                    <div className={cn(
                      "flex items-center gap-3 px-5 py-2.5 rounded-2xl border",
                      isDark 
                        ? "bg-white/[0.03] border-white/5"
                        : "bg-slate-50 border-slate-200"
                    )}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="typing-dot bg-amber-400" />
                        <span className="typing-dot bg-amber-400" />
                        <span className="typing-dot bg-amber-400" />
                      </span>
                      <span className={cn(
                        "text-sm font-medium",
                        isDark ? "text-white/40" : "text-slate-400"
                      )}>Someone is formulating a thought...</span>
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
          <CardContent className="p-3 sm:p-4 space-y-3">
            {/* Playback controls row */}
            <div className="flex items-center gap-2">
              {/* Play / Pause */}
              <Button
                variant="outline"
                size="sm"
                onClick={isAutoPlaying ? stopAutoPlay : startAutoPlay}
                className={cn(
                  "shrink-0 gap-1.5 transition-all",
                  isAutoPlaying
                    ? isDark
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : isDark 
                      ? "border-white/10 hover:bg-white/5 hover:border-amber-500/30"
                      : "border-slate-200 hover:bg-slate-50 hover:border-amber-300"
                )}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs">Play</span>
                  </>
                )}
              </Button>

              {/* Speed selector */}
              <div className={cn(
                "flex items-center rounded-lg border overflow-hidden text-xs font-medium",
                isDark ? "border-white/10" : "border-slate-200"
              )}>
                {([
                  { speed: 'relaxed' as AutoPlaySpeed, label: 'Slow' },
                  { speed: 'normal' as AutoPlaySpeed, label: '1×' },
                  { speed: 'fast' as AutoPlaySpeed, label: 'Fast' },
                ] as const).map(({ speed, label }) => (
                  <button
                    key={speed}
                    onClick={() => setAutoPlaySpeed(speed)}
                    className={cn(
                      "px-3 py-1.5 transition-all",
                      settings.autoPlaySpeed === speed
                        ? isDark
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-amber-100 text-amber-700"
                        : isDark
                          ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* TTS toggle */}
              <button
                onClick={toggleTTS}
                className={cn(
                  "shrink-0 ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                  settings.ttsEnabled
                    ? isDark
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : isDark
                      ? "border-white/10 text-white/30 hover:text-white/60 hover:bg-white/5"
                      : "border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                {settings.ttsEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{settings.ttsEnabled ? 'Audio On' : 'Audio Off'}</span>
              </button>
            </div>

            {/* Input row */}
            <div className="flex gap-2 sm:gap-3">
              <Input
                placeholder="Jump in as moderator..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(settings.soundEnabled)}
                className={cn(
                  "rounded-xl transition-all",
                  isDark 
                    ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-amber-400/20"
                )}
                disabled={isGenerating}
              />
              <Button
                onClick={() => sendMessage(settings.soundEnabled)}
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
  );
}
