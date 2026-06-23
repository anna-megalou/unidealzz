import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import logo from "@/assets/logo.png";

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="border-t bg-card">
      <div className="container py-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <Link to="/student-hub" className="flex items-center gap-2.5">
              <img src={logo} alt="Unidealz" className="h-8 w-8 rounded-md" />
              <span className="font-display text-xl font-bold text-primary">Unidealz</span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
