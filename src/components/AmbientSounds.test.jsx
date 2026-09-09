import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AmbientSounds from "./AmbientSounds";
import { readStorage, writeStorage } from "../utils/storage";
const audio = vi.hoisted(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  dispose: vi.fn(),
  setVolume: vi.fn(),
}));
vi.mock("../utils/ambientAudio", async (importOriginal) => ({
  ...(await importOriginal()),
  createAmbientPlayer: (callback) => ({
    ...audio,
    pause: () => {
      audio.pause();
      callback(false);
    },
  }),
}));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  audio.play.mockResolvedValue(true);
});
afterEach(cleanup);
it("restores preferences without autoplay and saves volume and sound selection", async () => {
  writeStorage("ambient", { mode: "rain", volume: 22 });
  render(<AmbientSounds />);
  expect(
    screen.getByRole("button", { name: "Rain" }).getAttribute("aria-pressed"),
  ).toBe("true");
  expect(audio.play).not.toHaveBeenCalled();
  await act(async () =>
    fireEvent.click(screen.getByLabelText("Play ambient sound")),
  );
  expect(audio.play).toHaveBeenCalledWith("rain", 22);
  fireEvent.change(screen.getByLabelText("Ambient volume"), {
    target: { value: "60" },
  });
  expect(audio.setVolume).toHaveBeenLastCalledWith(60);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Café" })),
  );
  expect(readStorage("ambient", {})).toEqual({ mode: "cafe", volume: 60 });
  fireEvent.click(screen.getByRole("button", { name: "Silence" }));
  expect(audio.pause).toHaveBeenCalled();
  expect(screen.getByLabelText("Play ambient sound").disabled).toBe(true);
});
it("handles unavailable audio and releases it on unmount", async () => {
  audio.play.mockRejectedValue(new Error("Audio is unavailable."));
  const { unmount } = render(<AmbientSounds />);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "White noise" })),
  );
  expect(screen.getByRole("alert").textContent).toBe("Audio is unavailable.");
  unmount();
  expect(audio.dispose).toHaveBeenCalled();
});
