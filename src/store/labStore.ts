import { create } from "zustand";
import { PRESETS, SEVERITY, type FailureTag, type Preset } from "@/data/presets";

export type Mode = "simulated" | "live";
export type Theme = "light" | "dark";

export type RunState = {
  tags: FailureTag[];
  customTags: string[];
  note: string;
};

export type LabState = {
  // persisted
  theme: Theme;
  mode: Mode;
  selectedPresetId: string | null;
  selectedRunId: string | null;
  runStates: Record<string, RunState>; // key: `${presetId}:${runId}`
  customTags: string[];
  globalNotes: string;
};

type Snapshot = LabState;

type Store = LabState & {
  past: Snapshot[];
  future: Snapshot[];
  hydrated: boolean;
  // actions
  hydrate: () => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setMode: (m: Mode) => void;
  selectPreset: (id: string | null) => void;
  selectRun: (id: string | null) => void;
  toggleTag: (presetId: string, runId: string, tag: FailureTag) => void;
  addCustomTagToRun: (presetId: string, runId: string, tag: string) => void;
  removeCustomTagFromRun: (presetId: string, runId: string, tag: string) => void;
  setRunNote: (presetId: string, runId: string, note: string) => void;
  addGlobalCustomTag: (tag: string) => void;
  removeGlobalCustomTag: (tag: string) => void;
  setGlobalNotes: (n: string) => void;
  resetSession: () => void;
  resetToHome: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

const STORAGE_KEY = "aeal:v1";
const HISTORY_LIMIT = 50;

const initialState = (): LabState => ({
  theme: "light",
  mode: "simulated",
  selectedPresetId: null,
  selectedRunId: null,
  runStates: seedRunStates(),
  customTags: [],
  globalNotes: "",
});

function seedRunStates(): Record<string, RunState> {
  const out: Record<string, RunState> = {};
  for (const p of PRESETS) {
    for (const r of p.runs) {
      out[`${p.id}:${r.id}`] = { tags: [...r.suggestedTags], customTags: [], note: "" };
    }
  }
  return out;
}

function snapshot(s: LabState): Snapshot {
  return JSON.parse(JSON.stringify(s));
}

function persist(s: LabState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function loadPersisted(): Partial<LabState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const useLabStore = create<Store>((set, get) => {
  const pushHistory = (mutator: (s: LabState) => Partial<LabState>) => {
    const current = get();
    const before = snapshot({
      theme: current.theme,
      mode: current.mode,
      selectedPresetId: current.selectedPresetId,
      selectedRunId: current.selectedRunId,
      runStates: current.runStates,
      customTags: current.customTags,
      globalNotes: current.globalNotes,
    });
    const patch = mutator(before);
    const next = { ...before, ...patch };
    const past = [...current.past, before].slice(-HISTORY_LIMIT);
    set({ ...patch, past, future: [] });
    persist(next);
  };

  return {
    ...initialState(),
    past: [],
    future: [],
    hydrated: false,

    hydrate: () => {
      if (get().hydrated) return;
      const persisted = loadPersisted();
      const base = initialState();
      const merged: LabState = persisted
        ? {
            ...base,
            ...persisted,
            // ensure run states exist for all built-in runs
            runStates: { ...base.runStates, ...(persisted.runStates ?? {}) },
          }
        : base;
      set({ ...merged, hydrated: true, past: [], future: [] });
      // apply theme to <html>
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", merged.theme === "dark");
      }
    },

    setTheme: (t) => {
      set({ theme: t });
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", t === "dark");
      }
      persist({ ...get(), theme: t });
    },
    toggleTheme: () => get().setTheme(get().theme === "light" ? "dark" : "light"),

    setMode: (m) => pushHistory(() => ({ mode: m })),

    selectPreset: (id) =>
      pushHistory(() => ({
        selectedPresetId: id,
        selectedRunId: id ? PRESETS.find((p) => p.id === id)?.runs[0]?.id ?? null : null,
      })),

    selectRun: (id) => {
      // run selection is navigational, not history-worthy
      set({ selectedRunId: id });
      persist({ ...get(), selectedRunId: id });
    },

    toggleTag: (presetId, runId, tag) =>
      pushHistory((s) => {
        const key = `${presetId}:${runId}`;
        const cur = s.runStates[key] ?? { tags: [], customTags: [], note: "" };
        const has = cur.tags.includes(tag);
        const tags = has ? cur.tags.filter((t) => t !== tag) : [...cur.tags, tag];
        return { runStates: { ...s.runStates, [key]: { ...cur, tags } } };
      }),

    addCustomTagToRun: (presetId, runId, tag) =>
      pushHistory((s) => {
        const key = `${presetId}:${runId}`;
        const cur = s.runStates[key] ?? { tags: [], customTags: [], note: "" };
        if (!tag.trim() || cur.customTags.includes(tag)) return {};
        return {
          runStates: { ...s.runStates, [key]: { ...cur, customTags: [...cur.customTags, tag] } },
        };
      }),

    removeCustomTagFromRun: (presetId, runId, tag) =>
      pushHistory((s) => {
        const key = `${presetId}:${runId}`;
        const cur = s.runStates[key] ?? { tags: [], customTags: [], note: "" };
        return {
          runStates: {
            ...s.runStates,
            [key]: { ...cur, customTags: cur.customTags.filter((t) => t !== tag) },
          },
        };
      }),

    setRunNote: (presetId, runId, note) =>
      pushHistory((s) => {
        const key = `${presetId}:${runId}`;
        const cur = s.runStates[key] ?? { tags: [], customTags: [], note: "" };
        return { runStates: { ...s.runStates, [key]: { ...cur, note } } };
      }),

    addGlobalCustomTag: (tag) =>
      pushHistory((s) => {
        if (!tag.trim() || s.customTags.includes(tag)) return {};
        return { customTags: [...s.customTags, tag] };
      }),

    removeGlobalCustomTag: (tag) =>
      pushHistory((s) => ({ customTags: s.customTags.filter((t) => t !== tag) })),

    setGlobalNotes: (n) => pushHistory(() => ({ globalNotes: n })),

    resetSession: () =>
      pushHistory(() => {
        const base = initialState();
        return {
          mode: base.mode,
          selectedPresetId: null,
          selectedRunId: null,
          runStates: seedRunStates(),
          customTags: [],
          globalNotes: "",
        };
      }),

    resetToHome: () =>
      pushHistory(() => ({ selectedPresetId: null, selectedRunId: null })),

    undo: () => {
      const { past, future } = get();
      if (past.length === 0) return;
      const prev = past[past.length - 1];
      const current = snapshot({
        theme: get().theme,
        mode: get().mode,
        selectedPresetId: get().selectedPresetId,
        selectedRunId: get().selectedRunId,
        runStates: get().runStates,
        customTags: get().customTags,
        globalNotes: get().globalNotes,
      });
      set({ ...prev, past: past.slice(0, -1), future: [...future, current] });
      persist(prev);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", prev.theme === "dark");
      }
    },

    redo: () => {
      const { future, past } = get();
      if (future.length === 0) return;
      const next = future[future.length - 1];
      const current = snapshot({
        theme: get().theme,
        mode: get().mode,
        selectedPresetId: get().selectedPresetId,
        selectedRunId: get().selectedRunId,
        runStates: get().runStates,
        customTags: get().customTags,
        globalNotes: get().globalNotes,
      });
      set({ ...next, past: [...past, current], future: future.slice(0, -1) });
      persist(next);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next.theme === "dark");
      }
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  };
});

export function getPreset(id: string | null): Preset | null {
  if (!id) return null;
  return PRESETS.find((p) => p.id === id) ?? null;
}

export function getCategoryCounts(
  preset: Preset,
  runStates: Record<string, RunState>,
): { tag: FailureTag | string; count: number; impact: number }[] {
  const counts: Record<string, number> = {};
  for (const r of preset.runs) {
    const st = runStates[`${preset.id}:${r.id}`];
    const all = [...(st?.tags ?? []), ...(st?.customTags ?? [])];
    for (const t of all) counts[t] = (counts[t] ?? 0) + 1;
  }
  const entries = Object.entries(counts).map(([tag, count]) => {
    const sev = (SEVERITY as Record<string, number>)[tag] ?? 0.5;
    return { tag, count, impact: Math.round(count * sev * 100) / 100 };
  });
  return entries.sort((a, b) => b.impact - a.impact);
}
