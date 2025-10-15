import { Building2, DollarSign, Upload, LayoutDashboard, Wallet, Users, Building, UserCog, CheckSquare, Settings, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Central de Custos", url: "/obras", icon: Building2 },
  { title: "Obra/Projeto", url: "/gastos", icon: Wallet },
  { title: "Custos", url: "/custos", icon: DollarSign },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

const adminMenuItems = [
  { title: "Empresas", url: "/empresas", icon: Building, requireRole: "admin" },
  { title: "Usuários", url: "/usuarios", icon: Users, requireRole: "admin" },
];

const financeiroMenuItems = [
  { title: "Fornecedores", url: "/fornecedores", icon: UserCog },
  { title: "Aprovações", url: "/aprovacoes", icon: CheckSquare },
  { title: "Importar CSV", url: "/importar", icon: Upload },
];

export function AppSidebar() {
  const { hasRole, isSuperAdmin, isAdmin } = usePermission();
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
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-sidebar-foreground" />
          <span className="font-bold text-lg text-sidebar-foreground">{nomeEmpresa}</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeiroMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isSuperAdmin() && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to="/admin-geral"
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Admin Geral</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
