import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { TrialBanner } from "@/components/TrialBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Layout({ children }: { children: React.ReactNode }) {
  const { empresaAtiva } = useAuth();

  const { data: empresa } = useQuery({
    queryKey: ['empresa-nome', empresaAtiva],
    queryFn: async () => {
      if (!empresaAtiva) return null;
      const { data } = await supabase
        .from('empresas')
        .select('nome, nome_personalizado')
        .eq('id', empresaAtiva)
        .single();
      return data;
    },
    enabled: !!empresaAtiva,
  });

  const nomeEmpresa = empresa?.nome_personalizado || empresa?.nome || "FINANTRACKER";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold text-foreground">{nomeEmpresa}</h1>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            <TrialBanner />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
