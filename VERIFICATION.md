# Verification

ZachFocus includes automated tests for timer and interface behavior. Run `npm test` and `npm run build` after changes.

## Automated coverage

- Ambient selection and volume persistence without autoplay; audio error handling
- Bounded synthesized audio, single-source switching, cancellation of pending starts, pause, and cleanup

- Start, exact pause/resume, reset, skip, and custom mode durations
- Four completed focus sessions leading to a long break, then a fresh cycle
- Optional automatic starts and cleanup of the single countdown interval
- Timestamp recovery after simulated tab suspension, with exactly one completion
- Completion attribution to the original ending time
- Keyboard shortcuts and protection while typing
- Settings validation, save behavior, and confirmation before restoring defaults
- Task and theme persistence
- Completed-session history, daily goal completion, and midnight rollover
- Consecutive calendar-day streaks, including streaks longer than retained history
- Invalid JSON, invalid saved values, and unavailable LocalStorage
- Notification opt-in behavior and denied/unsupported API handling
- Web Audio note scheduling and volume envelope with a mocked audio context
- Experimental WebMCP task-tool registration, action, validation, and cleanup using a simulated registry

## Environment limits

The local Vite server returned HTTP 200. No browser was available through this session’s browser tools. Consequently, actual desktop/mobile rendering, horizontal overflow, browser console output, native dialog focus behavior, real background-tab throttling, audible playback, and operating-system notification delivery were not manually verified. Automated DOM tests do not substitute for these checks. The experimental task tool was not tested against a native WebMCP browser implementation.

## Manual pre-release checks

1. Open the app at desktop, tablet, and 320/375-pixel mobile widths. Check both themes, 200% zoom, long task text, populated history, and the settings panel for readable text and no horizontal overflow.
2. Start and pause a timer, switch tabs, then return and compare elapsed time. Set Focus to one minute to verify a real completion chime.
3. Explicitly enable notifications in Settings, grant browser permission, and finish a session in another tab. Test the blocked-permission message too.
4. Use Tab, Shift+Tab, Enter, Space, R, S, and Escape. Ensure the settings dialog traps focus and returns focus when closed.
5. Restore defaults and check the confirmation. Reload to verify saved preferences and task.

Vercel deployment has not been performed. The frontend builds to `dist/` without environment variables or a backend; deployment steps are in README.md.
