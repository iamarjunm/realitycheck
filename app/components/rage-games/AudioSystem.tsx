export const playSound = (type: string, muted: boolean) => {
  if (muted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'jump') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'die' || type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'score' || type === 'graze') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'laserWarn') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'laserFire') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    console.warn("AudioContext issue", e);
  }
};

let bgmOscillators: OscillatorNode[] = [];
let bgmGain: GainNode | null = null;
let bgmCtx: AudioContext | null = null;

export const playBGM = (muted: boolean) => {
  if (muted) {
    stopBGM();
    return;
  }
  if (bgmCtx) return; // already playing
  try {
    bgmCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    bgmGain = bgmCtx.createGain();
    bgmGain.gain.value = 0.04; // Gentle volume
    
    // Add a lowpass filter to make it even softer and warmer
    const filter = bgmCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    
    bgmGain.connect(filter);
    filter.connect(bgmCtx.destination);

    // Create a soothing minor chord (sine waves)
    const frequencies = [146.83, 174.61, 220.00]; // D3, F3, A3
    
    frequencies.forEach(freq => {
      const osc = bgmCtx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Slight slow LFO on detune for a lush, chorusing effect
      const lfo = bgmCtx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.2 + Math.random() * 0.1; // slow oscillation
      const lfoGain = bgmCtx!.createGain();
      lfoGain.gain.value = 2; // slight pitch modulation
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);
      
      osc.connect(bgmGain!);
      osc.start();
      lfo.start();
      
      bgmOscillators.push(osc);
      bgmOscillators.push(lfo); // keep track to stop
    });

  } catch (e) {
    console.warn("BGM issue", e);
  }
};

export const stopBGM = () => {
  if (bgmOscillators.length > 0) {
    bgmOscillators.forEach(osc => {
      try { osc.stop(); } catch(e){}
    });
    bgmOscillators = [];
  }
  if (bgmCtx) {
    try { bgmCtx.close(); } catch(e){}
    bgmCtx = null;
  }
};
