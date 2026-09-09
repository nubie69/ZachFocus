import { useEffect, useRef, useState } from "react";
import { X, Settings2, Volume2 } from "lucide-react";
import { defaults } from "../utils/storage";
import {
  playSound,
  requestNotifications,
  unlockAudio,
} from "../utils/notifications";
import ConfirmDialog from "./ConfirmDialog";
const fields = [
  ["focus", "Focus duration", 120, "min"],
  ["short", "Short break", 120, "min"],
  ["long", "Long break", 120, "min"],
  ["interval", "Sessions before long break", 12, "sessions"],
  ["goal", "Daily goal", 24, "sessions"],
];
export default function SettingsModal({ settings, onSave, onClose }) {
  const dialog = useRef(null);
  const [draft, setDraft] = useState(settings);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const change = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const save = (e) => {
    e.preventDefault();
    const issues = {};
    const next = { ...draft };
    fields.forEach(([key, , max]) => {
      const value = Number(draft[key]);
      if (!Number.isInteger(value) || value < 1 || value > max)
        issues[key] = `Choose a whole number from 1 to ${max}.`;
      next[key] = value;
    });
    setErrors(issues);
    if (!Object.keys(issues).length) onSave(next);
  };
  const notifications = async () => {
    if (draft.notifications) {
      change("notifications", false);
      return;
    }
    const allowed = await requestNotifications();
    change("notifications", allowed);
    setNotice(
      allowed
        ? "Notifications enabled for this browser."
        : "Notifications are unavailable or blocked. You can allow them in your browser’s site settings.",
    );
  };
  return (
    <dialog
      ref={dialog}
      className="settings-dialog"
      aria-labelledby="settings-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <div>
          <Settings2 size={19} />
          <h2 id="settings-title">Make it your rhythm</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close settings"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <p className="modal-intro">A little structure, on your terms.</p>
      <form noValidate onSubmit={save}>
        <div className="settings-fields">
          {fields.map(([key, label, max, unit]) => (
            <div className="field" key={key}>
              <label htmlFor={key}>{label}</label>
              <div className="number-field">
                <input
                  id={key}
                  type="number"
                  min="1"
                  max={max}
                  step="1"
                  required
                  value={draft[key]}
                  onChange={(e) => change(key, e.target.value)}
                  aria-invalid={!!errors[key]}
                  aria-describedby={errors[key] ? `${key}-error` : undefined}
                />
                <span>{unit}</span>
              </div>
              {errors[key] && (
                <p className="field-error" id={`${key}-error`}>
                  {errors[key]}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="preferences">
          {[
            [
              "sound",
              "Completion sound",
              "A gentle chime when a session ends.",
            ],
            [
              "notifications",
              "Browser notifications",
              "Get a reminder when you’re in another tab.",
            ],
            [
              "autoBreak",
              "Auto-start breaks",
              "Ease straight into your next break.",
            ],
            [
              "autoFocus",
              "Auto-start focus sessions",
              "Start focusing as soon as your break ends.",
            ],
          ].map(([key, label, description]) => (
            <div className="preference" key={key}>
              <div>
                <span id={`${key}-label`}>{label}</span>
                <p>{description}</p>
              </div>
              <button
                type="button"
                className={`switch ${draft[key] ? "on" : ""}`}
                role="switch"
                aria-checked={draft[key]}
                aria-labelledby={`${key}-label`}
                onClick={() =>
                  key === "notifications"
                    ? notifications()
                    : change(key, !draft[key])
                }
              >
                <span />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-button test-sound"
            onClick={() => {
              unlockAudio();
              setTimeout(
                () =>
                  setNotice(
                    playSound()
                      ? "Playing a gentle completion chime."
                      : "Sound is unavailable in this browser.",
                  ),
                100,
              );
            }}
          >
            <Volume2 size={15} />
            Test sound
          </button>
          {notice && (
            <p className="settings-notice" role="status">
              {notice}
            </p>
          )}
        </div>
        <div className="shortcuts">
          <span>Keyboard shortcuts</span>
          <div>
            <kbd>Space</kbd> Start / pause <kbd>R</kbd> Reset <kbd>S</kbd> Skip
          </div>
        </div>
        <p className="settings-hint">
          Saving resets the current timer. Your completed sessions stay.
        </p>
        {confirm ? (
          <ConfirmDialog
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              setDraft({ ...defaults });
              setErrors({});
              setConfirm(false);
              setNotice("Defaults restored. Save settings to apply.");
            }}
          />
        ) : (
          <div className="modal-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => setConfirm(true)}
            >
              Reset to default
            </button>
            <button className="primary-button" type="submit">
              Save settings
            </button>
          </div>
        )}
      </form>
    </dialog>
  );
}
