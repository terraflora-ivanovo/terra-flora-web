import type { ReactNode } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

type SitePageProps = {
  title: string;
  children?: ReactNode;
};

export function SitePage({ title, children }: SitePageProps) {
  return (
    <div className="flex min-h-screen flex-col text-foreground">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-grow flex-col px-6 pb-20 pt-14 lg:px-10">
        <h1 className="break-words hyphens-auto text-center font-display text-3xl font-light tracking-tight text-primary md:text-5xl">
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
