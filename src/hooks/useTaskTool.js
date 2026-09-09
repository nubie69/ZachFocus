import { useEffect } from "react";
import { flushSync } from "react-dom";

// Progressive enhancement for browsers exposing the experimental WebMCP API.
export function useTaskTool(setTask) {
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "set_current_focus_task",
            title: "Set current focus task",
            description:
              "Set, edit, or clear the task displayed beside the Pomodoro timer. An empty task clears it.",
            inputSchema: {
              type: "object",
              properties: { task: { type: "string", maxLength: 180 } },
              required: ["task"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute(input) {
              if (
                !input ||
                typeof input.task !== "string" ||
                input.task.length > 180 ||
                Object.keys(input).some((key) => key !== "task")
              )
                throw new Error("Provide a task of up to 180 characters.");
              const task = input.task.trim();
              flushSync(() => setTask(task));
              return { task };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* The regular interface remains available. */
    }
    return () => lifecycle.abort();
  }, [setTask]);
}
