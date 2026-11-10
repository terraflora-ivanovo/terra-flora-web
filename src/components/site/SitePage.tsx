import type { ReactNode } from "react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

type SitePageProps = {
  title: string;
  children?: ReactNode;
};

export function SitePage({ title, children }: SitePageProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col text-foreground">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pb-20 pt-14 lg:px-10">
        <h1 className="hyphens-auto break-words text-center font-display text-3xl font-light tracking-tight text-primary md:text-5xl">
          {title}
        </h1>
        <div className="mx-auto mt-14 w-full max-w-3xl space-y-4 font-light leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
