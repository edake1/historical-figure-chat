import { create } from 'zustand';
import { ChatMessage, ConversationTurn, SavedConversation, BookmarkItem, STORAGE_KEYS } from '@/lib/types';
import { HistoricalFigure, getFigureById } from '@/lib/figures';
import { soundEngine } from '@/lib/sound-engine';
import { ttsEngine } from '@/lib/tts-engine';

interface ChatStore {
  // Core state
  selectedFigures: HistoricalFigure[];
  topic: string;
  messages: ChatMessage[];
  userInput: string;
  isChatStarted: boolean;
  isGenerating: boolean;
  typingFigure: string | null;
  speakingFigure: string | null;
  isAutoPlaying: boolean;

  // Saved data
  savedConversations: SavedConversation[];
  bookmarks: BookmarkItem[];

  // UI state
  showConfetti: boolean;
  showEntrance: HistoricalFigure | null;
  toast: { message: string; visible: boolean };

  // Actions
  setTopic: (topic: string) => void;
  setUserInput: (input: string) => void;
  setShowConfetti: (show: boolean) => void;
  setShowEntrance: (figure: HistoricalFigure | null) => void;
  showToast: (message: string) => void;
  hideToast: () => void;

  toggleFigure: (figure: HistoricalFigure) => void;
  removeFigure: (figureId: string) => void;
  addFigureToChat: (figure: HistoricalFigure, soundEnabled: boolean) => void;

  // Chat actions
  startConversation: (soundEnabled: boolean) => Promise<void>;
  sendMessage: (soundEnabled: boolean) => Promise<void>;
  generateMore: () => Promise<void>;
  resetConversation: () => void;
  startAutoPlay: () => void;
  stopAutoPlay: () => void;
  replayMessage: (message: ChatMessage) => void;

  // Message mutations
  addReaction: (messageId: string, emoji: string) => void;
  toggleBookmark: (message: ChatMessage, soundEnabled: boolean) => void;
  deleteBookmark: (id: string) => void;

  // Conversation management
  saveConversation: (name: string) => void;
  loadConversation: (conv: SavedConversation) => void;
  deleteConversation: (id: string) => void;

  // Export / Share
  exportConversation: () => void;
  shareConversation: () => Promise<void>;

