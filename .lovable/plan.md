# Agent Error Analysis Lab — Build Plan

A polished, responsive single-page web app for learning and practicing Andrew Ng-style error analysis on agentic workflows. Mocked-by-default, calm minimalist UI, light mode default with dark toggle, full localStorage persistence, undo/redo.

## Information architecture

Two routes (TanStack Start):

- `/` — Home: hero, "How it works", preset cards, CTA to open the Lab.
- `/lab` — Lab: 3-panel workspace (preset/settings · run viewer/tagging · summary/impact/next fix).

A persistent top bar (theme toggle, Reset to Home, Undo, Redo, mode badge) is shared via a small layout component used by both routes.

## Home screen

- Hero: one-line definition of agent error analysis + 2 supporting sentences. Single primary CTA "Open the Lab" and secondary "Start blank lab".
- "How it works" 4-step strip: Review failed runs → Tag root causes → Count categories → Prioritize fixes. Each step has a small icon + one-line caption.
- Preset grid (4 cards): title, one-line task summary, # of failed runs, top failure tag preview, "Launch" button.
- Footer note about mocked-by-default mode.

## Lab screen

Desktop: 3-panel grid (left 280px · center fluid · right 340px). Tablet: left collapses into a top sheet, right becomes a tab beside the run viewer. Mobile: vertical stack with sticky top actions (preset switcher, tag, next-fix shortcut).

**Left panel — Context & settings**
- Preset selector (dropdown + list of the 4 presets + "Blank lab")
- Task summary card (agent goal, dataset, success criteria)
- Mode toggle: Simulated (default) ↔ Live (advanced) with clear visual badge
- Settings: custom tag manager, clear-session, export JSON

**Center panel — Failed run viewer**
- Run list (scrollable) with failure preview chips
- Selected run shows step trace: each step labeled Thought / Tool call / Observation / Output, with inline labels
- Tagging controls: multi-select failure tags from taxonomy + custom tags, free-text note per run
- "Explain this result" button → opens a beginner-friendly explanation drawer (mocked text per preset; live mode calls LLM)
- Quick actions / example prompts (3–5 per preset) as chips above the trace

**Right panel — Analysis summary**
- Category counts bar (sorted, highest first) with % of failed runs
- Impact estimate per category (mocked weights: frequency × severity)
- Overall failure rate vs grouped root-cause comparison (small inline chart)
- Recommended next fix card: top category, why it matters, suggested action
- Notes pad (auto-saved)

## Failure taxonomy (preloaded tags)

Retrieval failure, Wrong tool selection, Wrong tool arguments, Stale memory, Missing context, Dead-end reasoning, Incomplete execution, Failed recovery, Hallucinated assumption. Users can add custom tags (persisted).

## Presets (preloaded data)

Each preset ships with: task description, 6–10 realistic failed runs with full step traces, pre-suggested tags per run (user can accept/edit), category counts, impact estimates, recommended next fix, and 3–5 example prompts.

1. **RAG Agent Retrieval Failure** — QA over docs; failures dominated by Retrieval failure + Missing context.
2. **Browser Agent Tool Misuse** — Web automation; Wrong tool selection + Wrong tool arguments.
3. **Support Agent Stale Memory** — Multi-turn support; Stale memory + Hallucinated assumption.
4. **Planning Agent Dead-End Reasoning** — Multi-step planning; Dead-end reasoning + Failed recovery.

## Modes

- **Simulated (default):** all outputs, traces, explanations, and recommendations come from preloaded JSON. Badge: "Simulated".
- **Live (optional, advanced):** toggle reveals an "Explain with live model" action that calls Lovable AI Gateway (`google/gemini-2.5-flash`) for the "Explain this result" and "Recommend next fix" actions only. Badge changes to "Live". Everything else stays deterministic. If gateway is unavailable, falls back to simulated with a clear inline notice.

## Undo / Redo / Reset

A single in-memory action stack (capped at 50) records: preset change, mode change, tag add/remove on a run, note edit, custom-tag add/remove, session clear. Undo/Redo buttons in top bar + keyboard shortcuts (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z). Reset returns the user to `/` and restores the initial landing state without deleting built-in presets or custom tags.

## Persistence (localStorage)

Single namespaced key `aeal:v1` storing: `theme`, `mode`, `selectedPresetId`, `runs` (per-preset tag/note overrides), `customTags`, `notes`, `actionHistory` (trimmed), `lastVisitedRoute`. Hydration happens on mount with SSR-safe guards.

## Design system

- Light default; dark variant via `.dark` class on `<html>`, persisted.
- Neutral palette using existing oklch tokens; subtle borders (`border`), soft shadows (`shadow-sm`), generous spacing.
- Typography: system sans, clear hierarchy (text-3xl hero, text-sm body in dense panels).
- No gradients, no decorative imagery. Icons from `lucide-react` only.
- Components reuse shadcn/ui: Card, Button, Badge, Tabs, Sheet, Dialog, Tooltip, ScrollArea, Separator, Sonner (toasts), DropdownMenu, Switch, Textarea, Input.

## Accessibility

- All interactive elements are real `<button>`/`<a>` with focus rings.
- Color contrast meets WCAG AA in both themes.
- 44px minimum tap targets on mobile.
- Keyboard shortcuts documented in a "?" help dialog.
- ARIA labels on icon-only buttons; live region announces undo/redo and tag changes.

## Technical notes

- Routes: `src/routes/index.tsx` (Home), `src/routes/lab.tsx` (Lab). Each sets its own `head()` metadata.
- Shared shell with top bar lives in a `<AppShell>` component used inside both route components (not a layout route, since the two pages differ enough and we want a dedicated landing).
- State: a single `useLabStore` (Zustand) with middleware for persistence + undo/redo stack. Theme handled by a small `useTheme` hook writing to `localStorage` and toggling `document.documentElement.classList`.
- Preset data lives in `src/data/presets.ts` as typed JSON-like constants.
- Live mode gated behind a feature flag in the store; calls a small server function `src/routes/api/explain.ts` that proxies to Lovable AI Gateway. Falls back gracefully when not configured.
- No authentication, no database.

## Out of scope

- User accounts, sharing, multi-device sync.
- Editing preset traces (users can add tags/notes; trace content is read-only).
- Real agent execution — this is an analysis lab, not an agent runner.
