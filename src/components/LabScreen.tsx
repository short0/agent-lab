import { useMemo, useState } from "react";
import {
  ChevronDown,
  Settings2,
  Sparkles,
  X,
  Plus,
  RotateCcw,
  Info,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PRESETS, TAXONOMY, type FailureTag, type StepKind } from "@/data/presets";
import { getCategoryCounts, getPreset, useLabStore } from "@/store/labStore";

const STEP_LABELS: Record<StepKind, { label: string; tone: string }> = {
  thought: { label: "Thought", tone: "bg-muted text-muted-foreground" },
  tool_call: { label: "Tool call", tone: "bg-primary/10 text-primary" },
  observation: { label: "Observation", tone: "bg-accent text-accent-foreground" },
  output: { label: "Output", tone: "bg-secondary text-secondary-foreground" },
};

export function LabScreen() {
  const selectedPresetId = useLabStore((s) => s.selectedPresetId);
  const preset = getPreset(selectedPresetId);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6">
        {/* Mobile / tablet: tabs. Desktop: 3 columns */}
        <div className="lg:hidden">
          <Tabs defaultValue="runs">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="runs">Runs</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>
            <TabsContent value="context" className="mt-4">
              <ContextPanel />
            </TabsContent>
            <TabsContent value="runs" className="mt-4">
              {preset ? <RunViewer /> : <BlankState />}
            </TabsContent>
            <TabsContent value="analysis" className="mt-4">
              {preset ? <AnalysisPanel /> : <BlankState />}
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[280px_1fr_340px] lg:gap-4">
          <ContextPanel />
          {preset ? <RunViewer /> : <BlankState />}
          {preset ? <AnalysisPanel /> : <div />}
        </div>
      </div>
    </AppShell>
  );
}

