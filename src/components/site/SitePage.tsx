import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

type SitePageProps = {
  title: string;
};

export function SitePage({ title }: SitePageProps) {
  return (
    <div className="min-h-screen text-foreground">
      <Header />
      <main className="mx-auto flex min-h-[50vh] max-w-7xl flex-col px-6 pb-20 pt-14 lg:px-10">
        <h1 className="text-center font-display text-5xl font-light tracking-tight text-primary sm:text-6xl">
          {title}
        </h1>
        <div className="mx-auto mt-14 w-full max-w-3xl flex-1 font-light text-muted-foreground" />
      </main>
      <Footer />
    </div>
  );
}
