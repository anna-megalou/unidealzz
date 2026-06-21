import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Comment {
  id: string;
  userId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface Props {
  postId: string;
  onCountChange: (count: number) => void;
}

const initialsOf = (name: string) =>
  name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export const ExperienceComments = ({ postId, onCountChange }: Props) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("experience_post_comments")
      .select("id, user_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const userIds = Array.from(new Set((data ?? []).map((c: any) => c.user_id)));
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
      : { data: [] as any[] };
    const map = new Map<string, string>();
    (profiles ?? []).forEach((p: any) => map.set(p.user_id, p.display_name ?? "Student"));

    const mapped: Comment[] = (data ?? []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      authorName: map.get(c.user_id) ?? "Student",
      content: c.content,
      createdAt: c.created_at,
    }));
    setComments(mapped);
    onCountChange(mapped.length);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async () => {
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }
    const trimmed = text.trim();
    if (trimmed.length < 1 || trimmed.length > 500) {
      toast.error("Comment must be 1–500 characters");
      return;
    }
    setPosting(true);
    const { error } = await supabase
      .from("experience_post_comments")
      .insert({ post_id: postId, user_id: user.id, content: trimmed });
    setPosting(false);
    if (error) {
      toast.error("Couldn't post comment");
      return;
    }
    setText("");
    load();
  };

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" /> Loading…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet. Be the first.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                {initialsOf(c.authorName)}
              </div>
              <div className="min-w-0 flex-1 rounded-xl bg-muted/50 px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{c.authorName}</p>
                <p className="text-sm text-foreground">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2"
      >
        <Input
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          disabled={posting}
        />
        <Button type="submit" size="icon" disabled={posting || !text.trim()}>
          {posting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
        </Button>
      </form>
    </div>
  );
};