  // Storage
  loadFromStorage: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => {
  // Internal ref for abort controller
  let abortController: AbortController | null = null;
  let autoPlayTimer: ReturnType<typeof setTimeout> | null = null;

  const getAutoPlayDelay = (lastMessageContent?: string): number => {
    const settingsStore = require('./settings-store').useSettingsStore.getState();
    const speed = settingsStore.settings.autoPlaySpeed;
    const ttsEnabled = settingsStore.settings.ttsEnabled;

    // Base delay between turns
    const baseDelay = speed === 'relaxed' ? 2000 : speed === 'fast' ? 500 : 1000;

    // When TTS is off, add reading time based on message length
    // ~200 WPM reading speed = ~300ms per word
    if (!ttsEnabled && lastMessageContent) {
      const wordCount = lastMessageContent.split(/\s+/).length;
      const readingMs = wordCount * 300;
      const speedMultiplier = speed === 'relaxed' ? 1.3 : speed === 'fast' ? 0.6 : 1;
      return baseDelay + Math.round(readingMs * speedMultiplier);
    }

    return baseDelay;
  };

  const scheduleAutoPlayNext = () => {
    const settingsStore = require('./settings-store').useSettingsStore.getState();
    if (!settingsStore.settings.autoPlay || !get().isAutoPlaying) return;

    // Get the last message content for reading-time calculation
    const messages = get().messages;
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastContent = lastMsg?.figureId !== 'moderator' ? lastMsg?.content : undefined;
    
    autoPlayTimer = setTimeout(async () => {
      if (!get().isAutoPlaying || get().isGenerating) return;
      set({ isGenerating: true });
      await streamResponse();
      // After response finishes, schedule the next one
      if (get().isAutoPlaying) {
        scheduleAutoPlayNext();
      }
    }, getAutoPlayDelay(lastContent));
  };

  const speakIfEnabled = async (text: string, figureId: string) => {
    const settingsStore = require('./settings-store').useSettingsStore.getState();
    if (settingsStore.settings.ttsEnabled) {
      set({ speakingFigure: figureId });
      try {
        await ttsEngine.speak(text, figureId);
      } catch {
        // TTS failure shouldn't break the flow
      } finally {
        set({ speakingFigure: null });
      }
    }
  };

  const streamResponse = async (message?: string) => {
    abortController = new AbortController();
    const { selectedFigures, topic, messages } = get();
    const settingsStore = (await import('./settings-store')).useSettingsStore.getState();

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
        signal: abortController.signal
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
                
                const figure = getFigureById(currentFigureId);
                if (figure) {
                  set({ typingFigure: figure.name });
                  if (settingsStore.settings.soundEnabled) {
                    soundEngine.playFigureSpeak();
                  }
                }

                await new Promise(resolve => setTimeout(resolve, 300));
                set({ typingFigure: null });

                set(state => ({
                  messages: [...state.messages, {
                    id: messageId,
                    figureId: currentFigureId,
                    content: '',
                    isStreaming: true,
                    timestamp: new Date()
                  }]
                }));
              } else if (data.type === 'token') {
                currentContent += data.content;
                const capturedId = messageId;
                const capturedContent = currentContent;
                set(state => ({
                  messages: state.messages.map(m => 
                    m.id === capturedId 
                      ? { ...m, content: capturedContent }
                      : m
                  )
                }));
              } else if (data.type === 'done') {
                const capturedId = messageId;
                const capturedFigureId = currentFigureId;
                const capturedContent = data.fullContent;
                set(state => ({
                  messages: state.messages.map(m => 
                    m.id === capturedId 
                      ? { ...m, isStreaming: false, content: capturedContent }
                      : m
                  )
                }));
                // Speak the completed message
                await speakIfEnabled(capturedContent, capturedFigureId);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error streaming response:', error);
      }
    } finally {
      set({ isGenerating: false });
      abortController = null;
    }
  };

  return {
    // Initial state
    selectedFigures: [],
    topic: '',
    messages: [],
    userInput: '',
    isChatStarted: false,
    isGenerating: false,
    typingFigure: null,
    speakingFigure: null,
    isAutoPlaying: false,
    savedConversations: [],
    bookmarks: [],
    showConfetti: false,
    showEntrance: null,
    toast: { message: '', visible: false },

    // Simple setters
    setTopic: (topic) => set({ topic }),
    setUserInput: (userInput) => set({ userInput }),
    setShowConfetti: (showConfetti) => set({ showConfetti }),
    setShowEntrance: (showEntrance) => set({ showEntrance }),
    showToast: (message) => set({ toast: { message, visible: true } }),
    hideToast: () => set(state => ({ toast: { ...state.toast, visible: false } })),

    // Figure management
    toggleFigure: (figure) => set(state => {
      const isSelected = state.selectedFigures.some(f => f.id === figure.id);
      if (isSelected) {
        return { selectedFigures: state.selectedFigures.filter(f => f.id !== figure.id) };
      } else if (state.selectedFigures.length < 6) {
        return { selectedFigures: [...state.selectedFigures, figure] };
      }
      return state;
    }),

    removeFigure: (figureId) => set(state => ({
      selectedFigures: state.selectedFigures.filter(f => f.id !== figureId)
    })),

    addFigureToChat: (figure, soundEnabled) => {
      const { selectedFigures } = get();
      if (!selectedFigures.some(f => f.id === figure.id)) {
        set(state => ({ selectedFigures: [...state.selectedFigures, figure] }));
        set({ showEntrance: figure });
        if (soundEnabled) {
          soundEngine.playCharacterEntrance();
        }
      }
    },

    // Chat actions
    startConversation: async (soundEnabled) => {
      const { selectedFigures, topic } = get();
      if (selectedFigures.length === 0 || !topic.trim()) return;

      set({ isChatStarted: true, isGenerating: true, messages: [] });

      if (soundEnabled) {
        soundEngine.playConversationStart();
      }
      set({ showConfetti: true });

      if (selectedFigures.length > 0) {
        set({ showEntrance: selectedFigures[0] });
        if (soundEnabled) {
          soundEngine.playCharacterEntrance();
        }
      }

      // Stream each figure's initial response sequentially (typewriter effect)
      try {
        for (const figure of selectedFigures) {
          // Build conversation history from messages generated so far
          const currentMessages = get().messages;
          const conversationHistory: ConversationTurn[] = currentMessages.map(m => ({
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
              respondAsFigureId: figure.id
            })
          });

          if (!response.ok) throw new Error('Failed to get response');

          const reader = response.body?.getReader();
          if (!reader) continue;

          const decoder = new TextDecoder();
          let messageId = '';
          let currentContent = '';

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
                    messageId = `${Date.now()}-${Math.random()}`;
                    currentContent = '';

                    set({ typingFigure: figure.name });
                    if (soundEnabled) {
                      soundEngine.playFigureSpeak();
                    }

                    await new Promise(resolve => setTimeout(resolve, 300));
                    set({ typingFigure: null });

                    set(state => ({
                      messages: [...state.messages, {
                        id: messageId,
                        figureId: figure.id,
                        content: '',
                        isStreaming: true,
                        timestamp: new Date()
                      }]
                    }));
                  } else if (data.type === 'token') {
                    currentContent += data.content;
                    const capturedId = messageId;
                    const capturedContent = currentContent;
                    set(state => ({
                      messages: state.messages.map(m =>
                        m.id === capturedId
                          ? { ...m, content: capturedContent }
                          : m
                      )
                    }));
                  } else if (data.type === 'done') {
                    const capturedId = messageId;
                    const capturedFigureId = figure.id;
                    const capturedContent = data.fullContent;
                    set(state => ({
                      messages: state.messages.map(m =>
                        m.id === capturedId
                          ? { ...m, isStreaming: false, content: capturedContent }
                          : m
                      )
                    }));
                    // Speak the completed message
                    await speakIfEnabled(capturedContent, capturedFigureId);
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error generating responses:', error);
      } finally {
        set({ isGenerating: false });
        // Start auto-play loop after initial conversation
        const settingsStore = require('./settings-store').useSettingsStore.getState();
        if (settingsStore.settings.autoPlay) {
          set({ isAutoPlaying: true });
          scheduleAutoPlayNext();
        }
      }
    },

    sendMessage: async (soundEnabled) => {
      const { userInput, isGenerating } = get();
      if (!userInput.trim() || isGenerating) return;

      const userMessage = userInput.trim();
      // Pause auto-play while user sends a message
      const wasAutoPlaying = get().isAutoPlaying;
      if (wasAutoPlaying) {
        if (autoPlayTimer) clearTimeout(autoPlayTimer);
        autoPlayTimer = null;
      }
      
      set({ userInput: '', isGenerating: true });

      if (soundEnabled) {
        soundEngine.playMessageSent();
      }

      set(state => ({
        messages: [...state.messages, {
          id: `user-${Date.now()}`,
          figureId: 'moderator',
          content: userMessage,
          timestamp: new Date()
        }]
      }));

      await streamResponse(userMessage);
      
      // Resume auto-play after the figure responds
      if (wasAutoPlaying && get().isAutoPlaying) {
        scheduleAutoPlayNext();
      }
    },

    generateMore: async () => {
      if (get().isGenerating) return;
      set({ isGenerating: true });
      await streamResponse();
      // If auto-play is on, continue the loop
      if (get().isAutoPlaying) {
        scheduleAutoPlayNext();
      }
    },

    resetConversation: () => {
      if (abortController) {
        abortController.abort();
      }
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
        autoPlayTimer = null;
      }
      ttsEngine.stop();
      set({
        messages: [],
        isChatStarted: false,
        topic: '',
        isGenerating: false,
        isAutoPlaying: false,
        speakingFigure: null,
      });
    },

    startAutoPlay: () => {
      set({ isAutoPlaying: true });
      if (!get().isGenerating) {
        scheduleAutoPlayNext();
      }
    },

    stopAutoPlay: () => {
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
        autoPlayTimer = null;
      }
      ttsEngine.stop();
      set({ isAutoPlaying: false, speakingFigure: null });
    },

    replayMessage: (message) => {
      if (message.figureId === 'moderator') return;
      speakIfEnabled(message.content, message.figureId);
    },

    // Message mutations
    addReaction: (messageId, emoji) => set(state => ({
      messages: state.messages.map(m => {
        if (m.id === messageId) {
          const reactions = m.reactions || [];
          return { ...m, reactions: [...reactions, emoji] };
        }
        return m;
      })
    })),

    toggleBookmark: (message, soundEnabled) => {
      if (message.bookmarked) {
        set(state => ({
          bookmarks: state.bookmarks.filter(b => b.messageId !== message.id),
          messages: state.messages.map(m => 
            m.id === message.id ? { ...m, bookmarked: false } : m
          )
        }));
      } else {
        const figure = getFigureById(message.figureId);
        const newBookmark: BookmarkItem = {
          id: `bm-${Date.now()}`,
          messageId: message.id,
          figureId: message.figureId,
          content: message.content,
          context: figure?.name || 'Moderator',
          timestamp: new Date(),
        };
        set(state => ({
          bookmarks: [newBookmark, ...state.bookmarks],
          messages: state.messages.map(m => 
            m.id === message.id ? { ...m, bookmarked: true } : m
          )
        }));
        if (soundEnabled) {
          soundEngine.playBookmark();
        }
      }
      // Persist
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(get().bookmarks));
      }, 0);
    },

    deleteBookmark: (id) => {
      const bookmark = get().bookmarks.find(b => b.id === id);
      if (bookmark) {
        set(state => ({
          messages: state.messages.map(m => 
            m.id === bookmark.messageId ? { ...m, bookmarked: false } : m
          )
        }));
      }
      set(state => ({
        bookmarks: state.bookmarks.filter(b => b.id !== id)
      }));
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(get().bookmarks));
      }, 0);
    },

    // Conversation management
    saveConversation: (name) => {
      const { messages, topic, selectedFigures } = get();
      if (!name.trim() || messages.length === 0) return;

      const newConversation: SavedConversation = {
        id: `conv-${Date.now()}`,
        name: name.trim(),
        topic,
        figureIds: selectedFigures.map(f => f.id),
        messages,
        savedAt: new Date(),
        figureCount: selectedFigures.length,
      };

      set(state => ({
        savedConversations: [newConversation, ...state.savedConversations],
      }));
      get().showToast('Conversation saved!');
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(get().savedConversations));
      }, 0);
    },

    loadConversation: (conv) => {
      const figures = conv.figureIds
        .map(id => getFigureById(id))
        .filter((f): f is HistoricalFigure => f !== undefined);
      
      set({
        selectedFigures: figures,
        topic: conv.topic,
        messages: conv.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
        isChatStarted: true,
      });
      get().showToast('Conversation loaded!');
    },

    deleteConversation: (id) => {
      set(state => ({
        savedConversations: state.savedConversations.filter(c => c.id !== id)
      }));
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(get().savedConversations));
      }, 0);
    },

    // Export / Share
    exportConversation: () => {
      const { messages } = get();
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
      get().showToast('Conversation exported!');
    },

    shareConversation: async () => {
      const { topic, selectedFigures } = get();
      const shareData = {
        title: 'Historical Figure Chat',
        text: `Check out this conversation about "${topic}" with ${selectedFigures.map(f => f.name).join(', ')}!`,
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          get().showToast('Shared successfully!');
        } catch {
          // User cancelled
        }
      } else {
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n${window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        get().showToast('Link copied to clipboard!');
      }
    },

    // Storage
    loadFromStorage: () => {
      try {
        const savedConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
        if (savedConvs) {
          set({ savedConversations: JSON.parse(savedConvs) });
        }
      } catch (e) {
        console.error('Failed to parse saved conversations:', e);
      }

      try {
        const savedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
        if (savedBookmarks) {
          set({ bookmarks: JSON.parse(savedBookmarks) });
        }
      } catch (e) {
        console.error('Failed to parse bookmarks:', e);
      }
    },
  };
});
