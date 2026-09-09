import { useCallback, useEffect, useRef, useState } from "react";
import { nextSession } from "../utils/time";
export function useTimer(settings, onComplete) {
  const [timer, setTimer] = useState({
    mode: "focus",
    remaining: settings.focus * 60000,
    duration: settings.focus * 60000,
    running: false,
    completed: 0,
  });
  const state = useRef(timer);
  const config = useRef(settings);
  const callback = useRef(onComplete);
  const deadline = useRef(0);
  config.current = settings;
  callback.current = onComplete;
  const update = useCallback((value) => {
    state.current = value;
    setTimer(value);
  }, []);
  const advance = useCallback(
    (skipped = false) => {
      const current = state.current;
      const completedAt = deadline.current;
      const next = nextSession(
        current.mode,
        current.completed,
        config.current.interval,
        skipped,
      );
      const duration = config.current[next.mode] * 60000;
      const running =
        !skipped &&
        (next.mode === "focus"
          ? config.current.autoFocus
          : config.current.autoBreak);
      deadline.current = running ? Date.now() + duration : 0;
      update({ ...next, duration, remaining: duration, running });
      if (!skipped)
        callback.current(
          current.mode,
          current.duration / 60000,
          new Date(completedAt),
        );
    },
    [update],
  );
  const tick = useCallback(() => {
    if (!state.current.running) return;
    const remaining = Math.max(0, deadline.current - Date.now());
    if (remaining <= 0) advance();
    else update({ ...state.current, remaining });
  }, [advance, update]);
  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(tick, 200);
    const visible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [timer.running, tick]);
  const toggle = useCallback(() => {
    const current = state.current;
    if (current.running) {
      const remaining = Math.max(0, deadline.current - Date.now());
      if (!remaining) {
        advance();
        return;
      }
      update({ ...current, remaining, running: false });
    } else {
      deadline.current = Date.now() + current.remaining;
      update({ ...current, running: true });
    }
  }, [advance, update]);
  const reset = useCallback(() => {
    const current = state.current;
    const duration = config.current[current.mode] * 60000;
    update({ ...current, duration, remaining: duration, running: false });
  }, [update]);
  const switchMode = useCallback(
    (mode) => {
      const duration = config.current[mode] * 60000;
      update({
        ...state.current,
        mode,
        duration,
        remaining: duration,
        running: false,
      });
    },
    [update],
  );
  const reconfigure = useCallback(
    (next) => {
      config.current = next;
      const current = state.current;
      const duration = next[current.mode] * 60000;
      update({
        ...current,
        duration,
        remaining: duration,
        running: false,
        completed: Math.min(current.completed, next.interval - 1),
      });
    },
    [update],
  );
  return {
    ...timer,
    toggle,
    reset,
    skip: () => advance(true),
    switchMode,
    reconfigure,
  };
}
