import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DespesasPorMesChartProps {
  empresaId?: string;
}

export function DespesasPorMesChart({ empresaId }: DespesasPorMesChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["despesas-por-mes", empresaId],
    queryFn: async () => {
      const startDate = startOfMonth(subMonths(new Date(), 5));
      const endDate = endOfMonth(new Date());

      let query = supabase
        .from("custos")
        .select("valor, data")
        .gte("data", format(startDate, "yyyy-MM-dd"))
        .lte("data", format(endDate, "yyyy-MM-dd"))
        .lt("valor", 0);

      if (empresaId) {
        query = query.eq("empresa_id", empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Agrupar por mês
      const monthlyData: Record<string, number> = {};
      
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const key = format(month, "MMM/yyyy", { locale: ptBR });
        monthlyData[key] = 0;
      }

      data?.forEach((custo) => {
        const month = format(new Date(custo.data + 'T00:00:00'), "MMM/yyyy", { locale: ptBR });
        if (monthlyData[month] !== undefined) {
          monthlyData[month] += Math.abs(custo.valor);
        }
      });

      return Object.entries(monthlyData).map(([mes, total]) => ({
        mes,
        total,
      }));
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Despesas por Mês</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="mes" 
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
              tickFormatter={(value) => 
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  minimumFractionDigits: 0,
                }).format(value)
              }
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value)
              }
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Despesas"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
