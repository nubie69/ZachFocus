export const modes = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};
export const formatTime = (ms) => {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function recentHistory(history, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 29);
  cutoff.setHours(0, 0, 0, 0);
  return history.filter(
    (s) => new Date(s.endedAt) >= cutoff && new Date(s.endedAt) <= now,
  );
}
export function streakFromHistory(history, now = new Date()) {
  const days = new Set(history.map((s) => localDate(new Date(s.endedAt))));
  const cursor = new Date(now);
  if (!days.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
export function nextSession(mode, completed, interval, skipped = false) {
  if (mode === "focus") {
    const count = completed + (skipped ? 0 : 1);
    return { mode: count >= interval ? "long" : "short", completed: count };
  }
  return { mode: "focus", completed: mode === "long" ? 0 : completed };
}
export function focusLabel(minutes) {
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m`;
}
export function currentStreak(record, now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return record.lastDate === localDate(now) ||
    record.lastDate === localDate(yesterday)
    ? record.count
    : 0;
}
export function completeStreak(record, now = new Date()) {
  const date = localDate(now);
  return record.lastDate === date
    ? record
    : { count: currentStreak(record, now) + 1, lastDate: date };
}
