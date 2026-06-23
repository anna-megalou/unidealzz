import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Role } from '@unidealz/shared';
import { STAFF_ROLES } from '@unidealz/shared';
import {
  auth,
  callAcceptTeamInvite,
  callGetUserDetails,
  callRequestPasswordReset,
  Collections,
  db,
} from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  roles: Role[];
  isAdmin: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  verifyResetCode: (code: string) => Promise<string>;
  confirmReset: (code: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchRoles(user: User): Promise<Role[]> {
  const token = await user.getIdTokenResult(true);
  const raw = token.claims.roles;
  if (!Array.isArray(raw)) return ['student'];
  return raw.filter((r): r is Role =>
    r === 'admin' || r === 'student' || r === 'curator' || r === 'analyst',
  );
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);

  const tryAcceptPendingInvite = useCallback(async () => {
    try {
      await callAcceptTeamInvite({});
    } catch {
      // No pending invite — ignore.
    }
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (firebaseUser) {
        try {
          await callGetUserDetails({});
          await tryAcceptPendingInvite();
          const nextRoles = await fetchRoles(firebaseUser);
          setRoles(nextRoles.length > 0 ? nextRoles : ['student']);

          const userRef = doc(db, Collections.USERS, firebaseUser.uid);
          unsubProfile = onSnapshot(userRef, () => {}, () => {});
        } catch (err) {
          console.error('Auth bootstrap failed:', err);
          setRoles(['student']);
        }
      } else {
        setRoles([]);
      }

      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, [tryAcceptPendingInvite]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setRoles([]);
  };

  const resetPassword = async (email: string) => {
    await callRequestPasswordReset({ email });
  };

  const updateUserPassword = async (password: string) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    await updatePassword(auth.currentUser, password);
  };

  const verifyResetCode = async (code: string) => verifyPasswordResetCode(auth, code);

  const confirmReset = async (code: string, password: string) => {
    await confirmPasswordReset(auth, code, password);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      roles,
      isAdmin: roles.includes('admin'),
      isStaff: roles.some((r) => (STAFF_ROLES as readonly Role[]).includes(r)),
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateUserPassword,
      verifyResetCode,
      confirmReset,
    }),
    [user, loading, roles],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/** @deprecated Use useAuth() — kept for notification boilerplate compatibility */
export const useAuthContext = useAuth;
