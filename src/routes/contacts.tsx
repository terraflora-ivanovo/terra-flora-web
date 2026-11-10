import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/contacts")({
  beforeLoad: () => {
    throw redirect({ to: "/s/$slug/contacts", params: { slug: "terra-flora" } });
  },
});
