import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import TaskList from "./TaskList";
import { readStorage } from "../utils/storage";
function Harness() {
  const [task, setTask] = useState("");
  return (
    <>
      <output data-testid="current-task">{task}</output>
      <TaskList currentTask={task} onFocus={setTask} />
    </>
  );
}
beforeEach(() => localStorage.clear());
afterEach(cleanup);
it("adds, focuses, edits, completes, restores, and deletes tasks", () => {
  const { unmount } = render(<Harness />);
  fireEvent.change(screen.getByLabelText("New task"), {
    target: { value: "Plan portfolio" },
  });
  fireEvent.click(screen.getByLabelText("Add to task list"));
  expect(screen.getByText("1 remaining")).toBeTruthy();
  fireEvent.click(screen.getByLabelText("Focus on Plan portfolio"));
  expect(screen.getByTestId("current-task").textContent).toBe("Plan portfolio");
  fireEvent.click(screen.getByLabelText("Edit Plan portfolio"));
  fireEvent.change(screen.getByLabelText("Edit task name"), {
    target: { value: "Build portfolio" },
  });
  fireEvent.click(screen.getByLabelText("Save task name"));
  expect(screen.getByTestId("current-task").textContent).toBe(
    "Build portfolio",
  );
  fireEvent.click(screen.getByLabelText("Complete Build portfolio"));
  expect(screen.getByText("0 remaining")).toBeTruthy();
  expect(screen.getByTestId("current-task").textContent).toBe("");
  expect(readStorage("tasks", [])[0].completed).toBe(true);
  unmount();
  render(<Harness />);
  expect(screen.getByLabelText("Complete Build portfolio").checked).toBe(true);
  fireEvent.click(screen.getByLabelText("Complete Build portfolio"));
  expect(screen.getByText("1 remaining")).toBeTruthy();
  fireEvent.click(screen.getByLabelText("Delete Build portfolio"));
  expect(readStorage("tasks", [])).toEqual([]);
});
it("rejects empty names and falls back from malformed saved task lists", () => {
  localStorage.setItem("zachfocus:tasks", JSON.stringify([null]));
  render(<Harness />);
  fireEvent.click(screen.getByLabelText("Add to task list"));
  expect(screen.getByRole("alert").textContent).toContain(
    "Give your task a name",
  );
  expect(readStorage("tasks", null)).toEqual([]);
});
it("saves task priority and lets it be changed without changing the focused task", () => {
  const { unmount } = render(<Harness />);
  fireEvent.change(screen.getByLabelText("New task"), {
    target: { value: "Ship homepage" },
  });
  fireEvent.change(screen.getByLabelText("New task priority"), {
    target: { value: "high" },
  });
  fireEvent.click(screen.getByLabelText("Add to task list"));
  expect(readStorage("tasks", [])[0].priority).toBe("high");
  fireEvent.click(screen.getByLabelText("Focus on Ship homepage"));
  fireEvent.change(screen.getByLabelText("Priority for Ship homepage"), {
    target: { value: "low" },
  });
  expect(screen.getByTestId("current-task").textContent).toBe("Ship homepage");
  expect(readStorage("tasks", [])[0].priority).toBe("low");
  unmount();
  render(<Harness />);
  expect(screen.getByLabelText("Priority for Ship homepage").value).toBe("low");
});
it("preserves older tasks and defaults missing or invalid priorities to medium", () => {
  localStorage.setItem(
    "zachfocus:tasks",
    JSON.stringify([
      { id: "legacy", title: "Existing task", completed: false },
      {
        id: "invalid",
        title: "Finished task",
        completed: true,
        priority: "unknown",
      },
    ]),
  );
  render(<Harness />);
  expect(screen.getByLabelText("Priority for Existing task").value).toBe(
    "medium",
  );
  expect(screen.getByLabelText("Complete Finished task").checked).toBe(true);
  expect(readStorage("tasks", []).map((task) => task.priority)).toEqual([
    "medium",
    "medium",
  ]);
});
