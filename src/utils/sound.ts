let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playFeedbackTone(type: 'guess' | 'partial' | 'win' | 'lose', muted: boolean): void {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  const playNote = (freq: number, start: number, duration: number, gainPeak = 0.06) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  };

  if (type === 'win') {
    playNote(523.25, now, 0.14, 0.07);
    playNote(659.25, now + 0.09, 0.14, 0.07);
    playNote(783.99, now + 0.18, 0.28, 0.08);
  } else if (type === 'partial') {
    playNote(440, now, 0.11, 0.05);
    playNote(554.37, now + 0.08, 0.12, 0.04);
  } else if (type === 'lose') {
    playNote(280, now, 0.15, 0.05);
    playNote(210, now + 0.12, 0.22, 0.05);
  } else {
    playNote(300, now, 0.1, 0.04);
  }
}
