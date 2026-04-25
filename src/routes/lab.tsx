import { createFileRoute } from "@tanstack/react-router";
import { LabScreen } from "@/components/LabScreen";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: "Lab — Agent Error Analysis" },
      {
        name: "description",
        content:
          "Three-panel workspace to review failed agent runs, tag failure categories, and review recommended fixes.",
      },
      { property: "og:title", content: "Lab — Agent Error Analysis" },
      {
        property: "og:description",
        content:
          "Review failed agent runs, tag failure categories, and review recommended fixes.",
      },
    ],
  }),
  component: LabScreen,
});
