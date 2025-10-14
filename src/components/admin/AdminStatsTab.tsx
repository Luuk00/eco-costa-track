import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, CreditCard, DollarSign, TrendingUp, Calendar } from "lucide-react";

export function AdminStatsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usuarios, empresas, subscriptions, totalReceita] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("empresas").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("*"),
        supabase.from("subscriptions").select("amount_paid"),
      ]);

      const totalUsuarios = usuarios.count || 0;
      const totalEmpresas = empresas.count || 0;
      
      const allSubs = subscriptions.data || [];
      const subscriptionsAtivas = allSubs.filter(s => s.status === "active").length;
      const usuariosEmTrial = allSubs.filter(s => s.plan_type === "trial" && s.status === "active").length;
      const usuariosMensal = allSubs.filter(s => s.plan_type === "monthly" && s.status === "active").length;
      const usuariosAnual = allSubs.filter(s => s.plan_type === "annual" && s.status === "active").length;
      
      const receitaTotal = totalReceita.data?.reduce((sum, sub) => {
        return sum + (Number(sub.amount_paid) || 0);
      }, 0) || 0;

      return {
        totalUsuarios,
        totalEmpresas,
        subscriptionsAtivas,
        usuariosEmTrial,
        usuariosMensal,
        usuariosAnual,
        receitaTotal,
      };
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Carregando estatísticas...</div>;
  }

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats?.totalUsuarios || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Total de Empresas",
      value: stats?.totalEmpresas || 0,
      icon: Building,
      color: "text-green-500",
    },
    {
      title: "Subscriptions Ativas",
      value: stats?.subscriptionsAtivas || 0,
      icon: CreditCard,
      color: "text-purple-500",
    },
    {
      title: "Usuários em Trial",
      value: stats?.usuariosEmTrial || 0,
      icon: Calendar,
      color: "text-yellow-500",
    },
    {
      title: "Planos Mensais",
      value: stats?.usuariosMensal || 0,
      icon: TrendingUp,
      color: "text-orange-500",
    },
    {
      title: "Planos Anuais",
      value: stats?.usuariosAnual || 0,
      icon: TrendingUp,
      color: "text-pink-500",
    },
    {
      title: "Receita Total",
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(stats?.receitaTotal || 0),
      icon: DollarSign,
      color: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
