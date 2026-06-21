import { Search, MousePointerClick, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@/i18n/translations";

const HowItWorksSection = () => {
  const { t } = useLanguage();
  const steps: { icon: JSX.Element; step: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
    { icon: <Search size={24} />, step: "1", titleKey: "how.step1.title", descKey: "how.step1.desc" },
    { icon: <MousePointerClick size={24} />, step: "2", titleKey: "how.step2.title", descKey: "how.step2.desc" },
    { icon: <BadgeCheck size={24} />, step: "3", titleKey: "how.step3.title", descKey: "how.step3.desc" },
  ];

  return (
    <section id="how-it-works" className="border-t bg-muted/30 py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("how.title")}
          </h2>
          <p className="mt-3 mx-auto max-w-md text-sm text-muted-foreground">
            {t("how.subtitle")}
          </p>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-3">
          <div className="absolute top-10 left-[16.67%] right-[16.67%] hidden h-0.5 bg-primary/20 sm:block" />

          {steps.map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.step}
                </span>
              </div>
              <h3 className="mt-2 font-display text-lg font-bold text-foreground">{t(item.titleKey)}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
