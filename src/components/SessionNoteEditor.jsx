import { useId, useState } from "react";

export default function SessionNoteEditor({
  note = "",
  onSave,
  onCancel,
  cancelLabel = "Cancel",
}) {
  const id = useId();
  const [draft, setDraft] = useState(note);
  return (
    <form
      className="session-note-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft.trim().slice(0, 280));
      }}
    >
      <label htmlFor={id}>What did you accomplish?</label>
      <textarea
        id={id}
        rows={3}
        maxLength={280}
        value={draft}
        placeholder="Finished homepage redesign."
        aria-describedby={`${id}-hint`}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onCancel();
          }
        }}
      />
      <div className="note-editor-footer">
        <span id={`${id}-hint`}>{draft.length} / 280 · Optional</span>
        <div className="flex gap-2">
          <button type="button" className="subtle-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="submit" className="primary-button">
            Save note
          </button>
        </div>
      </div>
    </form>
  );
}
