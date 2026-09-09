import { useState } from "react";
import { Pencil, Plus, X, ArrowRight, Target } from "lucide-react";
export default function CurrentTask({ task, setTask }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);
  const save = (e) => {
    e.preventDefault();
    setTask(draft.trim());
    setEditing(false);
  };
  return (
    <section className="task-card panel">
      <div className="task-icon">
        <Target size={21} />
      </div>
      <div className="task-content">
        <span className="eyebrow">CURRENT TASK</span>
        {editing ? (
          <form onSubmit={save} className="task-form">
            <input
              autoFocus
              aria-label="What are you working on?"
              placeholder="What are you working on?"
              maxLength={180}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <button className="icon-button" aria-label="Save task">
              <ArrowRight size={19} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Cancel editing"
              onClick={() => setEditing(false)}
            >
              <X size={17} />
            </button>
          </form>
        ) : (
          <button
            className={`task-text ${task ? "" : "muted"}`}
            onClick={() => {
              setDraft(task);
              setEditing(true);
            }}
          >
            {task || "What are you working on?"}
          </button>
        )}
      </div>
      {!editing && (
        <div className="flex gap-1">
          <button
            className="icon-button"
            aria-label={task ? "Edit task" : "Add task"}
            onClick={() => {
              setDraft(task);
              setEditing(true);
            }}
          >
            {task ? <Pencil size={17} /> : <Plus size={19} />}
          </button>
          {task && (
            <button
              className="icon-button"
              aria-label="Clear task"
              onClick={() => setTask("")}
            >
              <X size={17} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
