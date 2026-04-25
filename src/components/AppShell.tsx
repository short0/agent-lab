import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Moon, Sun, Undo2, Redo2, Home, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLabStore } from "@/store/labStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrate = useLabStore((s) => s.hydrate);
  const hydrated = useLabStore((s) => s.hydrated);
  const theme = useLabStore((s) => s.theme);
  const toggleTheme = useLabStore((s) => s.toggleTheme);
  const undo = useLabStore((s) => s.undo);
  const redo = useLabStore((s) => s.redo);
  const past = useLabStore((s) => s.past.length);
  const future = useLabStore((s) => s.future.length);
  const mode = useLabStore((s) => s.mode);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-medium tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-card">
              <FlaskConical className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Agent Error Analysis Lab</span>
            <span className="sm:hidden">AEAL</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="hidden sm:inline-flex font-normal"
              aria-label={`Mode: ${mode}`}
            >
              <span
                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                  mode === "live" ? "bg-destructive" : "bg-muted-foreground"
                }`}
              />
              {mode === "live" ? "Live" : "Simulated"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={past === 0}
              aria-label="Undo"
              title="Undo (⌘Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={future === 0}
              aria-label="Redo"
              title="Redo (⇧⌘Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Home">
              <Link to="/">
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
