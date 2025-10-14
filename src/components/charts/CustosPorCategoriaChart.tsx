import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CustosPorCategoriaChartProps {
  empresaId?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function CustosPorCategoriaChart({ empresaId }: CustosPorCategoriaChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["custos-por-categoria", empresaId],
    queryFn: async () => {
      let query = supabase
        .from("custos")
        .select("tipo_operacao, valor")
        .lt("valor", 0);

      if (empresaId) {
        query = query.eq("empresa_id", empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const categoryData: Record<string, number> = {};

      data?.forEach((custo) => {
        const categoria = custo.tipo_operacao || "Sem Categoria";
        if (!categoryData[categoria]) {
          categoryData[categoria] = 0;
        }
        categoryData[categoria] += Math.abs(custo.valor);
      });

      return Object.entries(categoryData).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custos por Categoria</CardTitle>
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
        <CardTitle>Custos por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {chartData?.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
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
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
