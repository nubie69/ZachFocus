export default function ConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="confirmation">
      <h3>Restore default settings?</h3>
      <p>
        Timer durations, daily goal, and preferences will return to their
        defaults. Your task and history will stay.
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" className="subtle-button" onClick={onCancel}>
          Keep settings
        </button>
        <button type="button" className="primary-button" onClick={onConfirm}>
          Reset to default
        </button>
      </div>
    </div>
  );
}
