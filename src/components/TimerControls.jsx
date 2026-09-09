import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
export default function TimerControls({ timer, onToggle }) {
  return (
    <div className="timer-controls">
      <button
        className="icon-button secondary-control"
        onClick={timer.reset}
        aria-label="Reset timer"
        title="Reset (R)"
      >
        <RotateCcw size={21} />
      </button>
      <button className="start-button" onClick={onToggle}>
        {timer.running ? (
          <Pause size={20} fill="currentColor" />
        ) : (
          <Play size={20} fill="currentColor" />
        )}
        {timer.running
          ? "Pause"
          : timer.remaining < timer.duration
            ? "Resume"
            : timer.mode === "focus"
              ? "Start focus"
              : "Start break"}
      </button>
      <button
        className="icon-button secondary-control"
        onClick={timer.skip}
        aria-label="Skip session"
        title="Skip (S)"
      >
        <SkipForward size={21} />
      </button>
    </div>
  );
}
