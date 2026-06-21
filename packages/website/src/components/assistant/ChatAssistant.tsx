import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategories } from '@/hooks/queries';
import { callChatAssistant } from '@/lib/firebase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { dashboardLoginUrl, dashboardSignupUrl } from '@/lib/dashboardUrl';

type Msg = { role: 'user' | 'assistant'; content: string };

const GUEST_LIMIT = 2;
const GUEST_KEY = 'guest_chat_count_v1';

const HIDDEN_PREFIXES = ['/unsubscribe'];

const SUGGESTED: { label: string; prompt: string }[] = [
  { label: 'Best deals today', prompt: 'What are the best offers right now?' },
  { label: 'How verification works', prompt: 'How does student verification work?' },
  { label: 'Coffee picks', prompt: 'Recommend the best coffee offers for me.' },
  { label: 'Claim an offer', prompt: 'How do I claim an offer?' },
];

interface ChatAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChatAssistant = ({ open, onOpenChange }: ChatAssistantProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { data: categories = [] } = useCategories();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hidden = HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "👋 Hi! I'm your **Unidealz Deals Assistant**. Ask me about offers, brands, or how the platform works — I'll help you find the best student discounts.",
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const used = parseInt(localStorage.getItem(GUEST_KEY) || '0', 10);
    if (used >= GUEST_LIMIT) {
      toast.error('Sign in to keep chatting with the assistant.');
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            `You've reached the **2-question limit** for guests. [Sign in](${dashboardLoginUrl}) or [create an account](${dashboardSignupUrl}) to keep chatting and get personalized picks. ✨`,
        },
      ]);
      return;
    }
    localStorage.setItem(GUEST_KEY, String(used + 1));

    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);

    try {
      const result = await callChatAssistant({
        messages: next,
        pageContext: {
          path: location.pathname,
          offerId: location.pathname.startsWith('/offers/') ? params.id : undefined,
        },
      });

      setMessages((m) => [...m, { role: 'assistant', content: result.data.content }]);
    } catch {
      toast.error("Couldn't reach the assistant.");
    } finally {
      setLoading(false);
    }
  };

  if (hidden) return null;

  return (
    <>
      {open && (
        <div
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden border bg-background shadow-2xl animate-scale-in',
            'inset-x-3 bottom-3 top-16 rounded-2xl',
            'sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:max-h-[85vh] sm:w-[400px] sm:rounded-3xl',
          )}
        >
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

          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="space-y-3 p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex',
                    m.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                        <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === 'user' && (
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
                  {categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {categories.slice(0, 4).map((c) => (
                        <Badge key={c.id} variant="outline" className="text-[10px]">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t bg-background p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
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
                onClick={() => navigate('/contact')}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Need a human? Contact support
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
