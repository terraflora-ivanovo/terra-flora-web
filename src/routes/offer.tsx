import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SitePage";

export const Route = createFileRoute("/offer")({
  head: () => ({
    meta: [
      { title: "Публичная оферта — terra flora" },
      { name: "description", content: "Публичная оферта terra flora." },
    ],
    links: [{ rel: "canonical", href: "/offer" }],
  }),
  component: OfferPage,
});

function OfferPage() {
  return <SitePage title="Публичная оферта" />;
}
