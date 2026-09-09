# ZachFocus

**Focus better. Get more done.**

A modern, frontend-only Pomodoro productivity timer by **Zach Gelacio**. Work in focused intervals, take intentional breaks, and build consistent habits. The default cycle is four 25-minute focus sessions, with 5-minute short breaks and a 15-minute long break after the fourth completed session.

## Features

- Accurate timestamp-based timer with start, pause, resume, reset, and skip
- Focus, short break, and long break modes with custom durations (1–120 minutes)
- Configurable long-break interval and optional automatic starts
- Daily focus totals, session history, goals, and calendar-day streaks
- Task list with add, edit, complete, delete, and focus selection, saved locally
- Simple current-task editor
- Gentle completion chime and opt-in browser notifications
- Ambient rain, café, white noise, keyboard, or silence with volume control
- Dark and light themes, responsive interface, keyboard-accessible settings
- LocalStorage persistence with validation and graceful fallback
- Reduced-motion support and browser tab countdown

## Tech Stack

React · Vite · JavaScript · Tailwind CSS · Lucide React · LocalStorage

No backend, database, authentication, paid APIs, or environment variables.

## Installation

Use Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

The production output is `dist/`.

## Tests

```bash
npm test
```

Tests cover exact pause/resume timing, throttled-tab recovery, timer cleanup, cycle transitions, skips, settings changes, local date boundaries, streaks, malformed storage, and optional notification APIs.

## Deployment on Vercel

1. Push this project to your GitHub repository.
2. In Vercel, select **Add New → Project** and import the repository.
3. Select the **Vite** framework preset. Keep the project root at the repository root.
4. Use `npm install` as the install command, `npm run build` as the build command, and `dist` as the output directory.
5. Deploy. No environment variables or backend services are needed.

Or deploy from the project folder with the Vercel CLI. After deployment, use the resulting URL for your portfolio’s **Live Demo** button and your repository URL for **GitHub**.

## Usage and data behavior

- Ambient soundscapes are original Web Audio synthesis (including a café-style murmur and clinks, not recorded conversations). They need no external audio files, streaming services, or network access. Choose a sound to start; Play/Pause and volume are independent of the timer. Silence stops playback. Your sound and volume preferences are saved, but reloading never starts audio automatically.

- **Space** starts or pauses, **R** resets, and **S** skips. Shortcuts do not intercept typing or focused interactive controls.
- Only fully completed focus sessions count toward history, daily goals, and streaks. Skips advance to a break without awarding a completed session; four actual completions unlock the default long break.
- Changing modes or saving settings stops and resets the timer. Auto-start options are off by default.
- The running timer uses an end timestamp. Returning after a suspended or throttled tab completes the pending session once; it does not invent multiple unattended sessions. A closed or refreshed page starts a fresh timer.
- History is retained for 30 local calendar days. Daily totals roll over at local midnight. Streaks are saved separately and continue beyond the 30-day history window. A streak stays active through today if yesterday had a session.
- Settings, task, theme, goal, sound and notification preferences, history, and derived streak data stay in this browser. They do not sync across devices. Storage failures fall back to in-memory state.
- Browser notifications require explicit permission from Settings and browser support (normally HTTPS or localhost). Permission is never requested at page load.
- Sound uses Web Audio after a user interaction. Browser/device restrictions can suppress background audio or notifications.

## Project structure

```text
src/
  components/     Timer, controls, settings, task, statistics, history
  hooks/          Timestamp-based useTimer and reusable useLocalStorage
  pages/          Home page composition
  utils/          Date/time helpers, storage validation, notifications
  App.jsx
  main.jsx
  index.css
```

## Portfolio

**Project:** ZachFocus  
**Category:** Productivity Web Application  
**Description:** A modern Pomodoro productivity timer that helps users manage focused work sessions, breaks, daily goals, and productivity streaks.  
**Stack:** React · Vite · Tailwind CSS · LocalStorage

## Author

Developed by **Zach Gelacio**. © 2026 ZachFocus.
