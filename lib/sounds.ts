export type SoundEffectType =
  | 'deal'
  | 'chip'
  | 'win'
  | 'snipe'
  | 'fold'
  | 'reaction'
  | 'card_pick'
  | 'card_remove'
  | 'cross_out'
  | 'rule_check'
  | 'tick'
  | 'flip'
  | 'hint'
  | 'error'
  | 'laser'
  | 'shield'
  | 'paradox'
  | 'hit'
  | 'move'
  | 'gunshot'
  | 'blank_click'
  | 'chamber_spin';

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export const playSound = (type: SoundEffectType) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'deal': {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.015);
        gain.gain.linearRampToValueAtTime(0, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case 'chip':
      case 'card_pick': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(1180, now + 0.055);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
        osc.start(now);
        osc.stop(now + 0.055);
        break;
      }
      case 'card_remove': {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }
      case 'cross_out': {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.045);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.start(now);
        osc.stop(now + 0.045);
        break;
      }
      case 'rule_check': {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174, now + 0.03);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }
      case 'tick': {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(980, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.035);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.16, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.start(now);
        osc.stop(now + 0.035);
        break;
      }
      case 'flip': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.075);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
        osc.start(now);
        osc.stop(now + 0.075);
        break;
      }
      case 'hint': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        osc.frequency.setValueAtTime(1046.5, now + 0.12);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'win': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        osc.frequency.setValueAtTime(1046.5, now + 0.24);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
      }
      case 'snipe': {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(780, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.26);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.45, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.start(now);
        osc.stop(now + 0.26);
        break;
      }
      case 'fold':
      case 'error': {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(85, now + 0.2);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'reaction': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.09);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case 'move': {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.06);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }
      case 'laser': {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }
      case 'shield': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.linearRampToValueAtTime(680, now + 0.12);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'paradox': {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.24);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.24);
        break;
      }
      case 'hit': {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.32);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.42, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
        break;
      }
      case 'gunshot': {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.55, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }
      case 'blank_click': {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.04);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }
      case 'chamber_spin': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.linearRampToValueAtTime(920, now + 0.14);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }
    }
  } catch {
    // Ignore audio context restrictions
  }
};
