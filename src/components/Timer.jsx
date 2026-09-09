import { Leaf } from "lucide-react";
import ModeSelector from "./ModeSelector";
import ProgressRing from "./ProgressRing";
import TimerControls from "./TimerControls";
import { formatTime } from "../utils/time";
export default function Timer({ timer, settings, onToggle }) {
  return (
    <section
      className={`timer-card panel ${timer.running ? "is-running" : ""}`}
      aria-label="Pomodoro timer"
    >
      <ModeSelector mode={timer.mode} onChange={timer.switchMode} />
      <div className="timer-face">
        <ProgressRing progress={timer.remaining / timer.duration} />
        <div className="timer-digits">
          <span className="eyebrow timer-state">
            <span className={`status-dot ${timer.running ? "pulse" : ""}`} />
            {timer.running
              ? timer.mode === "focus"
                ? "IN THE ZONE"
                : "TAKE A BREATHER"
              : timer.remaining < timer.duration
                ? "PAUSED"
                : "READY WHEN YOU ARE"}
          </span>
          <div
            className="time"
            role="timer"
            aria-label={`${formatTime(timer.remaining)} remaining`}
          >
            {formatTime(timer.remaining)}
          </div>
          <p>
            {timer.mode === "focus"
              ? "One thing at a time."
              : "A little pause. A fresh perspective."}
          </p>
        </div>
      </div>
      <TimerControls timer={timer} onToggle={onToggle} />
      <div className="cycle">
        <div
          className="cycle-dots"
          aria-label={`${timer.completed} of ${settings.interval} focus sessions completed`}
        >
          {Array.from({ length: settings.interval }, (_, i) => (
            <span
              key={i}
              className={
                i < timer.completed
                  ? "done"
                  : i === timer.completed && timer.mode === "focus"
                    ? "current"
                    : ""
              }
            />
          ))}
        </div>
        <span>
          Session{" "}
          <strong>
            {Math.min(
              timer.completed + (timer.mode === "focus" ? 1 : 0),
              settings.interval,
            ) || 1}
          </strong>{" "}
          of {settings.interval}
        </span>
      </div>
      <div className="timer-footnote">
        <Leaf size={15} />
        {timer.mode === "focus"
          ? "Small sessions. Meaningful progress."
          : "Rest is part of the process."}
      </div>
    </section>
  );
}
