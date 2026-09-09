import { afterEach, expect, it, vi } from "vitest";
import {
  createAmbientPlayer,
  createSoundscape,
  validAmbient,
} from "./ambientAudio";
afterEach(() => vi.unstubAllGlobals());
it("generates bounded, non-silent audio for all four soundscapes", () => {
  for (const mode of ["rain", "cafe", "white", "keyboard"]) {
    const samples = createSoundscape(mode, 22050, 0.25);
    expect(samples.length).toBe(5512);
    expect(
      samples.every(
        (value) => Number.isFinite(value) && Math.abs(value) <= 0.8,
      ),
    ).toBe(true);
    expect(samples.some((value) => Math.abs(value) > 0.001)).toBe(true);
  }
  expect(() => createSoundscape("unknown")).toThrow();
});
it("validates saved sound preferences", () => {
  expect(validAmbient({ mode: "rain", volume: 35 })).toBe(true);
  for (const value of [
    null,
    {},
    { mode: "invalid", volume: 50 },
    { mode: "rain", volume: 101 },
    { mode: "rain", volume: "35" },
  ])
    expect(Boolean(validAmbient(value))).toBe(false);
});
function mockAudio(resume) {
  const sources = [];
  const gain = {
    connect: vi.fn(),
    gain: {
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
    },
  };
  const context = {
    state: "running",
    currentTime: 0,
    destination: {},
    resume: resume || vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createGain: () => gain,
    createBuffer: () => ({ copyToChannel: vi.fn() }),
    createBufferSource: () => {
      const source = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
      };
      sources.push(source);
      return source;
    },
  };
  vi.stubGlobal(
    "AudioContext",
    class {
      constructor() {
        return context;
      }
    },
  );
  return { sources, gain, context };
}
it("switches a single looping source, controls volume, pauses, and releases audio", async () => {
  const { sources, gain, context } = mockAudio();
  const player = createAmbientPlayer();
  expect(await player.play("rain", 35)).toBe(true);
  expect(sources[0].loop).toBe(true);
  expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.35, 0.15);
  await player.play("keyboard", 50);
  expect(sources[0].stop).toHaveBeenCalledTimes(1);
  player.setVolume(20);
  expect(gain.gain.setTargetAtTime).toHaveBeenCalledWith(0.2, 0, 0.04);
  player.pause();
  expect(sources[1].stop).toHaveBeenCalledTimes(1);
  expect(context.suspend).toHaveBeenCalled();
  player.dispose();
  expect(context.close).toHaveBeenCalled();
});
it("cancels a pending start when silence or pause is selected", async () => {
  let resume;
  const { sources } = mockAudio(
    () =>
      new Promise((resolve) => {
        resume = resolve;
      }),
  );
  const player = createAmbientPlayer();
  const pending = player.play("rain", 30);
  player.pause();
  resume();
  expect(await pending).toBe(false);
  expect(sources).toHaveLength(0);
  player.dispose();
});