function BlankState() {
  const selectPreset = useLabStore((s) => s.selectPreset);
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium">Pick a preset to begin</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Each preset preloads failed runs, suggested tags, and recommendations.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {PRESETS.map((p) => (
            <Button key={p.id} variant="outline" size="sm" onClick={() => selectPreset(p.id)}>
              {p.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContextPanel() {
  const selectedPresetId = useLabStore((s) => s.selectedPresetId);
  const selectPreset = useLabStore((s) => s.selectPreset);
  const mode = useLabStore((s) => s.mode);
  const setMode = useLabStore((s) => s.setMode);
  const customTags = useLabStore((s) => s.customTags);
  const addGlobalCustomTag = useLabStore((s) => s.addGlobalCustomTag);
  const removeGlobalCustomTag = useLabStore((s) => s.removeGlobalCustomTag);
  const resetSession = useLabStore((s) => s.resetSession);
  const runStates = useLabStore((s) => s.runStates);

  const preset = getPreset(selectedPresetId);
  const [newTag, setNewTag] = useState("");

  const exportJson = () => {
    const payload = { selectedPresetId, mode, customTags, runStates };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aeal-session.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Preset</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between font-normal">
                <span className="truncate">{preset ? preset.name : "Choose a preset…"}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[260px]" align="start">
              <DropdownMenuLabel>Built-in presets</DropdownMenuLabel>
              {PRESETS.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => selectPreset(p.id)}>
                  {p.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => selectPreset(null)}>Blank lab</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {preset && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs">
              <Field label="Task">{preset.task}</Field>
              <Field label="Success criteria">{preset.successCriteria}</Field>
              <Field label="Dataset">{preset.dataset}</Field>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {mode === "live" ? "Live model" : "Simulated"}
              </span>
              <span className="text-xs text-muted-foreground">
                {mode === "live"
                  ? "Explanations call a real model when configured."
                  : "All output is preloaded — no network calls."}
              </span>
            </div>
            <Switch
              checked={mode === "live"}
              onCheckedChange={(c) => setMode(c ? "live" : "simulated")}
              aria-label="Toggle live mode"
            />
          </div>
          {mode === "live" && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Live mode is advanced. If no model is configured, the app falls back to simulated
                explanations.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Settings2 className="h-3.5 w-3.5" /> Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <p className="mb-2 text-xs font-medium">Custom tags</p>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g. Wrong format"
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTag.trim()) {
                    addGlobalCustomTag(newTag.trim());
                    setNewTag("");
                  }
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (newTag.trim()) {
                    addGlobalCustomTag(newTag.trim());
                    setNewTag("");
                  }
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {customTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {customTags.map((t) => (
                  <Badge key={t} variant="secondary" className="font-normal">
                    {t}
                    <button
                      className="ml-1 opacity-60 hover:opacity-100"
                      onClick={() => removeGlobalCustomTag(t)}
                      aria-label={`Remove ${t}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={exportJson}>
              Export JSON
            </Button>
            <Button size="sm" variant="ghost" onClick={resetSession}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Clear session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-foreground">{children}</div>
    </div>
  );
}

function RunViewer() {
  const selectedPresetId = useLabStore((s) => s.selectedPresetId)!;
  const selectedRunId = useLabStore((s) => s.selectedRunId);
  const selectRun = useLabStore((s) => s.selectRun);
  const runStates = useLabStore((s) => s.runStates);
  const toggleTag = useLabStore((s) => s.toggleTag);
  const setRunNote = useLabStore((s) => s.setRunNote);
  const customTags = useLabStore((s) => s.customTags);
  const addCustomTagToRun = useLabStore((s) => s.addCustomTagToRun);
  const removeCustomTagFromRun = useLabStore((s) => s.removeCustomTagFromRun);
  const mode = useLabStore((s) => s.mode);

  const preset = getPreset(selectedPresetId)!;
  const run = preset.runs.find((r) => r.id === selectedRunId) ?? preset.runs[0];
  const state = runStates[`${preset.id}:${run.id}`] ?? { tags: [], customTags: [], note: "" };

  const [explainOpen, setExplainOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5">
        {preset.examplePrompts.map((p) => (
          <Badge
            key={p}
            variant="outline"
            className="cursor-pointer font-normal hover:bg-accent"
            onClick={() => setExplainOpen(true)}
          >
            {p}
          </Badge>
        ))}
      </div>

      {/* Run list */}
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Failed runs ({preset.runs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="max-h-[180px]">
            <div className="space-y-1 pr-2">
              {preset.runs.map((r) => {
                const active = r.id === run.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => selectRun(r.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "border-foreground/30 bg-accent"
                        : "border-transparent hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{r.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {(runStates[`${preset.id}:${r.id}`]?.tags.length ?? 0)} tags
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected run */}
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base font-medium">{run.title}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Run {run.id}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setExplainOpen(true)}>
              <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
              Explain this result
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Input">{run.input}</Field>
            <Field label="Expected">{run.expected}</Field>
            <Field label="Actual">
              <span className="text-destructive">{run.actual}</span>
            </Field>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Info className="h-3 w-3" />
              Run trace
            </div>
            <ol className="space-y-2">
              {run.trace.map((step, i) => (
                <li key={i} className="flex gap-3 rounded-md border p-2.5">
                  <span
                    className={`h-fit shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STEP_LABELS[step.kind].tone}`}
                  >
                    {STEP_LABELS[step.kind].label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">{step.label}</div>
                    <div className="mt-0.5 break-words font-mono text-xs text-muted-foreground">
                      {step.content}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Separator />

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Failure tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TAXONOMY.map((tag) => {
                const active = state.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(preset.id, run.id, tag)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            {customTags.length > 0 && (
              <div className="mt-3">
                <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Your tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {customTags.map((tag) => {
                    const active = state.customTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() =>
                          active
                            ? removeCustomTagFromRun(preset.id, run.id, tag)
                            : addCustomTagToRun(preset.id, run.id, tag)
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-dashed border-border hover:bg-accent"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Notes for this run
            </div>
            <Textarea
              value={state.note}
              onChange={(e) => setRunNote(preset.id, run.id, e.target.value)}
              placeholder="What did you learn from this failure?"
              className="min-h-[64px] text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={explainOpen} onOpenChange={setExplainOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Why did this run fail?
            </DialogTitle>
            <DialogDescription>
              {mode === "live"
                ? "Live mode would call a real model. Showing the simulated explanation:"
                : "Beginner-friendly explanation based on the trace."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="leading-relaxed">{run.explanation}</p>
            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Suggested tags:</span>{" "}
              {run.suggestedTags.join(", ")}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnalysisPanel() {
  const selectedPresetId = useLabStore((s) => s.selectedPresetId)!;
  const runStates = useLabStore((s) => s.runStates);
  const globalNotes = useLabStore((s) => s.globalNotes);
  const setGlobalNotes = useLabStore((s) => s.setGlobalNotes);

  const preset = getPreset(selectedPresetId)!;
  const counts = useMemo(() => getCategoryCounts(preset, runStates), [preset, runStates]);
  const totalRuns = preset.runs.length;
  const max = counts[0]?.count ?? 1;
  const taggedRuns = preset.runs.filter((r) => {
    const st = runStates[`${preset.id}:${r.id}`];
    return (st?.tags.length ?? 0) + (st?.customTags.length ?? 0) > 0;
  }).length;

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Failure rate vs root causes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Failed runs</div>
              <div className="mt-1 text-2xl font-semibold">{totalRuns}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Tagged</div>
              <div className="mt-1 text-2xl font-semibold">
                {taggedRuns}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  / {totalRuns}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pass/fail tells you <em>how often</em> things break. Categories tell you{" "}
            <em>why</em> — that's where fixes come from.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Categories by impact
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {counts.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Tag some runs to see categories appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {counts.map((c) => {
                const pct = totalRuns > 0 ? Math.round((c.count / totalRuns) * 100) : 0;
                const w = (c.count / max) * 100;
                return (
                  <li key={c.tag}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-medium">{c.tag}</span>
                      <span className="text-muted-foreground">
                        {c.count} · {pct}% · impact {c.impact}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-foreground/70"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
            Recommended next fix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm">
          <div>
            <Badge variant="outline" className="font-normal">
              {preset.recommendedFix.category}
            </Badge>
          </div>
          <p className="text-muted-foreground">{preset.recommendedFix.why}</p>
          <div className="rounded-md border bg-accent/40 p-3 text-foreground">
            {preset.recommendedFix.action}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            value={globalNotes}
            onChange={(e) => setGlobalNotes(e.target.value)}
            placeholder="Capture cross-run insights here…"
            className="min-h-[100px] text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// local Wrench icon import (avoid duplicate) — re-export from lucide
import { Wrench } from "lucide-react";
// satisfy linter for unused FailureTag import
export type _Tag = FailureTag;
