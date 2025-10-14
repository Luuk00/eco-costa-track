import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TotalGastoPorFornecedorChartProps {
  empresaId?: string;
}

export function TotalGastoPorFornecedorChart({ empresaId }: TotalGastoPorFornecedorChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["gasto-por-fornecedor", empresaId],
    queryFn: async () => {
      let query = supabase
        .from("custos")
        .select("fornecedor_id, valor")
        .lt("valor", 0)
        .not("fornecedor_id", "is", null);

      if (empresaId) {
        query = query.eq("empresa_id", empresaId);
      }

      const { data: custos, error } = await query;
      if (error) throw error;

      const fornecedorData: Record<string, number> = {};

      custos?.forEach((custo) => {
        if (custo.fornecedor_id) {
          if (!fornecedorData[custo.fornecedor_id]) {
            fornecedorData[custo.fornecedor_id] = 0;
          }
          fornecedorData[custo.fornecedor_id] += Math.abs(custo.valor);
        }
      });

      const fornecedorIds = Object.keys(fornecedorData);
      const { data: fornecedores } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .in("id", fornecedorIds);

      const chartData = fornecedores
        ?.map((fornecedor) => ({
          nome: fornecedor.nome.length > 25 ? fornecedor.nome.substring(0, 25) + "..." : fornecedor.nome,
          total: fornecedorData[fornecedor.id],
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5) || [];

      return chartData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Fornecedores</CardTitle>
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
        <CardTitle>Top 5 Fornecedores</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number"
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
            <YAxis 
              type="category"
              dataKey="nome" 
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
              width={150}
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
            <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Gasto" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
