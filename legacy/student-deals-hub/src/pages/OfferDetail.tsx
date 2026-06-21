import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

const OfferDetail = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(0deg, #FCF8FE, #FCF8FE), hsl(var(--background))" }}
    >
      <Navbar />

      <main className="container flex-1 py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-2xl space-y-6 lg:max-w-4xl lg:space-y-10 xl:max-w-5xl">
          {/* Concept notice */}
          <div className="rounded-3xl bg-[#ECEAF7] px-8 py-10 text-center sm:px-12 lg:px-20 lg:py-16">
            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-5xl xl:text-6xl">
              {t("offerDetail.concept.title")}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base lg:mt-6 lg:max-w-2xl lg:text-lg">
              {t("offerDetail.concept.body")}
            </p>
          </div>

          {/* Status card */}
          <div className="rounded-3xl bg-card px-8 py-12 text-center shadow-sm sm:px-12 lg:px-20 lg:py-20">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : user ? (
              <>
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full lg:h-20 lg:w-20"
                  style={{ backgroundColor: "#6FFBBE" }}
                >
                  <Check className="h-6 w-6 text-emerald-950 lg:h-9 lg:w-9" strokeWidth={3} />
                </div>
                <h2 className="mt-6 font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl lg:mt-8 lg:text-4xl">
                  {t("offerDetail.member.title")}
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground lg:mt-5 lg:max-w-xl lg:text-lg">
                  {t("offerDetail.member.body")}
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground sm:text-2xl lg:text-4xl">
                  {t("offerDetail.guest.title")}
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground lg:mt-5 lg:max-w-xl lg:text-lg">
                  {t("offerDetail.guest.body")}
                </p>
                <div className="mt-6 flex justify-center lg:mt-8">
                  <Link to="/signup">
                    <Button size="lg" className="rounded-xl font-display text-base gap-2 px-8 lg:h-14 lg:px-10 lg:text-lg">
                      {t("offerDetail.guest.cta")}
                      <ArrowRight size={18} />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Back link */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => navigate("/offers")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:opacity-80 lg:text-base"
            >
              <ArrowLeft size={16} />
              {t("offerDetail.back")}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OfferDetail;
