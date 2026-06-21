import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";

interface LegalPageProps {
  title: string;
  updatedOn: string;
  intro?: string;
  children: ReactNode;
}

const LegalPage = ({ title, updatedOn, intro, children }: LegalPageProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-3xl py-12 md:py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Unidealz · Legal
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {updatedOn}
          </p>
          {intro && (
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              {intro}
            </p>
          )}
        </header>

        <article className="rounded-2xl border bg-card p-6 shadow-sm md:p-10">
          <div className="legal-prose space-y-8 text-[15px] leading-relaxed text-foreground">
            {children}
          </div>
        </article>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Questions? Contact us at{" "}
          <a href="mailto:hello@unidealz.gr" className="text-primary hover:underline">
            hello@unidealz.gr
          </a>
        </p>
      </main>
      <Footer />
    </div>
  );
};

interface SectionProps {
  id?: string;
  title: string;
  children: ReactNode;
}

export const LegalSection = ({ id, title, children }: SectionProps) => (
  <section id={id} className="space-y-3">
    <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
      {title}
    </h2>
    <div className="space-y-3 text-muted-foreground">{children}</div>
  </section>
);

export default LegalPage;
