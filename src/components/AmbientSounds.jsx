import { useEffect, useRef, useState } from "react";
import {
  Headphones,
  CloudRain,
  Coffee,
  Radio,
  Keyboard,
  VolumeX,
  Volume2,
  Play,
  Pause,
} from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  ambientDefaults,
  validAmbient,
  createAmbientPlayer,
} from "../utils/ambientAudio";

const options = [
  { id: "rain", label: "Rain", Icon: CloudRain },
  { id: "cafe", label: "Café", Icon: Coffee },
  { id: "white", label: "White noise", Icon: Radio },
  { id: "keyboard", label: "Keyboard", Icon: Keyboard },
  { id: "silence", label: "Silence", Icon: VolumeX },
];
export default function AmbientSounds() {
  const [settings, setSettings, storageError] = useLocalStorage(
    "ambient",
    ambientDefaults,
    validAmbient,
  );
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const player = useRef(null);
  const requestId = useRef(0);
  const volume = useRef(settings.volume);
  useEffect(() => {
    player.current = createAmbientPlayer(setPlaying);
    return () => {
      requestId.current++;
      player.current.dispose();
    };
  }, []);
  const start = async (mode) => {
    const request = ++requestId.current;
    setError("");
    setPlaying(false);
    try {
      const started = await player.current.play(mode, volume.current);
      if (request === requestId.current) {
        player.current.setVolume(volume.current);
        setPlaying(started);
      }
    } catch (reason) {
      if (request === requestId.current) {
        player.current.pause();
        setError(reason.message || "Could not start audio. Please try again.");
      }
    }
  };
  const pause = () => {
    requestId.current++;
    player.current.pause();
  };
  const select = (mode) => {
    setSettings((previous) => ({ ...previous, mode }));
    if (mode === "silence") {
      pause();
      setError("");
    } else void start(mode);
  };
  return (
    <section className="panel ambient-card" aria-labelledby="ambient-title">
      <div className="section-heading">
        <div className="flex items-center gap-2">
          <Headphones size={19} />
          <h2 id="ambient-title">Ambient sounds</h2>
        </div>
        <span className="history-range" role="status">
          {playing
            ? "Playing"
            : settings.mode === "silence"
              ? "Silence"
              : "Paused"}
        </span>
      </div>
      <p className="ambient-description">
        Set the mood for your next focus session.
      </p>
      <div className="ambient-options" aria-label="Ambient sound selection">
        {options.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`ambient-option ${settings.mode === id ? "selected" : ""}`}
            aria-pressed={settings.mode === id}
            onClick={() => select(id)}
          >
            <Icon size={21} />
            {label}
          </button>
        ))}
      </div>
      <div className="ambient-controls">
        <button
          className="subtle-button ambient-play"
          disabled={settings.mode === "silence"}
          onClick={() => (playing ? pause() : void start(settings.mode))}
          aria-label={playing ? "Pause ambient sound" : "Play ambient sound"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          <span>{playing ? "Pause" : "Play"}</span>
        </button>
        <Volume2 size={17} aria-hidden="true" />
        <label className="sr-only" htmlFor="ambient-volume">
          Ambient volume
        </label>
        <input
          id="ambient-volume"
          type="range"
          min="0"
          max="100"
          step="1"
          value={settings.volume}
          aria-valuetext={`${settings.volume} percent`}
          onChange={(event) => {
            const value = Number(event.target.value);
            volume.current = value;
            setSettings((previous) => ({ ...previous, volume: value }));
            player.current.setVolume(value);
          }}
        />
        <span className="ambient-volume">{settings.volume}%</span>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {storageError && (
        <p className="settings-notice" role="status">
          Your sound preference will last for this visit only.
        </p>
      )}
    </section>
  );
}
