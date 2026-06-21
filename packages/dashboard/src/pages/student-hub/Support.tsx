import { Link } from "react-router-dom";
import StudentHubLayout from "@/components/student-hub/StudentHubLayout";
import { supportTopics } from "@/data/studentHub";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail } from "lucide-react";

const Support = () => {
  return (
    <StudentHubLayout>
      <header className="mb-8">
        <h1 className="font-display text-4xl font-bold text-foreground">Support</h1>
        <p className="mt-2 text-muted-foreground">Answers to common questions, plus a way to reach our team.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl bg-card p-6 ring-1 ring-border lg:col-span-2">
          <h2 className="font-display text-xl font-bold text-foreground">Frequently asked</h2>
          <Accordion type="single" collapsible className="mt-4">
            {supportTopics.map((t, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {t.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {t.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <MessageCircle size={24} />
            <h3 className="mt-4 font-display text-lg font-bold">Live chat</h3>
            <p className="mt-1 text-sm opacity-90">Avg. reply under 2 minutes during weekdays.</p>
            <Button variant="secondary" className="mt-4 w-full rounded-full font-semibold text-primary">
              Start a chat
            </Button>
          </div>
          <Link to="/contact" className="rounded-2xl bg-card p-6 ring-1 ring-border transition-colors hover:bg-muted/50">
            <Mail size={22} className="text-primary" />
            <h3 className="mt-3 font-display text-lg font-bold text-foreground">Email</h3>
            <p className="mt-1 text-sm text-muted-foreground">support@unidealz.com</p>
          </Link>
        </aside>
      </div>
    </StudentHubLayout>
  );
};

export default Support;
