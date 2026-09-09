export const defaults = {
  focus: 25,
  short: 5,
  long: 15,
  interval: 4,
  goal: 4,
  sound: true,
  notifications: false,
  autoBreak: false,
  autoFocus: false,
};
export function readStorage(key, fallback, validate = () => true) {
  try {
    const value = JSON.parse(localStorage.getItem(`zachfocus:${key}`));
    return value !== null && validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key, value) {
  try {
    localStorage.setItem(`zachfocus:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function validSettings(value) {
  return (
    value &&
    Object.keys(defaults).every((key) =>
      typeof defaults[key] === "boolean"
        ? typeof value[key] === "boolean"
        : Number.isInteger(value[key]) &&
          value[key] >= 1 &&
          value[key] <= (key === "interval" ? 12 : key === "goal" ? 24 : 120),
    )
  );
}
export function validHistory(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        Number.isFinite(item.minutes) &&
        item.minutes > 0 &&
        Number.isFinite(new Date(item.endedAt).getTime()),
    )
  );
}
