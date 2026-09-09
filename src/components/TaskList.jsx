import { useState } from "react";
import { ListTodo, Plus, Pencil, Trash2, Target, Check, X } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export function validTasks(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        task.title.trim().length > 0 &&
        task.title.length <= 180 &&
        typeof task.completed === "boolean",
    ) &&
    new Set(value.map((task) => task.id)).size === value.length
  );
}

export default function TaskList({ currentTask, onFocus }) {
  const [tasks, setTasks, storageError] = useLocalStorage(
    "tasks",
    [],
    validTasks,
  );
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useLocalStorage(
    "activeTaskId",
    null,
    (value) => typeof value === "string",
  );
  const active = tasks.find(
    (task) =>
      task.id === activeId && !task.completed && task.title === currentTask,
  );
  const add = (event) => {
    event.preventDefault();
    if (!draft.trim()) {
      setError("Give your task a name first.");
      return;
    }
    setTasks((previous) => [
      ...previous,
      { id: crypto.randomUUID(), title: draft.trim(), completed: false },
    ]);
    setDraft("");
    setError("");
  };
  const updateTitle = (event, task) => {
    event.preventDefault();
    if (!editDraft.trim()) {
      setError("A task name cannot be empty.");
      return;
    }
    const title = editDraft.trim();
    setTasks((previous) =>
      previous.map((item) => (item.id === task.id ? { ...item, title } : item)),
    );
    if (active?.id === task.id) onFocus(title);
    setEditingId(null);
    setError("");
  };
  const clearFocus = (task) => {
    if (active?.id === task.id) {
      onFocus("");
      setActiveId(null);
    }
  };
  const remaining = tasks.filter((task) => !task.completed).length;
  return (
    <section className="panel task-list" aria-labelledby="task-list-title">
      <div className="section-heading">
        <div className="flex items-center gap-2">
          <ListTodo size={19} />
          <h2 id="task-list-title">Task list</h2>
        </div>
        <span className="history-range">{remaining} remaining</span>
      </div>
      <form className="task-add-form" onSubmit={add}>
        <input
          aria-label="New task"
          placeholder="Add something to work on…"
          maxLength={180}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError("");
          }}
        />
        <button className="primary-button" aria-label="Add to task list">
          <Plus size={18} />
          <span>Add</span>
        </button>
      </form>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {storageError && (
        <p className="settings-notice" role="status">
          Your task list cannot be saved in this browser. It will last for this
          visit only.
        </p>
      )}
      {!tasks.length ? (
        <p className="task-list-empty">
          A clear next step makes it easier to start. Add your first task.
        </p>
      ) : (
        <ul className="task-items">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`task-item ${task.completed ? "task-completed" : ""} ${active?.id === task.id ? "task-active" : ""}`}
            >
              <input
                type="checkbox"
                className="task-checkbox"
                aria-label={`Complete ${task.title}`}
                checked={task.completed}
                onChange={() => {
                  setTasks((previous) =>
                    previous.map((item) =>
                      item.id === task.id
                        ? { ...item, completed: !item.completed }
                        : item,
                    ),
                  );
                  clearFocus(task);
                }}
              />
              {editingId === task.id ? (
                <form
                  className="task-edit-form"
                  onSubmit={(event) => updateTitle(event, task)}
                >
                  <input
                    autoFocus
                    aria-label="Edit task name"
                    maxLength={180}
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setEditingId(null);
                        setError("");
                      }
                    }}
                  />
                  <button className="icon-button" aria-label="Save task name">
                    <Check size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Cancel task edit"
                    onClick={() => {
                      setEditingId(null);
                      setError("");
                    }}
                  >
                    <X size={18} />
                  </button>
                </form>
              ) : (
                <>
                  <div className="task-item-title">
                    <span>{task.title}</span>
                    {active?.id === task.id && (
                      <small>Currently focusing</small>
                    )}
                    {task.completed && <small>Completed</small>}
                  </div>
                  <div className="task-item-actions">
                    {!task.completed && (
                      <button
                        className="icon-button"
                        aria-label={`Focus on ${task.title}`}
                        aria-pressed={active?.id === task.id}
                        title="Focus on this task"
                        onClick={() => {
                          setActiveId(task.id);
                          onFocus(task.title);
                        }}
                      >
                        <Target size={18} />
                      </button>
                    )}
                    <button
                      className="icon-button"
                      aria-label={`Edit ${task.title}`}
                      onClick={() => {
                        setEditingId(task.id);
                        setEditDraft(task.title);
                        setError("");
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete ${task.title}`}
                      onClick={() => {
                        setTasks((previous) =>
                          previous.filter((item) => item.id !== task.id),
                        );
                        clearFocus(task);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
