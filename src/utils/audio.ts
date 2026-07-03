// --- Sound Manager with Web Audio API Procedural Synthesizer & MP3 Fallbacks ---

// Define the custom sound configuration.
// User can place their own MP3/WAV files in the /public/sounds/ directory
// and these files will be automatically loaded and played.
// If the file is missing or fails to load, it will instantly fallback to the procedural synth!
export const CUSTOM_SOUNDS = {
  // Array of funny stock pain sounds for pawns dying
  painScreams: [
    "/sounds/pain_scream_1.mp3",
    "/sounds/pain_scream_2.mp3",
    "/sounds/pain_scream_3.mp3",
    "/sounds/pain_scream_4.mp3"
  ],
  // Explosion sound
  explosion: "/sounds/explosion.mp3",
  // Electrocution/Shock sound
  electricShock: "/sounds/shock.mp3"
};

// Play sound helper
export function playCaptureSound(type: "blood" | "scorch" | "electric") {
  // Attempt to play custom MP3 files first, with fallback to procedural synth
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  // Try playing custom files
  let soundPath = "";
  if (type === "blood") {
    // Pick random scream
    const idx = Math.floor(Math.random() * CUSTOM_SOUNDS.painScreams.length);
    soundPath = CUSTOM_SOUNDS.painScreams[idx];
  } else if (type === "scorch") {
    soundPath = CUSTOM_SOUNDS.explosion;
  } else {
    soundPath = CUSTOM_SOUNDS.electricShock;
  }

  const audio = new Audio(soundPath);
  audio.volume = 0.5;

  audio.play().catch(() => {
    // If the file is not found (404) or blocked, play procedural synth!
    playProceduralSound(type, audioCtx);
  });
}

// Procedural synthesizer for hilarious arcade-style death effects!
function playProceduralSound(type: "blood" | "scorch" | "electric", ctx: AudioContext) {
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  if (type === "blood") {
    // FUNNY ORGANIC SCREAM + SPLAT
    // 1. Funny Screaming synth voice
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Funny pitch sweep representing a falling/screaming cartoon pawn
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);

    // Human-like vibrato for the scream
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 18; // fast tremble
    lfoGain.gain.value = 30; // pitch shift depth
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(now);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.6);
    lfo.stop(now + 0.6);

    // 2. Liquid squishy splat noise
    const bufferSize = ctx.sampleRate * 0.3; // 0.3s splat
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Noise with a wet squishy modulation
      const mod = Math.sin(i * 0.05) * 0.4 + 0.6;
      data[i] = (Math.random() * 2 - 1) * mod * Math.exp(-i / (ctx.sampleRate * 0.08));
    }
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.3);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noiseNode.start(now);
    noiseNode.stop(now + 0.3);

  } else if (type === "scorch") {
    // EXPLOSION BLAST
    // White noise explosion with deep sub bass rumble
    const bufferSize = ctx.sampleRate * 1.0; // 1s explosion
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to make it muddy and booming
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.6);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Sub rumble oscillator
    const subOsc = ctx.createOscillator();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(100, now);
    subOsc.frequency.linearRampToValueAtTime(20, now + 0.4);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 1.0);
    subOsc.start(now);
    subOsc.stop(now + 0.5);

  } else if (type === "electric") {
    // ELECTROCUTION ZAP & BUZZ
    // Harsh modulating triangle/saw wave + high frequency crackle
    const duration = 0.7;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(60, now); // Line frequency buzz (60Hz)
    
    // Extreme frequency modulation to simulate sparks
    const fm = ctx.createOscillator();
    fm.type = "square";
    fm.frequency.value = 120; // fast hum
    const fmGain = ctx.createGain();
    fmGain.gain.value = 400; // wide pitch swings
    
    fm.connect(fmGain);
    fmGain.connect(osc.frequency);
    
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1500;
    filter.Q.value = 5;

    const gain = ctx.createGain();
    // Buzz rhythmically
    gain.gain.setValueAtTime(0.3, now);
    for (let t = 0.1; t < duration; t += 0.1) {
      gain.gain.setValueAtTime(Math.random() * 0.3 + 0.1, now + t);
    }
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    fm.start(now);
    osc.start(now);
    fm.stop(now + duration);
    osc.stop(now + duration);

    // High frequency crackles
    const crackleCount = 15;
    for (let i = 0; i < crackleCount; i++) {
      const clickTime = now + Math.random() * duration;
      const clickOsc = ctx.createOscillator();
      clickOsc.type = "sine";
      clickOsc.frequency.setValueAtTime(8000 + Math.random() * 4000, clickTime);
      
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.08, clickTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.02);
      
      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(clickTime);
      clickOsc.stop(clickTime + 0.03);
    }
  }
}
