import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности — terra flora" },
      { name: "description", content: "Политика конфиденциальности terra flora." },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <SitePage title="Политика конфиденциальности" />;
}
