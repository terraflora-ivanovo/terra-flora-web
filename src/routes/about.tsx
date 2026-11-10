import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  beforeLoad: () => {
    throw redirect({ to: "/s/$slug/about", params: { slug: "terra-flora" } });
  },
});
