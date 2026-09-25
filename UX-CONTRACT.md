# Mast UX Contract

This contract records observable prototype behavior. Visual values live in `DESIGN.md`.

## Navigation

- Primary destinations are Home, Learn, Review, and Report. The active destination is always explicit in the fixed bottom navigation.
- Growth Space opens from Home and returns to Home with the same progress state.
- Entering or leaving a lesson dismisses the simulated keyboard and preserves earned progress already committed by a completed stage.
- Document titles follow `{Page} — Mast` for every navigable view.

## Session and data loading

- Authentication gates product data. Signed-out users see one owned login form with app validation, password reveal, busy-state duplicate-submit prevention, keyboard-safe scrolling, and a clear support path.
- App bootstrap data is loaded through one typed client boundary with abortable requests. Screens receive data through props rather than owning backend-shaped constants.
- Loading reserves stable content geometry. Empty, offline, and server-failure states use distinct copy, semantic status roles, and a visible retry action.
- Online recovery retries the current bootstrap request. Superseded and unmounted requests are aborted so stale responses cannot replace newer state.
- Local development may expose deterministic `state` query scenarios for UI verification; production builds ignore those overrides.

## Learning loop

- The core loop is `select → check → explanation → continue`.
- A wrong answer removes one heart, resets combo, keeps the same problem, and does not remove already earned stage XP.
- A correct answer adds 10 stage XP and 2 stars. Stage rewards are committed only on completion.
- Reaching zero hearts exits to Home without committing the incomplete stage.
- Completion updates XP, stars, overall progress, completed-stage count, and the result screen before returning Home.

## Feedback and state

- Buttons keep stable dimensions across idle, pressed, disabled, success, and error states.
- Success, warning, and error are never communicated by color alone; text and icons accompany the state.
- Notices use one fixed live region and dismiss automatically. Critical explanations remain inline.
- Progress and theme persist in versioned local storage; storage failure does not block the current session.

## Accessibility and responsiveness

- Native buttons own every action. Focus-visible styles, accessible names, and at least 40px primary touch targets are required.
- iPhone and Pixel presets keep the same hierarchy, action order, and reachable fixed navigation.
- Motion is reserved for feedback and earned results and is reduced under `prefers-reduced-motion`.
- Closed simulated keyboards must be visually removed from Mast screens even if a runtime rerender leaves the keyboard asset mounted.
