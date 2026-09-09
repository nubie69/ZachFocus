import { CircleCheck, Clock3, Flame, Target, ArrowUpRight } from "lucide-react";
import { focusLabel } from "../utils/time";
export default function DailyStats({
  sessions,
  minutes,
  goal,
  streak,
  onSettings,
}) {
  return (
    <aside id="statistics" className="stats-stack">
      <section className="panel stats-card">
        <div className="section-heading">
          <h2>Today's focus</h2>
          <span className="live-label">
            <span className="status-dot" />
            Today
          </span>
        </div>
        <div className="stat-pair">
          <div>
            <CircleCheck size={19} />
            <strong>
              {sessions}
              <span>sessions</span>
            </strong>
            <p>Completed</p>
          </div>
          <div>
            <Clock3 size={19} />
            <strong>{focusLabel(minutes)}</strong>
            <p>Time focused</p>
          </div>
        </div>
        <div className="goal-heading">
          <span>
            <Target size={16} />
            Daily goal
          </span>
          <button
            className="text-button"
            aria-label="Edit daily goal"
            onClick={onSettings}
          >
            {sessions} <span>/ {goal} sessions</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
        <div
          className="goal-track"
          role="progressbar"
          aria-label="Daily goal"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={Math.min(sessions, goal)}
        >
          <span style={{ width: `${Math.min(sessions / goal, 1) * 100}%` }} />
        </div>
        <p className="goal-caption">
          {sessions >= goal
            ? "🎉 Daily goal completed!"
            : sessions === 0
              ? "A fresh start. Make time for what matters."
              : `${goal - sessions} more ${goal - sessions === 1 ? "session" : "sessions"} to reach your goal.`}
        </p>
      </section>
      <section className="panel streak-card">
        <span className="flame-icon">
          <Flame size={25} />
        </span>
        <div>
          <h2>{streak} day streak</h2>
          <p>
            {streak
              ? "Keep showing up for yourself."
              : "Your next good habit starts here."}
          </p>
        </div>
      </section>
      <section className="rhythm-card">
        <span className="eyebrow">FIND YOUR RHYTHM</span>
        <h3>Focus. Rest. Repeat.</h3>
        <p>
          Give one task your full attention.
          <br />
          Let your next break be a real break.
        </p>
        <div className="rhythm-steps">
          <span>
            <i />
            Focus
          </span>
          <span className="rhythm-line" />
          <span>
            <i />
            Break
          </span>
          <span className="rhythm-line" />
          <span>
            <i />
            Repeat
          </span>
        </div>
      </section>
    </aside>
  );
}
