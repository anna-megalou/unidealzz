import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { X, Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useOffers";
import { callChatAssistant } from "@/lib/firebase";
import { getUserSettings, updateUserSettings } from "@/lib/firestoreData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const GUEST_LIMIT = 2;
const GUEST_KEY = "guest_chat_count_v1";

const HIDDEN_PREFIXES = ["/operations", "/login", "/signup", "/reset-password", "/accept-invite", "/unsubscribe"];

const SUGGESTED: { label: string; prompt: string }[] = [
  { label: "Best deals today", prompt: "What are the best offers right now?" },
  { label: "How verification works", prompt: "How does student verification work?" },
  { label: "Coffee picks", prompt: "Recommend the best coffee offers for me." },
  { label: "Claim an offer", prompt: "How do I claim an offer?" },
];

const BUDGETS = ["Budget-friendly", "Mid-range", "Premium"] as const;
const MODES = ["Online", "In-store", "Both"] as const;

interface ChatAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChatAssistant = ({ open, onOpenChange }: ChatAssistantProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pickedCats, setPickedCats] = useState<string[]>([]);
  const [pickedBudget, setPickedBudget] = useState<string>("");
  const [pickedMode, setPickedMode] = useState<string>("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hidden = HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));

  // Check if logged-in user has been onboarded; if not, show on first open.
  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const settings = await getUserSettings(user.uid);
      if (!settings?.assistantOnboarded) setShowOnboarding(true);
    })();
  }, [open, user]);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0 && !showOnboarding) {
      setMessages([
        {
          role: "assistant",
          content:
            "👋 Hi! I'm your **Unidealz Deals Assistant**. Ask me about offers, brands, or how the platform works — I'll help you find the best student discounts.",
        },
      ]);
    }
  }, [open, messages.length, showOnboarding]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const savePreferences = async () => {
    if (!user) return;
    setSavingPrefs(true);
    try {
      const existing = (await getUserSettings(user.uid)) ?? {};
      await updateUserSettings(user.uid, {
        ...existing,
        assistantOnboarded: true,
        favoriteCategories: pickedCats,
        budgetPreference: pickedBudget || null,
        onlineVsInstore: pickedMode || null,
      });
      setShowOnboarding(false);
      setMessages([
        {
          role: "assistant",
          content: `Got it! I'll personalize picks for **${pickedCats.join(", ") || "you"}**. Want me to recommend a few offers right now?`,
        },
      ]);
    } catch {
      toast.error("Couldn't save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const skipOnboarding = async () => {
    if (user) {
      const existing = (await getUserSettings(user.uid)) ?? {};
      await updateUserSettings(user.uid, { ...existing, assistantOnboarded: true });
    }
    setShowOnboarding(false);
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    // Guest limit: 2 questions for logged-out users
    if (!user) {
      const used = parseInt(localStorage.getItem(GUEST_KEY) || "0", 10);
      if (used >= GUEST_LIMIT) {
        toast.error("Sign in to keep chatting with the assistant.");
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "You've reached the **2-question limit** for guests. [Sign in](/login) or [create an account](/signup) to keep chatting and get personalized picks. ✨",
          },
        ]);
        return;
      }
      localStorage.setItem(GUEST_KEY, String(used + 1));
    }

    setInput("");

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);

    try {
      const { data } = await callChatAssistant({
        messages: next,
        context: {
          path: location.pathname,
          offerId: location.pathname.startsWith("/offers/") ? params.id : undefined,
        },
      });

      setMessages((m) => [...m, { role: "assistant", content: data.reply || "Sorry, I couldn't generate a reply." }]);
    } catch (e) {
      console.error(e);
      toast.error("Assistant error");
    } finally {
      setLoading(false);
    }
  };

  if (hidden) return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border bg-background shadow-2xl animate-scale-in",
            "inset-x-3 bottom-3 top-16 rounded-2xl",
            "sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:max-h-[85vh] sm:w-[400px] sm:rounded-3xl",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="font-display text-sm font-bold leading-tight">Deals Assistant</div>
                <div className="text-[11px] opacity-80">Powered by Unidealz AI</div>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="rounded-full p-1.5 hover:bg-white/15"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          {showOnboarding ? (
            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="font-display text-base font-bold">Quick setup ✨</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick a few preferences so I can tailor offers for you.
              </p>

              <div className="mt-4">
                <div className="text-xs font-semibold text-foreground">Favorite categories</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {categories.map((c: any) => {
                    const active = pickedCats.includes(c.slug);
                    return (
                      <button
                        key={c.id}
                        onClick={() =>
                          setPickedCats((p) =>
                            active ? p.filter((s) => s !== c.slug) : [...p, c.slug],
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:bg-muted",
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-foreground">Budget</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setPickedBudget(b === pickedBudget ? "" : b)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        pickedBudget === b
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-foreground">How do you shop?</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MODES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setPickedMode(m === pickedMode ? "" : m)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        pickedMode === m
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  onClick={savePreferences}
                  disabled={savingPrefs || pickedCats.length === 0}
                  className="flex-1"
                >
                  {savingPrefs ? <Loader2 className="animate-spin" /> : "Save & continue"}
                </Button>
                <Button variant="ghost" onClick={skipOnboarding} disabled={savingPrefs}>
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1">
                <div ref={scrollRef} className="space-y-3 p-4">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex",
                        m.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                            <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-muted px-3.5 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {messages.length <= 1 && (
                    <div className="pt-2">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Try asking
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED.map((s) => (
                          <button
                            key={s.label}
                            onClick={() => send(s.prompt)}
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:bg-muted"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Composer */}
              <div className="border-t bg-background p-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Ask about offers, brands, or how it works…"
                    rows={1}
                    className="min-h-[40px] max-h-32 resize-none rounded-xl text-sm"
                  />
                  <Button
                    size="icon"
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    className="h-10 w-10 shrink-0 rounded-xl"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Send size={16} />}
                  </Button>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <Badge variant="outline" className="h-5 text-[10px]">AI assistant</Badge>
                  <button
                    onClick={() => navigate("/contact")}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Need a human? Contact support
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
