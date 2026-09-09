import { Brain, Coffee, Armchair } from "lucide-react";
import { modes } from "../utils/time";
const icons = { focus: Brain, short: Coffee, long: Armchair };
export default function ModeSelector({ mode, onChange }) {
  return (
    <div className="mode-selector" aria-label="Timer mode">
      {Object.entries(modes).map(([key, label]) => {
        const Icon = icons[key];
        return (
          <button
            key={key}
            aria-pressed={mode === key}
            className={mode === key ? "selected" : ""}
            onClick={() => onChange(key)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
