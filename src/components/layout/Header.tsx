'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, Share2, Save, Download, Trash2, 
  History, Bookmark, Moon, Sun, Volume2, VolumeX,
  Clock, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger 
} from '@/components/ui/sheet';
import { getFigureById } from '@/lib/figures';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';
import { useSettingsStore } from '@/stores/settings-store';
import { FigureAvatar } from '@/components/figures/FigureAvatar';

export function Header() {
  const { isDark, toggleTheme, toggleSound, settings } = useSettingsStore();
  const { 
    isChatStarted, savedConversations, bookmarks,
    shareConversation, exportConversation, resetConversation,
    saveConversation, loadConversation, deleteConversation,
    deleteBookmark, showToast
  } = useChatStore();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showBookmarksSheet, setShowBookmarksSheet] = useState(false);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSave = () => {
    saveConversation(saveName);
    setSaveName('');
    setShowSaveDialog(false);
  };

  const handleLoad = (conv: typeof savedConversations[0]) => {
    loadConversation(conv);
    setShowHistorySheet(false);
  };

  return (
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
            {isChatStarted && (
              <button
                onClick={resetConversation}
                className={cn(
                  "p-2 rounded-xl transition-all group",
                  isDark 
                    ? "hover:bg-white/5 text-white/40 hover:text-white" 
                    : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                )}
                title="End conversation"
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}
            <button
              onClick={isChatStarted ? resetConversation : undefined}
              className={cn(
                "flex items-center gap-3",
                isChatStarted && "cursor-pointer"
              )}
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
            </button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1 sm:gap-2"
          >
            <Button variant="ghost" size="sm" onClick={toggleTheme}
              className={cn("rounded-full", isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
            >
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={toggleSound}
              className={cn("rounded-full", isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>

            {isChatStarted && (
              <>
                <Button variant="ghost" size="sm" onClick={shareConversation}
                  className={cn("rounded-full", isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Share</span>
                </Button>

                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm"
                      className={cn("rounded-full", isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
                    >
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1.5">Save</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={cn("border", isDark ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}>
                    <DialogHeader>
                      <DialogTitle>Save Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Enter a name for this conversation..."
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        className={cn(isDark ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/30" : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400")}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)}
                        className={isDark ? "border-white/10" : "border-slate-200"}
                      >Cancel</Button>
                      <Button onClick={handleSave} disabled={!saveName.trim()}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                      >Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" size="sm" onClick={exportConversation}
                  className={cn("rounded-full", isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Export</span>
                </Button>

                <Button variant="ghost" size="sm" onClick={resetConversation}
                  className={cn("rounded-full", isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Reset</span>
                </Button>
              </>
            )}

            {/* History Sheet */}
            <Sheet open={showHistorySheet} onOpenChange={setShowHistorySheet}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm"
                  className={cn("rounded-full", isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">History</span>
                </Button>
              </SheetTrigger>
              <SheetContent className={cn("overflow-y-auto", isDark ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}>
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
                          isDark ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        )}
                        onClick={() => handleLoad(conv)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{conv.name}</h4>
                            <p className={cn("text-sm mt-1", isDark ? "text-white/50" : "text-slate-500")}>{conv.topic}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={cn("text-xs", isDark ? "border-amber-500/20 text-amber-200" : "border-amber-300 text-amber-700")}>
                                {conv.figureCount} figures
                              </Badge>
                              <span className={cn("text-xs", isDark ? "text-white/30" : "text-slate-400")}>{formatDate(conv.savedAt)}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm"
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                            className={cn("opacity-0 group-hover:opacity-100", isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-500 hover:bg-red-50")}
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
                <Button variant="ghost" size="sm"
                  className={cn("rounded-full", isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")}
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Bookmarks</span>
                </Button>
              </SheetTrigger>
              <SheetContent className={cn("overflow-y-auto", isDark ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900")}>
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
                          className={cn("p-4 rounded-xl border group", isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200")}
                        >
                          <div className="flex items-start gap-3">
                            {figure && <FigureAvatar figure={figure} size="sm" isDark={isDark} />}
                            <div className="flex-1">
                              <p className={cn("text-sm", isDark ? "text-white/80" : "text-slate-700")}>
                                {bm.content.substring(0, 150)}{bm.content.length > 150 ? '...' : ''}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={cn("text-xs font-medium", isDark ? "text-white/50" : "text-slate-500")}>{bm.context}</span>
                                <span className={cn("text-xs", isDark ? "text-white/30" : "text-slate-400")}>{formatDate(bm.timestamp)}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => deleteBookmark(bm.id)}
                              className={cn("opacity-0 group-hover:opacity-100", isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-500 hover:bg-red-50")}
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
  );
}
