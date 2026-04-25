import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/HomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agent Error Analysis Lab — Debug agent failures with structure" },
      {
        name: "description",
        content:
          "A calm sandbox for Andrew Ng-style error analysis on agentic workflows. Inspect failed runs, tag root causes, and prioritize fixes.",
      },
      { property: "og:title", content: "Agent Error Analysis Lab" },
      {
        property: "og:description",
        content:
          "Inspect failed agent runs, tag root causes, and decide what to fix next. Mocked-by-default, works offline.",
      },
    ],
  }),
  component: HomeScreen,
});
