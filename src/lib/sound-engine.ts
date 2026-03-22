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
    this.playTone(880, 0.1, 'sine', 0.06);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.04), 50);
  }

  playConversationStart() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.3, 'sine', 0.08), i * 100);
    });
  }

  playBookmark() {
    this.playTone(1200, 0.05, 'square', 0.03);
  }

  playConfetti() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(1500 + Math.random() * 1000, 0.1, 'sine', 0.03);
      }, i * 50);
    }
  }

  playCharacterEntrance() {
    this.playTone(200, 0.3, 'sawtooth', 0.05);
    setTimeout(() => this.playTone(300, 0.2, 'sine', 0.08), 100);
    setTimeout(() => this.playTone(400, 0.3, 'sine', 0.1), 200);
  }
}

export const soundEngine = new SoundEngine();
