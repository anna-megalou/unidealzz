import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Heart,
  User,
  HelpCircle,
  Settings,
  LogOut,
  Sparkles,
  Plus,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/home/Footer";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ExperienceComposer } from "@/components/experiences/ExperienceComposer";
import { useLanguage } from "@/hooks/useLanguage";
import type { TranslationKey } from "@unidealz/shared";

const nav: { to: string; labelKey: TranslationKey; icon: any; end?: boolean }[] = [
  { to: "/student-hub", labelKey: "hub.sidebar.dashboard", icon: LayoutGrid, end: true },
  { to: "/student-hub/saved", labelKey: "hub.sidebar.saved", icon: Heart },
  { to: "/student-hub/experiences", labelKey: "hub.sidebar.experiences", icon: Sparkles },
  { to: "/student-hub/account", labelKey: "hub.sidebar.account", icon: User },
  { to: "/contact", labelKey: "hub.sidebar.support", icon: HelpCircle },
];

interface Props {
  children: ReactNode;
}

const StudentHubLayout = ({ children }: Props) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [composerOpen, setComposerOpen] = useState(false);
  const handleLogout = async () => {
    await signOut();
    toast.success(t("hub.sidebar.loggedOut"));
    navigate("/");
  };
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(280_50%_98%)]">
      <Navbar />
      <div className="container flex flex-1 gap-8 py-8">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <div className="mb-8">
              <h2 className="font-display text-xl font-bold text-foreground">
                {t("hub.sidebar.portal")}
              </h2>
              <p className="text-xs text-muted-foreground">{t("hub.sidebar.partner")}</p>
            </div>

            <nav className="space-y-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                >
                  <item.icon size={18} />
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>

            <div className="my-6 border-t" />

            <div className="space-y-1">
              <NavLink
                to="/student-hub/settings"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <Settings size={18} />
                {t("hub.sidebar.settings")}
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut size={18} />
                {t("hub.sidebar.logout")}
              </button>

              <button
                onClick={() => setComposerOpen(true)}
                className="mt-2 flex w-full items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus size={18} />
                {t("hub.sidebar.post")}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <Footer />

      <ExperienceComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onPosted={() => setComposerOpen(false)}
      />
    </div>
  );
};

export default StudentHubLayout;
