import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, TrendingUp, TrendingDown, CheckCircle2, Clock, Wallet, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertasDashboard } from "@/components/AlertasDashboard";
import { DespesasPorMesChart } from "@/components/charts/DespesasPorMesChart";
import { CustosPorCategoriaChart } from "@/components/charts/CustosPorCategoriaChart";
import { LucroLiquidoPorObraChart } from "@/components/charts/LucroLiquidoPorObraChart";
import { TotalGastoPorFornecedorChart } from "@/components/charts/TotalGastoPorFornecedorChart";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";

export default function Dashboard() {
  const { empresaAtiva } = useAuth();
  const { isSuperAdmin } = usePermission();
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>("todos");

  // Gerar últimos 12 meses para o select
  const opcoesPeríodo = [
    { value: "todos", label: "Todos os períodos" },
    ...Array.from({ length: 12 }, (_, i) => {
      const mes = subMonths(new Date(), i);
      return {
        value: format(mes, "yyyy-MM"),
        label: format(mes, "MMMM 'de' yyyy", { locale: ptBR })
      };
    })
  ];

  // Calcular datas de início e fim baseado no período
  const getDatasDoPeríodo = () => {
    if (periodoSelecionado === "todos") {
      return { inicio: null, fim: null };
    }
    const [ano, mes] = periodoSelecionado.split("-").map(Number);
    const data = new Date(ano, mes - 1);
    return {
      inicio: format(startOfMonth(data), "yyyy-MM-dd"),
      fim: format(endOfMonth(data), "yyyy-MM-dd")
    };
  };

  const { inicio: dataInicio, fim: dataFim } = getDatasDoPeríodo();
  
  const { data: obras } = useQuery({
    queryKey: ["obras", empresaAtiva],
    queryFn: async () => {
      let query = supabase.from("obras").select("*");
      
      // Filtrar SEMPRE por empresa
      if (empresaAtiva) {
        query = query.eq("empresa_id", empresaAtiva);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: custos } = useQuery({
    queryKey: ["custos", empresaAtiva, dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase.from("custos").select("*");
      
      // Filtrar SEMPRE por empresa
      if (empresaAtiva) {
        query = query.eq("empresa_id", empresaAtiva);
      }
      
      // Filtrar por período
      if (dataInicio && dataFim) {
        query = query.gte("data", dataInicio).lte("data", dataFim);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: gastos } = useQuery({
    queryKey: ["gastos", empresaAtiva],
    queryFn: async () => {
      let query = supabase.from("gastos").select("*");
      
      // Filtrar SEMPRE por empresa
      if (empresaAtiva) {
        query = query.eq("empresa_id", empresaAtiva);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalObras = obras?.length || 0;
  const obrasEmAndamento = obras?.filter((o) => o.status === "em andamento").length || 0;
  const obrasConcluidas = obras?.filter((o) => o.status === "concluída").length || 0;
  
  const totalGastos = gastos?.length || 0;
  const gastosEmAndamento = gastos?.filter((g) => g.status === "em andamento").length || 0;
  const gastosConcluidos = gastos?.filter((g) => g.status === "concluída").length || 0;
  
  // Calcular totais separados
  const totalEntradas = custos?.filter(c => c.tipo_transacao === 'Entrada')
    .reduce((sum, c) => sum + Number(c.valor), 0) || 0;

  const totalSaidas = custos?.filter(c => c.tipo_transacao === 'Saída')
    .reduce((sum, c) => sum + Number(c.valor), 0) || 0;

  const totalLiquido = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema de gestão de centrais de custos</p>
      </div>

      <AlertasDashboard />

      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            {opcoesPeríodo.map((opcao) => (
              <SelectItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{obrasEmAndamento}</div>
            <p className="text-xs text-muted-foreground mt-1">Centrais ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{obrasConcluidas}</div>
            <p className="text-xs text-muted-foreground mt-1">Centrais finalizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Centrais</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalObras}</div>
            <p className="text-xs text-muted-foreground mt-1">Centrais cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalEntradas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Soma de todas as entradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalSaidas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Soma de todas as saídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Líquido</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalLiquido)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Entradas - Saídas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <DespesasPorMesChart empresaId={empresaAtiva} dataInicio={dataInicio} dataFim={dataFim} />
        <CustosPorCategoriaChart empresaId={empresaAtiva} dataInicio={dataInicio} dataFim={dataFim} />
        <LucroLiquidoPorObraChart empresaId={empresaAtiva} dataInicio={dataInicio} dataFim={dataFim} />
        <TotalGastoPorFornecedorChart empresaId={empresaAtiva} dataInicio={dataInicio} dataFim={dataFim} />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
                      <p className="text-sm text-muted-foreground">{obra.observacao || "-"}</p>
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
            <CardTitle>Centrais de Custos - Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {obras?.slice(0, 5).map((obra) => {
                const custoObra = custos?.filter((c) => c.obra_id === obra.id)
                  .reduce((sum, c) => {
                    const valor = Number(c.valor);
                    return c.tipo_transacao === 'Entrada' ? sum + valor : sum - valor;
                  }, 0) || 0;
                
                return (
                  <div key={obra.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <p className="text-sm font-medium text-foreground">{obra.nome}</p>
                    <p className={`text-sm font-bold ${custoObra >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

        <Card>
          <CardHeader>
            <CardTitle>Obras/Projetos - Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gastos?.slice(0, 5).map((gasto) => {
                const custoGasto = custos?.filter((c) => c.gasto_id === gasto.id)
                  .reduce((sum, c) => {
                    const valor = Number(c.valor);
                    return c.tipo_transacao === 'Entrada' ? sum + valor : sum - valor;
                  }, 0) || 0;
                
                return (
                  <div key={gasto.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <p className="text-sm font-medium text-foreground">{gasto.nome}</p>
                    <p className={`text-sm font-bold ${custoGasto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(custoGasto)}
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
