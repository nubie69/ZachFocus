import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaults,
  readStorage,
  validHistory,
  validSettings,
  writeStorage,
} from "./storage";
import {
  localDate,
  recentHistory,
  streakFromHistory,
  formatTime,
  currentStreak,
  completeStreak,
} from "./time";
import {
  notify,
  requestNotifications,
  unlockAudio,
  playSound,
} from "./notifications";
describe("safe local storage", () => {
  beforeEach(() => localStorage.clear());
  it("round trips preferences and falls back for corrupt JSON or invalid shapes", () => {
    writeStorage("settings", defaults);
    expect(readStorage("settings", {}, validSettings)).toEqual(defaults);
    localStorage.setItem("zachfocus:settings", "{broken");
    expect(readStorage("settings", defaults, validSettings)).toEqual(defaults);
    writeStorage("settings", { ...defaults, focus: -1 });
    expect(readStorage("settings", defaults, validSettings)).toEqual(defaults);
    expect(validHistory([null])).toBe(false);
    expect(validHistory([{ id: "1", endedAt: "invalid", minutes: 25 }])).toBe(
      false,
    );
  });
  it("handles unavailable storage", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Quota");
      });
    expect(writeStorage("task", "hello")).toBe(false);
    spy.mockRestore();
  });
});
describe("local calendar statistics", () => {
  const session = (day) => ({
    id: String(day),
    endedAt: new Date(2026, 8, day, 12).toISOString(),
    minutes: 25,
  });
  it("counts consecutive days once and carries yesterday’s streak until today is complete", () => {
    const history = [session(7), session(7), session(8)];
    expect(streakFromHistory(history, new Date(2026, 8, 9))).toBe(2);
    expect(
      streakFromHistory([...history, session(9)], new Date(2026, 8, 9, 13)),
    ).toBe(3);
    expect(streakFromHistory(history, new Date(2026, 8, 10))).toBe(0);
  });
  it("uses local dates and retains only the last 30 calendar days", () => {
    expect(localDate(new Date(2026, 8, 9, 23, 59))).toBe("2026-09-09");
    const now = new Date(2026, 8, 9, 13);
    const old = { ...session(1), endedAt: new Date(2026, 7, 10).toISOString() };
    expect(recentHistory([old, session(8), session(9)], now)).toHaveLength(2);
  });
  it("formats minutes without premature zero or negative time", () => {
    expect(formatTime(1)).toBe("00:01");
    expect(formatTime(-10)).toBe("00:00");
    expect(formatTime(7200000)).toBe("120:00");
  });
  it("preserves long streaks after old history is pruned and avoids counting a day twice", () => {
    const now = new Date(2026, 8, 9, 13);
    const record = { count: 65, lastDate: "2026-09-08" };
    const next = completeStreak(record, now);
    expect(next).toEqual({ count: 66, lastDate: "2026-09-09" });
    expect(completeStreak(next, now)).toEqual(next);
    expect(currentStreak(next, new Date(2026, 8, 11))).toBe(0);
  });
});
describe("optional notifications", () => {
  it("does not request permission when sending a completion notification", () => {
    const permission = vi.fn();
    const NotificationMock = vi.fn();
    NotificationMock.permission = "granted";
    NotificationMock.requestPermission = permission;
    vi.stubGlobal("Notification", NotificationMock);
    notify("Done");
    expect(NotificationMock).toHaveBeenCalledWith(
      "ZachFocus",
      expect.objectContaining({ body: "Done" }),
    );
    expect(permission).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it("handles denied permission and unsupported APIs gracefully", async () => {
    vi.stubGlobal("Notification", {
      requestPermission: vi.fn().mockResolvedValue("denied"),
    });
    expect(await requestNotifications()).toBe(false);
    vi.unstubAllGlobals();
    expect(() => notify("Done")).not.toThrow();
    expect(() => unlockAudio()).not.toThrow();
    expect(playSound()).toBe(false);
  });
  it("schedules a gentle three-note sound after audio is unlocked", () => {
    const oscillators = [];
    const gains = [];
    class AudioMock {
      state = "running";
      currentTime = 1;
      destination = {};
      resume = vi.fn().mockResolvedValue(undefined);
      createOscillator() {
        const osc = {
          frequency: { value: 0 },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
        oscillators.push(osc);
        return osc;
      }
      createGain() {
        const gain = {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
        gains.push(gain);
        return gain;
      }
    }
    vi.stubGlobal("AudioContext", AudioMock);
    unlockAudio();
    expect(playSound()).toBe(true);
    expect(oscillators).toHaveLength(3);
    expect(gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      0.1,
      1.02,
    );
    expect(oscillators[2].stop).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
