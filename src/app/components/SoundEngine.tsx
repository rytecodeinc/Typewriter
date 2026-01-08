// Simple sound engine using Web Audio API
export class SoundEngine {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new AudioContext();
  }

  // Play typewriter key sound
  playKeyPress() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 800 + Math.random() * 200;
    oscillator.type = "square";

    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.05
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // Play carriage return sound
  playCarriageReturn() {
    // First part: mechanical slide
    const oscillator1 = this.audioContext.createOscillator();
    const gainNode1 = this.audioContext.createGain();

    oscillator1.connect(gainNode1);
    gainNode1.connect(this.audioContext.destination);

    oscillator1.frequency.setValueAtTime(
      600,
      this.audioContext.currentTime
    );
    oscillator1.frequency.linearRampToValueAtTime(
      300,
      this.audioContext.currentTime + 0.2
    );
    oscillator1.type = "sawtooth";

    gainNode1.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.2
    );

    oscillator1.start(this.audioContext.currentTime);
    oscillator1.stop(this.audioContext.currentTime + 0.2);

    // Second part: bell ding
    setTimeout(() => {
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode2 = this.audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(this.audioContext.destination);

      oscillator2.frequency.value = 1200;
      oscillator2.type = "sine";

      gainNode2.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3
      );

      oscillator2.start(this.audioContext.currentTime);
      oscillator2.stop(this.audioContext.currentTime + 0.3);
    }, 150);
  }
}
