import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "student" | "curator" | "analyst";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: Role[];
  isAdmin: boolean;
  isStaff: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const uid = newSession.user.id;
        setTimeout(() => {
          if (event === "SIGNED_IN") {
            tryAcceptPendingInvite().then(() => fetchRoles(uid));
          } else {
            fetchRoles(uid);
          }
        }, 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        const uid = existing.user.id;
        tryAcceptPendingInvite().then(() => fetchRoles(uid));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const tryAcceptPendingInvite = async () => {
    try {
      await supabase.functions.invoke("accept-team-invite", { body: {} });
    } catch (_) {
      // No pending invite or already accepted — ignore.
    }
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!error && data) setRoles(data.map((r) => r.role as Role));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        isAdmin: roles.includes("admin"),
        isStaff: roles.some((r) => r === "admin" || r === "curator" || r === "analyst"),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
