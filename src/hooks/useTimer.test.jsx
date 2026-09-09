import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimer } from "./useTimer";
import { defaults } from "../utils/storage";
describe("timestamp based Pomodoro timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T10:00:00"));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });
  it("starts, pauses at the exact millisecond, resumes, and resets", () => {
    const { result } = renderHook(() => useTimer(defaults, vi.fn()));
    act(() => result.current.toggle());
    act(() => vi.advanceTimersByTime(1250));
    act(() => result.current.toggle());
    expect(result.current.remaining).toBe(1500000 - 1250);
    act(() => vi.advanceTimersByTime(20000));
    expect(result.current.remaining).toBe(1498750);
    act(() => result.current.toggle());
    act(() => vi.advanceTimersByTime(750));
    act(() => result.current.toggle());
    expect(result.current.remaining).toBe(1498000);
    act(() => result.current.reset());
    expect(result.current.remaining).toBe(1500000);
    expect(result.current.running).toBe(false);
  });
  it("completes four focus sessions before a long break, then resets cycle", () => {
    const callback = vi.fn();
    const settings = { ...defaults, focus: 1, short: 1, long: 1 };
    const { result } = renderHook(() => useTimer(settings, callback));
    for (let i = 0; i < 4; i++) {
      act(() => result.current.toggle());
      act(() => vi.advanceTimersByTime(60000));
      expect(result.current.mode).toBe(i === 3 ? "long" : "short");
      expect(result.current.completed).toBe(i + 1);
      act(() => result.current.toggle());
      act(() => vi.advanceTimersByTime(60000));
      expect(result.current.mode).toBe("focus");
    }
    expect(result.current.completed).toBe(0);
    expect(
      callback.mock.calls.filter(([mode]) => mode === "focus"),
    ).toHaveLength(4);
  });
  it("skips without awarding completion or starting automatically", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useTimer({ ...defaults, autoBreak: true }, callback),
    );
    act(() => result.current.skip());
    expect(result.current.mode).toBe("short");
    expect(result.current.completed).toBe(0);
    expect(result.current.running).toBe(false);
    expect(callback).not.toHaveBeenCalled();
    act(() => result.current.skip());
    expect(result.current.mode).toBe("focus");
  });
  it("catches up after throttling without inventing unattended sessions", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useTimer({ ...defaults, autoBreak: true }, callback),
    );
    act(() => result.current.toggle());
    act(() => {
      vi.setSystemTime(new Date("2026-09-09T12:00:00"));
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(200);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][2]).toEqual(new Date("2026-09-09T10:25:00"));
    expect(result.current.mode).toBe("short");
    expect(result.current.running).toBe(true);
    expect(result.current.remaining).toBeGreaterThan(299000);
  });
  it("switches modes and applies custom durations", () => {
    const { result } = renderHook(() => useTimer(defaults, vi.fn()));
    act(() => result.current.toggle());
    act(() => result.current.switchMode("long"));
    expect(result.current.remaining).toBe(900000);
    expect(result.current.running).toBe(false);
    act(() => result.current.reconfigure({ ...defaults, long: 7 }));
    expect(result.current.remaining).toBe(420000);
  });
  it("auto-starts focus and cleans up its single countdown interval", () => {
    const { result, unmount } = renderHook(() =>
      useTimer({ ...defaults, short: 1, autoFocus: true }, vi.fn()),
    );
    act(() => result.current.switchMode("short"));
    act(() => result.current.toggle());
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.mode).toBe("focus");
    expect(result.current.running).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
