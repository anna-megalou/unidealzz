import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, UserCircle, LogOut, Globe } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isStaff, signOut } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const links = [
    ...(user ? [{ to: "/student-hub", label: t("nav.studentHub") }] : []),
    ...(isStaff ? [{ to: "/operations", label: t("nav.operations") }] : []),
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success(t("common.loggedOut"));
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to={user ? "/student-hub" : "/login"} className="flex items-center gap-2 font-display text-xl font-bold text-foreground tracking-tight">
            <img src={logo} alt="Unidealz logo" className="h-7 w-7 rounded-md" />
            Unidealz
          </Link>

          <div className="hidden items-center gap-6 sm:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname.startsWith(l.to) ? "text-primary underline underline-offset-4" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          <button
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="flex items-center gap-1 rounded-full border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe size={14} />
            {language === "en" ? "EN" : "GR"}
          </button>
          {user ? (
            <button onClick={handleLogout} aria-label="Log out" className="text-muted-foreground hover:text-foreground">
              <LogOut size={20} />
            </button>
          ) : (
            <Link to="/login">
              <UserCircle size={20} className="text-muted-foreground" />
            </Link>
          )}
        </div>

        <button className="sm:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background sm:hidden">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-colors hover:bg-muted ${
                location.pathname.startsWith(l.to) ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => { toggleLanguage(); }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground"
          >
            <Globe size={16} />
            {t("nav.languageLabel")}: {language === "en" ? t("nav.languageEn") : t("nav.languageEl")}
          </button>
          {user ? (
            <button onClick={() => { setOpen(false); handleLogout(); }} className="block w-full px-4 py-3 text-left text-sm font-medium text-primary">
              {t("nav.logout")}
            </button>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm font-medium text-muted-foreground">{t("nav.login")}</Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="block px-4 py-3 text-sm font-medium text-primary">{t("nav.signup")}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
