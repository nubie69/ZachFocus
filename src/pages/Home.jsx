import { useEffect, useState } from "react";
import { Zap, ShieldCheck } from "lucide-react";
import Header from "../components/Header";
import Timer from "../components/Timer";
import CurrentTask from "../components/CurrentTask";
import TaskList from "../components/TaskList";
import AmbientSounds from "../components/AmbientSounds";
import DailyStats from "../components/DailyStats";
import SessionHistory from "../components/SessionHistory";
import SessionNoteEditor from "../components/SessionNoteEditor";
import SettingsModal from "../components/SettingsModal";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useTimer } from "../hooks/useTimer";
import { useTaskTool } from "../hooks/useTaskTool";
import { defaults, validSettings, validHistory } from "../utils/storage";
import {
  localDate,
  recentHistory,
  streakFromHistory,
  formatTime,
  modes,
  currentStreak,
  completeStreak,
} from "../utils/time";
import { notify, playSound, unlockAudio } from "../utils/notifications";
export default function Home() {
  const [settings, setSettings, settingsError] = useLocalStorage(
    "settings",
    defaults,
    validSettings,
  );
  const [history, setHistory, historyError] = useLocalStorage(
    "history",
    [],
    validHistory,
  );
  const [theme, setTheme, themeError] = useLocalStorage(
    "theme",
    "dark",
    (value) => ["dark", "light"].includes(value),
  );
  const [task, setTask, taskError] = useLocalStorage(
    "task",
    "",
    (value) => typeof value === "string" && value.length <= 180,
  );
  useTaskTool(setTask);
  const [streakRecord, setStreakRecord, streakError] = useLocalStorage(
    "streak",
    {
      count: streakFromHistory(history),
      lastDate: history.length
        ? localDate(new Date(history[history.length - 1].endedAt))
        : "",
    },
    (value) =>
      value &&
      Number.isInteger(value.count) &&
      value.count >= 0 &&
      typeof value.lastDate === "string" &&
      (value.lastDate === "" || /^\d{4}-\d{2}-\d{2}$/.test(value.lastDate)),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [today, setToday] = useState(localDate());
  const [message, setMessage] = useState("");
  const [pendingNotes, setPendingNotes] = useState([]);
  const timer = useTimer(settings, (mode, minutes, completedAt) => {
    const text =
      mode === "focus"
        ? "Focus session complete! Time for a break."
        : "Break finished! Ready to focus?";
    if (mode === "focus") {
      const id = crypto.randomUUID();
      setHistory((previous) =>
        recentHistory([
          ...previous,
          {
            id,
            endedAt: completedAt.toISOString(),
            minutes,
            task,
            note: "",
          },
        ]),
      );
      setPendingNotes((previous) => [...previous, id]);
      setStreakRecord((previous) => completeStreak(previous, completedAt));
    }
    setToday(localDate());
    setMessage(text);
    if (settings.sound) playSound();
    if (settings.notifications) notify(text);
  });
  const onToggle = () => {
    unlockAudio();
    timer.toggle();
  };
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === "dark" ? "#111614" : "#f5f7f5";
  }, [theme]);
  useEffect(() => {
    document.title = timer.running
      ? `${formatTime(timer.remaining)} — ${modes[timer.mode]} | ZachFocus`
      : "ZachFocus — Pomodoro Timer";
  }, [timer.running, timer.remaining, timer.mode]);
  useEffect(() => {
    const check = () => setToday(localDate());
    const id = setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  useEffect(() => {
    setHistory((previous) => recentHistory(previous));
  }, [today, setHistory]);
  useEffect(() => {
    const handle = (event) => {
      if (
        settingsOpen ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.target.closest(
          'input, textarea, select, button, a, [contenteditable="true"]',
        )
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        onToggle();
      }
      if (event.key.toLowerCase() === "r") timer.reset();
      if (event.key.toLowerCase() === "s") timer.skip();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  });
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(id);
  }, [message]);
  const recent = recentHistory(history);
  const todays = recent.filter((s) => localDate(new Date(s.endedAt)) === today);
  const streak = currentStreak(streakRecord);
  const pendingSession = pendingNotes
    .map((id) => recent.find((session) => session.id === id))
    .find(Boolean);
  const dismissNote = (id) =>
    setPendingNotes((previous) => previous.filter((item) => item !== id));
  const saveNote = (id, note) => {
    setHistory((previous) =>
      previous.map((session) =>
        session.id === id
          ? { ...session, note: note.trim().slice(0, 280) }
          : session,
      ),
    );
    dismissNote(id);
  };
  return (
    <div className="app-shell">
      <Header
        theme={theme}
        onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onSettings={() => setSettingsOpen(true)}
      />
      <main>
        <div className="page-intro">
          <div>
            <div className="workspace-label">
              <span />
              YOUR SPACE TO FOCUS
            </div>
            <h1>
              Focus better. <span>Get more done.</span>
            </h1>
            <p>A little focus today goes a long way.</p>
          </div>
          <span className="date-label">
            {new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        {(settingsError ||
          historyError ||
          taskError ||
          themeError ||
          streakError) && (
          <p className="storage-error" role="status">
            Browser storage is unavailable. Your changes will last for this
            visit only.
          </p>
        )}
        <div className="workspace">
          <div className="focus-column">
            <Timer timer={timer} settings={settings} onToggle={onToggle} />
            <CurrentTask task={task} setTask={setTask} />
            {pendingSession && (
              <section
                className="panel session-note-prompt"
                aria-labelledby="session-note-heading"
              >
                <h2 id="session-note-heading">
                  Focus complete. Capture a small win.
                </h2>
                <p className="note-prompt-description" role="status">
                  Your {pendingSession.minutes}-minute session is saved. Add a
                  note before you move on.
                </p>
                <SessionNoteEditor
                  key={pendingSession.id}
                  note={pendingSession.note}
                  onSave={(note) => saveNote(pendingSession.id, note)}
                  onCancel={() => dismissNote(pendingSession.id)}
                  cancelLabel="Maybe later"
                />
              </section>
            )}
            <div className="keyboard-hint">
              <kbd>Space</kbd> start / pause<span>·</span>
              <kbd>R</kbd> reset<span>·</span>
              <kbd>S</kbd> skip
            </div>
          </div>
          <DailyStats
            sessions={todays.length}
            minutes={todays.reduce((sum, s) => sum + s.minutes, 0)}
            goal={settings.goal}
            streak={streak}
            onSettings={() => setSettingsOpen(true)}
          />
        </div>
        <AmbientSounds />
        <TaskList currentTask={task} onFocus={setTask} />
        <SessionHistory history={recent} today={today} onSaveNote={saveNote} />
        <section className="about">
          <div>
            <h2>
              <Zap size={16} />A little structure. A lot more focus.
            </h2>
            <p>
              ZachFocus is a lightweight Pomodoro productivity timer designed to
              help you maintain focus, manage breaks, and build consistent work
              habits.
            </p>
          </div>
          <div className="about-tech">
            <div className="privacy-note">
              <ShieldCheck size={15} />
              Your progress stays in your browser.
            </div>
            <div className="badges">
              {["React", "Vite", "Tailwind CSS", "LocalStorage"].map((text) => (
                <span key={text}>{text}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer>
        <span>
          <strong>ZachFocus</strong>
          <span className="footer-divider">/</span>Developed by Zach Gelacio
        </span>
        <span>© 2026 ZachFocus</span>
      </footer>
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={(next) => {
            setSettings(next);
            timer.reconfigure(next);
            setSettingsOpen(false);
            setMessage("Settings saved. Ready for a fresh session.");
          }}
        />
      )}
    </div>
  );
}
