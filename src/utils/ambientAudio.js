export const ambientModes = ["silence", "rain", "cafe", "white", "keyboard"];
export const ambientDefaults = { mode: "silence", volume: 35 };
export function validAmbient(value) {
  return (
    value &&
    ambientModes.includes(value.mode) &&
    Number.isInteger(value.volume) &&
    value.volume >= 0 &&
    value.volume <= 100
  );
}

// Original, locally synthesized soundscapes. No downloads or audio tracking.
export function createSoundscape(mode, sampleRate = 22050, seconds = 30) {
  if (!ambientModes.includes(mode) || mode === "silence")
    throw new Error("Choose an audible soundscape.");
  const length = Math.floor(sampleRate * seconds);
  const fade = Math.min(Math.floor(sampleRate * 0.2), Math.floor(length / 4));
  const samples = new Float32Array(length + fade);
  let low = 0,
    medium = 0,
    keyEnvelope = 0,
    keyTone = 0,
    nextKey = 0;
  let clink = 0,
    clinkTone = 1700,
    nextClink = sampleRate * 2;
  const voices = Array.from({ length: 6 }, (_, i) => ({
    low: 0,
    phase: Math.random() * Math.PI * 2,
    rate: 0.23 + i * 0.13,
  }));
  for (let i = 0; i < samples.length; i++) {
    const noise = Math.random() * 2 - 1;
    const time = i / sampleRate;
    low += 0.025 * (noise - low);
    medium += 0.24 * (noise - medium);
    let value = 0;
    if (mode === "white") value = noise * 0.32;
    if (mode === "rain")
      value =
        (noise * 0.18 + medium * 0.5 + low * 1.4) *
        (0.8 + 0.12 * Math.sin(time * 0.47) + 0.08 * Math.sin(time * 1.13));
    if (mode === "cafe") {
      // A soft crowd-like murmur and occasional ceramic clinks, without speech.
      for (const voice of voices) {
        voice.low += 0.07 * (Math.random() * 2 - 1 - voice.low);
        const syllable = Math.max(
          0,
          Math.sin(time * Math.PI * 2 * voice.rate + voice.phase),
        );
        value +=
          voice.low *
          syllable *
          (0.09 + 0.06 * Math.sin(time * 19 + voice.phase));
      }
      value += low * 0.5;
      if (i >= nextClink) {
        clink = 0.055;
        clinkTone = 1500 + Math.random() * 1400;
        nextClink = i + sampleRate * (2 + Math.random() * 5);
      }
      value +=
        clink *
        (Math.sin(time * clinkTone * Math.PI * 2) +
          0.4 * Math.sin(time * clinkTone * 2.73 * Math.PI * 2));
      clink *= Math.exp(-1 / (sampleRate * 0.1));
    }
    if (mode === "keyboard") {
      if (i >= nextKey) {
        keyEnvelope = 0.2 + Math.random() * 0.12;
        keyTone = 160 + Math.random() * 340;
        nextKey =
          i +
          sampleRate *
            (Math.random() < 0.1
              ? 0.6 + Math.random()
              : 0.075 + Math.random() * 0.14);
      }
      value =
        keyEnvelope *
        (noise * 0.6 + Math.sin(time * keyTone * Math.PI * 2) * 0.4);
      keyEnvelope *= Math.exp(-1 / (sampleRate * 0.009));
    }
    samples[i] = Math.max(-0.8, Math.min(0.8, value));
  }
  // Blend the loop boundary so switching from its end to its start is smooth.
  for (let i = 0; i < fade; i++) {
    const mix = i / fade;
    samples[i] = samples[length + i] * (1 - mix) + samples[i] * mix;
  }
  return samples.slice(0, length);
}

export function createAmbientPlayer(onStateChange = () => {}) {
  let context, gain, source;
  let revision = 0;
  const buffers = new Map();
  const stopSource = () => {
    if (source) {
      source.stop();
      source.disconnect();
      source = null;
    }
  };
  return {
    async play(mode, volume) {
      const request = ++revision;
      stopSource();
      if (mode === "silence") return false;
      if (!ambientModes.includes(mode)) throw new Error("Unknown soundscape.");
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio)
        throw new Error("Ambient sounds are not supported by this browser.");
      if (!context) {
        context = new Audio();
        gain = context.createGain();
        gain.connect(context.destination);
        context.onstatechange = () =>
          onStateChange(context.state === "running" && !!source);
      }
      await context.resume();
      if (request !== revision) return false;
      if (context.state !== "running")
        throw new Error("Audio is paused by your browser. Try playing again.");
      if (!buffers.has(mode)) {
        const data = createSoundscape(mode);
        const buffer = context.createBuffer(1, data.length, 22050);
        buffer.copyToChannel(data, 0);
        buffers.set(mode, buffer);
      }
      source = context.createBufferSource();
      source.buffer = buffers.get(mode);
      source.loop = true;
      source.connect(gain);
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(volume, 100)) / 100,
        context.currentTime + 0.15,
      );
      source.start();
      onStateChange(true);
      return true;
    },
    setVolume(volume) {
      if (gain)
        gain.gain.setTargetAtTime(
          Math.max(0, Math.min(volume, 100)) / 100,
          context.currentTime,
          0.04,
        );
    },
    pause() {
      revision++;
      stopSource();
      onStateChange(false);
      if (context) void context.suspend().catch(() => {});
    },
    dispose() {
      revision++;
      stopSource();
      if (context) {
        context.onstatechange = null;
        void context.close().catch(() => {});
      }
      buffers.clear();
    },
  };
}
