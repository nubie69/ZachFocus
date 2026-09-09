import {
  Zap,
  ChartNoAxesColumnIncreasing,
  Settings2,
  Sun,
  Moon,
} from "lucide-react";
export default function Header({ theme, onTheme, onSettings }) {
  return (
    <header className="header">
      <a className="brand" href="#">
        <span className="brand-mark">
          <Zap size={21} fill="currentColor" />
        </span>
        Zach<span className="brand-focus">Focus</span>
      </a>
      <nav aria-label="App controls">
        <a
          className="icon-button"
          href="#statistics"
          aria-label="View statistics"
          title="Statistics"
        >
          <ChartNoAxesColumnIncreasing size={20} />
        </a>
        <button
          className="icon-button"
          onClick={onSettings}
          aria-label="Open settings"
          title="Settings"
        >
          <Settings2 size={20} />
        </button>
        <span className="nav-divider" />
        <button
          className="icon-button"
          onClick={onTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>
    </header>
  );
}
