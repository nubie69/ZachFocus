import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";
import { defaults, readStorage, writeStorage } from "../utils/storage";
describe("ZachFocus interface", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 9, 10));
    document.head.innerHTML = '<meta name="theme-color" content="#111614">';
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });
  it("runs controls, updates the tab title, and preserves a task on reload", () => {
    const { unmount } = render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Start focus" }));
    act(() => vi.advanceTimersByTime(2000));
    expect(document.title).toContain("24:58");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByRole("timer").textContent).toBe("24:58");
    fireEvent.click(screen.getByRole("button", { name: "Reset timer" }));
    expect(screen.getByRole("timer").textContent).toBe("25:00");
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Finish portfolio" },
    });
    fireEvent.keyDown(screen.getByRole("textbox"), { code: "Space", key: " " });
    expect(screen.getByRole("button", { name: "Start focus" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save task" }));
    expect(readStorage("task", "")).toBe("Finish portfolio");
    fireEvent.keyDown(document.body, { code: "Space", key: " " });
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    fireEvent.keyDown(document.body, { key: "r" });
    expect(screen.getByRole("timer").textContent).toBe("25:00");
    fireEvent.keyDown(document.body, { key: "s" });
    expect(
      screen
        .getByRole("button", { name: "Short Break" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    unmount();
    render(<Home />);
    expect(
      screen.getByRole("button", { name: "Finish portfolio" }),
    ).toBeTruthy();
  });
  it("validates settings, confirms reset, and persists theme", () => {
    render(<Home />);
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(readStorage("theme", "")).toBe("light");
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    fireEvent.change(screen.getByLabelText("Focus duration"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(
      screen.getByText("Choose a whole number from 1 to 120."),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Focus duration"), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(screen.getByRole("timer").textContent).toBe("12:00");
    expect(readStorage("settings", {}).focus).toBe(12);
    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(screen.getByText("Restore default settings?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep settings" }));
    expect(screen.getByLabelText("Focus duration").value).toBe("12");
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(screen.getByLabelText("Focus duration").value).toBe("25");
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(screen.getByRole("timer").textContent).toBe("25:00");
  });
  it("records completion, reaches a daily goal, and resets daily totals at midnight", () => {
    writeStorage("settings", { ...defaults, focus: 1, goal: 1, sound: false });
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Start focus" }));
    act(() => vi.advanceTimersByTime(60000));
    expect(readStorage("history", [])).toHaveLength(1);
    expect(screen.getByText("🎉 Daily goal completed!")).toBeTruthy();
    expect(screen.getByText("1 day streak")).toBeTruthy();
    expect(screen.getByText("Focus session")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Skip session" }));
    expect(readStorage("history", [])).toHaveLength(1);
    act(() => {
      vi.setSystemTime(new Date(2026, 8, 10, 0, 1));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "0",
    );
    expect(screen.getByText("1 day streak")).toBeTruthy();
    expect(screen.getByText("Focus session")).toBeTruthy();
  });
  it("exposes the same task action to a supported tool registry and validates inputs", () => {
    let tool;
    let signal;
    document.modelContext = {
      registerTool: (value, options) => {
        tool = value;
        signal = options.signal;
      },
    };
    const { unmount } = render(<Home />);
    expect(tool.name).toBe("set_current_focus_task");
    expect(tool.annotations.readOnlyHint).toBe(false);
    act(() => {
      expect(tool.execute({ task: "Build ZachFocus" })).toEqual({
        task: "Build ZachFocus",
      });
    });
    expect(
      screen.getByRole("button", { name: "Build ZachFocus" }),
    ).toBeTruthy();
    expect(() => tool.execute({ task: 42 })).toThrow();
    expect(readStorage("task", "")).toBe("Build ZachFocus");
    unmount();
    expect(signal.aborted).toBe(true);
    delete document.modelContext;
  });
});
