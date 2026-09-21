import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * A permissão de administrador vive na base de dados, não no browser:
   * é a função `check_is_admin` do Supabase que decide.
   */
  const checkAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("check_is_admin", { _user_id: userId });
      setIsAdmin(!error && data === true);
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        checkAdmin(newSession.user.id);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) checkAdmin(existing.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Erro ao fazer login", { description: error.message });
      throw error;
    }
    toast.success("Login realizado com sucesso!");
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (error) {
      toast.error("Erro ao criar conta", { description: error.message });
      throw error;
    }
    toast.success("Conta criada com sucesso!");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao fazer logout");
      return;
    }
    toast.success("Logout realizado com sucesso!");
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth tem de ser usado dentro de <AuthProvider>");
  return ctx;
}
