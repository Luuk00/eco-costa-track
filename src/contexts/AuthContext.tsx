import { type Context, createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  nome: string | null;
  empresa_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: string | null;
  empresaAtiva: string | null;
  setEmpresaAtiva: (id: string) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

// Shared across module instances so a reloaded copy of this file still finds the provider
const globalKey = "__finantracker_auth_context__";
const AuthContext: Context<AuthContextType | undefined> =
  (globalThis as any)[globalKey] ??
  ((globalThis as any)[globalKey] = createContext<AuthContextType | undefined>(undefined));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [empresaAtiva, setEmpresaAtiva] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    try {
      console.log("🔄 fetchProfile - iniciando busca para userId:", userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      console.log("✅ fetchProfile - profile encontrado:", profileData);
      setProfile(profileData);

      if (profileData.empresa_id) {
        setEmpresaAtiva(profileData.empresa_id);
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      console.log("✅ fetchProfile - role encontrada:", roleData?.role);
      if (roleData) {
        setRole(roleData.role);
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
    }
  };

  const refetchProfile = async () => {
    if (user?.id) {
      console.log("🔄 refetchProfile - forçando atualização de perfil");
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setEmpresaAtiva(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listener para mudanças em user_roles (atualização automática de permissões)
  useEffect(() => {
    if (!user?.id) return;

    console.log("👂 Iniciando listener para mudanças em user_roles");
    
    const subscription = supabase
      .channel('user_roles_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log("🔔 Mudança detectada em user_roles:", payload);
          setTimeout(() => {
            fetchProfile(user.id);
          }, 0);
        }
      )
      .subscribe();
      
    return () => { 
      console.log("👋 Removendo listener de user_roles");
      subscription.unsubscribe(); 
    };
  }, [user?.id]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        empresaAtiva,
        setEmpresaAtiva,
        loading,
        signOut,
        refetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
