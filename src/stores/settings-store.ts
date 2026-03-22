import { create } from 'zustand';
import { SettingsType, STORAGE_KEYS } from '@/lib/types';
import { soundEngine } from '@/lib/sound-engine';

interface SettingsStore {
  isDark: boolean;
  settings: SettingsType;
  toggleTheme: () => void;
  toggleSound: () => void;
  toggleTimestamps: () => void;
  loadFromStorage: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  isDark: true,
  settings: {
    soundEnabled: true,
    timestampsEnabled: true,
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

  loadFromStorage: () => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        set({ settings: parsed });
        soundEngine.setEnabled(parsed.soundEnabled);
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
