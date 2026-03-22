import { create } from 'zustand';
import { SettingsType, AutoPlaySpeed, STORAGE_KEYS } from '@/lib/types';
import { soundEngine } from '@/lib/sound-engine';
import { ttsEngine } from '@/lib/tts-engine';

interface SettingsStore {
  isDark: boolean;
  settings: SettingsType;
  toggleTheme: () => void;
  toggleSound: () => void;
  toggleTimestamps: () => void;
  toggleTTS: () => void;
  toggleAutoPlay: () => void;
  setAutoPlaySpeed: (speed: AutoPlaySpeed) => void;
  loadFromStorage: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  isDark: true,
  settings: {
    soundEnabled: true,
    timestampsEnabled: true,
    ttsEnabled: true,
    autoPlay: true,
    autoPlaySpeed: 'normal' as AutoPlaySpeed,
    theme: 'dark',
  },

  toggleTheme: () => {
    const newIsDark = !get().isDark;
    set({ isDark: newIsDark });
    localStorage.setItem(STORAGE_KEYS.THEME, newIsDark ? 'dark' : 'light');
  },

  toggleSound: () => {
    const newSettings = { ...get().settings, soundEnabled: !get().settings.soundEnabled };
    set({ settings: newSettings });
    soundEngine.setEnabled(newSettings.soundEnabled);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  },

  toggleTimestamps: () => {
    const newSettings = { ...get().settings, timestampsEnabled: !get().settings.timestampsEnabled };
    set({ settings: newSettings });
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  },

  toggleTTS: () => {
    const newSettings = { ...get().settings, ttsEnabled: !get().settings.ttsEnabled };
    set({ settings: newSettings });
    ttsEngine.setEnabled(newSettings.ttsEnabled);
    if (!newSettings.ttsEnabled) ttsEngine.stop();
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  },

  toggleAutoPlay: () => {
    const newSettings = { ...get().settings, autoPlay: !get().settings.autoPlay };
    set({ settings: newSettings });
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  },

  setAutoPlaySpeed: (speed) => {
    const newSettings = { ...get().settings, autoPlaySpeed: speed };
    set({ settings: newSettings });
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  },

  loadFromStorage: () => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults so new fields are present for older stored settings
        set({ settings: { ...get().settings, ...parsed } });
        soundEngine.setEnabled(parsed.soundEnabled);
        if (parsed.ttsEnabled !== undefined) ttsEngine.setEnabled(parsed.ttsEnabled);
      }
    } catch (e) {
      console.error('Failed to parse settings:', e);
    }

    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) {
        set({ isDark: savedTheme === 'dark' });
      }
    } catch (e) {
      console.error('Failed to parse theme:', e);
    }
  },
}));
