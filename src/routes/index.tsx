import { createFileRoute, redirect } from "@tanstack/react-router";

const defaultSlug = (import.meta.env.VITE_DEFAULT_TENANT_SLUG as string | undefined) || "terra-flora";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({
      to: "/s/$slug",
      params: { slug: defaultSlug },
    });
  },
});