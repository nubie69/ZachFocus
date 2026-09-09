export const ambientModes = ["silence", "rain", "cafe", "white", "keyboard"];
export const ambientDefaults = { mode: "silence", volume: 25 };
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
  const fade = Math.min(Math.floor(sampleRate * 1.2), Math.floor(length / 4));
  const samples = new Float32Array(length + fade);
  let low = 0,
    medium = 0,
    keyEnvelope = 0,
    keyTone = 0,
    keyAge = 0,
    nextKey = 0;
  let clink = 0,
    clinkTone = 850,
    clinkAge = 0,
    nextClink = sampleRate * 5;
  // Two gentle low-pass stages remove sharp hiss and percussive edges.
  const cutoff = { rain: 950, white: 700, cafe: 650, keyboard: 800 }[mode];
  const warmth = 1 - Math.exp((-2 * Math.PI * cutoff) / sampleRate);
  let softened = 0,
    rounded = 0,
    dc = 0;
  const keyDecay = Math.exp(-1 / (sampleRate * 0.032));
  const clinkDecay = Math.exp(-1 / (sampleRate * 0.18));
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
    if (mode === "white") value = medium * 0.12 + low * 1.25;
    if (mode === "rain")
      value =
        (medium * 0.18 + low * 1.6) *
        (0.9 + 0.06 * Math.sin(time * 0.13) + 0.04 * Math.sin(time * 0.23));
    if (mode === "cafe") {
      // A soft crowd-like murmur and occasional ceramic clinks, without speech.
      for (const voice of voices) {
        voice.low += 0.035 * (Math.random() * 2 - 1 - voice.low);
        const syllable = Math.max(
          0,
          Math.sin(time * Math.PI * 2 * voice.rate + voice.phase),
        );
        value +=
          voice.low *
          syllable *
          (0.065 + 0.015 * Math.sin(time * 5 + voice.phase));
      }
      value += low * 0.8;
      if (i >= nextClink) {
        clink = 0.006;
        clinkAge = 0;
        clinkTone = 420 + Math.random() * 240;
        nextClink = i + sampleRate * (10 + Math.random() * 10);
      }
      value +=
        clink *
        (1 - Math.exp(-clinkAge / (sampleRate * 0.012))) *
        (Math.sin((clinkAge / sampleRate) * clinkTone * Math.PI * 2) +
          0.15 *
            Math.sin((clinkAge / sampleRate) * clinkTone * 1.6 * Math.PI * 2));
      clinkAge++;
      clink *= clinkDecay;
    }
    if (mode === "keyboard") {
      if (i >= nextKey) {
        keyEnvelope = 0.1 + Math.random() * 0.035;
        keyAge = 0;
        keyTone = 85 + Math.random() * 60;
        nextKey =
          i +
          sampleRate *
            (Math.random() < 0.22
              ? 1.5 + Math.random() * 2
              : 0.18 + Math.random() * 0.22);
      }
      value =
        keyEnvelope *
        (1 - Math.exp(-keyAge / (sampleRate * 0.009))) *
        (medium * 0.7 +
          Math.sin((keyAge / sampleRate) * keyTone * Math.PI * 2) * 0.3);
      keyAge++;
      keyEnvelope *= keyDecay;
    }
    softened += warmth * (value - softened);
    rounded += warmth * (softened - rounded);
    dc += 0.001 * (rounded - dc);
    samples[i] = Math.max(-0.8, Math.min(0.8, rounded - dc));
  }
  // Blend the loop boundary so switching from its end to its start is smooth.
  for (let i = 0; i < fade; i++) {
    const mix = i / fade;
    samples[i] = samples[length + i] * (1 - mix) + samples[i] * mix;
  }
  return samples.slice(0, length);
}

export function createAmbientPlayer(onStateChange = () => {}) {
  let context, gain, source, envelope;
  let revision = 0;
  const buffers = new Map();
  const retiring = new Set();
  const stopSource = (suspendAfter = false) => {
    if (source) {
      const oldSource = source,
        oldEnvelope = envelope,
        stoppedRevision = revision;
      retiring.add(oldSource);
      if (oldEnvelope.gain.cancelAndHoldAtTime)
        oldEnvelope.gain.cancelAndHoldAtTime(context.currentTime);
      else {
        const level = oldEnvelope.gain.value;
        oldEnvelope.gain.cancelScheduledValues(context.currentTime);
        oldEnvelope.gain.setValueAtTime(level, context.currentTime);
      }
      oldEnvelope.gain.linearRampToValueAtTime(0, context.currentTime + 0.3);
      oldSource.onended = () => {
        oldSource.disconnect();
        oldEnvelope.disconnect();
        retiring.delete(oldSource);
        if (suspendAfter && stoppedRevision === revision)
          void context.suspend().catch(() => {});
      };
      oldSource.stop(context.currentTime + 0.32);
      source = null;
      envelope = null;
    } else if (suspendAfter && context) {
      void context.suspend().catch(() => {});
    }
  };
  return {
    async play(mode, volume) {
      const request = ++revision;
      stopSource(mode === "silence");
      if (mode === "silence") {
        onStateChange(false);
        return false;
      }
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
      envelope = context.createGain();
      source.connect(envelope);
      envelope.connect(gain);
      envelope.gain.setValueAtTime(0, context.currentTime);
      envelope.gain.linearRampToValueAtTime(1, context.currentTime + 1.6);
      gain.gain.setTargetAtTime(
        Math.max(0, Math.min(volume, 100)) / 100,
        context.currentTime,
        0.2,
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
          0.2,
        );
    },
    pause() {
      revision++;
      stopSource(true);
      onStateChange(false);
    },
    dispose() {
      revision++;
      if (source) {
        source.stop();
        source.disconnect();
        envelope.disconnect();
        source = null;
      }
      for (const old of retiring) {
        old.onended = null;
        old.disconnect();
      }
      retiring.clear();
      if (context) {
        context.onstatechange = null;
        void context.close().catch(() => {});
      }
      buffers.clear();
    },
  };
}
