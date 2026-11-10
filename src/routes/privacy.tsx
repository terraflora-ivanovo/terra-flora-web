import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  beforeLoad: () => {
    throw redirect({ to: "/s/$slug/privacy", params: { slug: "terra-flora" } });
  },
});
