export interface ChatMessage {
  id: string;
  figureId: string;
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
  bookmarked?: boolean;
  reactions?: string[];
}

export interface ConversationTurn {
  figureId: string;
  content: string;
}

export interface SavedConversation {
  id: string;
  name: string;
  topic: string;
  figureIds: string[];
  messages: ChatMessage[];
  savedAt: Date;
  figureCount: number;
}

export interface BookmarkItem {
  id: string;
  messageId: string;
  figureId: string;
  content: string;
  context: string;
  timestamp: Date;
  conversationId?: string;
}

export type AutoPlaySpeed = 'relaxed' | 'normal' | 'fast';

export interface SettingsType {
  soundEnabled: boolean;
  timestampsEnabled: boolean;
  ttsEnabled: boolean;
  autoPlay: boolean;
  autoPlaySpeed: AutoPlaySpeed;
  theme: 'light' | 'dark' | 'system';
}

export const suggestedTopics = [
  "Should we colonize Mars?",
  "What is the meaning of life?",
  "Is artificial intelligence a threat or opportunity?",
  "What makes a good leader?",
  "Does money equal happiness?",
  "Should there be limits on free speech?",
];

export const STORAGE_KEYS = {
  CONVERSATIONS: 'historical-chat-conversations',
  BOOKMARKS: 'historical-chat-bookmarks',
  SETTINGS: 'historical-chat-settings',
  THEME: 'historical-chat-theme',
} as const;

export const REACTION_EMOJIS = ['❤️', '👍', '😂', '🔥', '🤔'];
