let audio;
export function unlockAudio() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (Audio) {
      audio ||= new Audio();
      audio.resume().catch(() => {});
    }
  } catch {
    /* Sound is optional. */
  }
}
export function playSound() {
  try {
    if (!audio || audio.state !== "running") return false;
    [523.25, 659.25, 783.99].forEach((frequency, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + i * 0.16;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    return true;
  } catch {
    return false;
  }
}
export async function requestNotifications() {
  try {
    return (
      "Notification" in window &&
      (await Notification.requestPermission()) === "granted"
    );
  } catch {
    return false;
  }
}
export function notify(message) {
  try {
    if ("Notification" in window && Notification.permission === "granted")
      new Notification("ZachFocus", { body: message, icon: "/favicon.svg" });
  } catch {
    /* Unsupported browsers may reject notifications. */
  }
}
