// Client-side TTS engine that calls our OpenAI TTS API endpoint
// Manages audio playback queue, caching, and speaking state

type SpeakingCallback = (figureId: string | null) => void;

class TTSEngine {
  private audioCache = new Map<string, ArrayBuffer>();
  private currentAudio: HTMLAudioElement | null = null;
  private enabled = true;
  private onSpeakingChange: SpeakingCallback | null = null;
  private currentFigureId: string | null = null;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  onSpeaking(callback: SpeakingCallback) {
    this.onSpeakingChange = callback;
  }

  private setSpeaking(figureId: string | null) {
    this.currentFigureId = figureId;
    this.onSpeakingChange?.(figureId);
  }

  getSpeakingFigureId() {
    return this.currentFigureId;
  }

  // Speak text as a figure — returns a promise that resolves when playback finishes
  async speak(text: string, figureId: string): Promise<void> {
    if (!this.enabled || !text.trim()) return;

    // Stop any current playback
    this.stop();

    const cacheKey = `${figureId}:${text.slice(0, 100)}`;

    try {
      let audioBuffer: ArrayBuffer;

      if (this.audioCache.has(cacheKey)) {
        audioBuffer = this.audioCache.get(cacheKey)!;
      } else {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, figureId }),
        });

        if (!response.ok) {
          console.error('TTS API returned', response.status);
          return;
        }

        audioBuffer = await response.arrayBuffer();

        // Cache (keep max 50 entries to limit memory)
        if (this.audioCache.size >= 50) {
          const firstKey = this.audioCache.keys().next().value;
          if (firstKey !== undefined) this.audioCache.delete(firstKey);
        }
        this.audioCache.set(cacheKey, audioBuffer);
      }

      return new Promise<void>((resolve) => {
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        this.currentAudio = audio;

        this.setSpeaking(figureId);

        audio.onended = () => {
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          this.setSpeaking(null);
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          this.setSpeaking(null);
          resolve();
        };

        audio.play().catch(() => {
          // Autoplay blocked — resolve silently
          this.currentAudio = null;
          this.setSpeaking(null);
          resolve();
        });
      });
    } catch (error) {
      console.error('TTS playback error:', error);
      this.setSpeaking(null);
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    this.setSpeaking(null);
  }

  // Replay a specific message
  replay(text: string, figureId: string) {
    return this.speak(text, figureId);
  }
}

export const ttsEngine = new TTSEngine();
