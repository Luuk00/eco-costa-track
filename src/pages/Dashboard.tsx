import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { data: obras } = useQuery({
    queryKey: ["obras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: custos } = useQuery({
    queryKey: ["custos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custos")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const totalObras = obras?.length || 0;
  const obrasEmAndamento = obras?.filter((o) => o.status === "em andamento").length || 0;
  const obrasConcluidas = obras?.filter((o) => o.status === "concluída").length || 0;
  const totalCustos = custos?.reduce((sum, c) => sum + Number(c.valor), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema de gestão de centrais de custos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Centrais</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalObras}</div>
            <p className="text-xs text-muted-foreground mt-1">Centrais cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{obrasEmAndamento}</div>
            <p className="text-xs text-muted-foreground mt-1">Centrais ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{obrasConcluidas}</div>
            <p className="text-xs text-muted-foreground mt-1">Centrais finalizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Custos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalCustos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Soma de todos os custos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Centrais Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {obras && obras.length > 0 ? (
              <div className="space-y-3">
                {obras.slice(0, 5).map((obra) => (
                  <div key={obra.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-foreground">{obra.nome}</p>
                      <p className="text-sm text-muted-foreground">{obra.cliente}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      obra.status === "em andamento" 
                        ? "bg-warning/10 text-warning" 
                        : obra.status === "concluída"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {obra.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma central cadastrada</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {obras?.slice(0, 5).map((obra) => {
                const custoObra = custos?.filter((c) => c.obra_id === obra.id)
                  .reduce((sum, c) => sum + Number(c.valor), 0) || 0;
                
                return (
                  <div key={obra.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <p className="text-sm font-medium text-foreground">{obra.nome}</p>
                    <p className="text-sm font-bold text-secondary">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(custoObra)}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
