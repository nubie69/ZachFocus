import { useState } from "react";
import { History, Check, Brain, ChevronDown } from "lucide-react";
import { localDate } from "../utils/time";
import SessionNoteEditor from "./SessionNoteEditor";
export default function SessionHistory({ history, today, onSaveNote }) {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const items = [...history].reverse();
  const visible = expanded ? items : items.slice(0, 5);
  return (
    <section className="panel history-card">
      <div className="section-heading">
        <div className="flex items-center gap-2">
          <History size={19} />
          <h2>Session history</h2>
        </div>
        <span className="history-range">Last 30 days</span>
      </div>
      {!items.length ? (
        <div className="empty-history">
          <div className="empty-icon">
            <Brain size={24} />
          </div>
          <h3>No focus sessions completed yet.</h3>
          <p>Start your first session and begin building your focus streak.</p>
        </div>
      ) : (
        <div className="history-list">
          {visible.map((session) => {
            const date = new Date(session.endedAt);
            return (
              <div className="history-entry" key={session.id}>
                <div className="history-row">
                  <span className="history-check">
                    <Check size={17} />
                  </span>
                  <div className="history-info">
                    <strong>{session.task || "Focus session"}</strong>
                    <span>
                      {session.minutes} minutes ·{" "}
                      <span className="completed-label">Completed</span>
                    </span>
                    {session.note && (
                      <p className="session-note-text">{session.note}</p>
                    )}
                    <button
                      className="text-button history-note-button"
                      onClick={() => setEditingId(session.id)}
                      aria-label={`${session.note ? "Edit" : "Add"} note for ${session.task || "Focus session"} at ${date.toLocaleString()}`}
                    >
                      {session.note ? "Edit note" : "Add note"}
                    </button>
                  </div>
                  <time dateTime={session.endedAt}>
                    {localDate(date) === today
                      ? "Today"
                      : date.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                    <span>
                      {date.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </time>
                </div>
                {editingId === session.id && (
                  <SessionNoteEditor
                    key={session.id}
                    note={session.note}
                    onCancel={() => setEditingId(null)}
                    onSave={(note) => {
                      onSaveNote(session.id, note);
                      setEditingId(null);
                    }}
                  />
                )}
              </div>
            );
          })}
          {items.length > 5 && (
            <button
              className="history-more"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : `View all ${items.length} sessions`}
              <ChevronDown size={16} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
