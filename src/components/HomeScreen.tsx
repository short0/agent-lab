import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, Tags, BarChart3, Wrench, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRESETS } from "@/data/presets";
import { useLabStore } from "@/store/labStore";

export function HomeScreen() {
  const selectPreset = useLabStore((s) => s.selectPreset);

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-7xl px-4 pt-12 pb-8 sm:pt-20 sm:pb-12">
        <div className="max-w-2xl">
          <Badge variant="outline" className="mb-4 font-normal">
            <Sparkles className="mr-1.5 h-3 w-3" />
            Andrew Ng-style error analysis, for agents
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Stop guessing why your agent fails.
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Inspect failed agent runs, tag the root cause, and see which fix will move the needle.
            A calm sandbox for learning structured error analysis — works fully offline with
            realistic mocked data.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/lab" onClick={() => selectPreset(PRESETS[0].id)}>
                Open the Lab
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/lab" onClick={() => selectPreset(null)}>
                Start blank lab
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-12">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          How it works
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Search, title: "Review failed runs", body: "Read the full step trace, not just pass/fail." },
            { icon: Tags, title: "Tag root causes", body: "Use a shared taxonomy or your own labels." },
            { icon: BarChart3, title: "Count categories", body: "See which failure types dominate." },
            { icon: Wrench, title: "Prioritize fixes", body: "Focus on the change with the biggest impact." },
          ].map((s, i) => (
            <Card key={i} className="border-border/60 shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                    <s.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs text-muted-foreground">Step {i + 1}</span>
                </div>
                <CardTitle className="mt-2 text-base font-medium">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">{s.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Presets
          </h2>
          <span className="text-xs text-muted-foreground">Click any card to launch the Lab</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PRESETS.map((p) => {
            const topTag = p.recommendedFix.category;
            return (
              <Link
                key={p.id}
                to="/lab"
                onClick={() => selectPreset(p.id)}
                className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-medium">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.shortDescription}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {p.runs.length} failed runs
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    Top tag: {topTag}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          Mocked data by default — no API key required. Toggle Live mode in the Lab to use a real
          model for explanations.
        </p>
      </section>
    </AppShell>
  );
}
