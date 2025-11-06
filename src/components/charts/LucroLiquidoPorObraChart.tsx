import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LucroLiquidoPorObraChartProps {
  empresaId?: string;
  dataInicio?: string | null;
  dataFim?: string | null;
}

export function LucroLiquidoPorObraChart({ empresaId, dataInicio, dataFim }: LucroLiquidoPorObraChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["lucro-por-obra", empresaId, dataInicio, dataFim],
    queryFn: async () => {
      let obrasQuery = supabase
        .from("obras")
        .select("id, nome")
        .order("created_at", { ascending: false })
        .limit(5);

      if (empresaId) {
        obrasQuery = obrasQuery.eq("empresa_id", empresaId);
      }

      const { data: obras, error: obrasError } = await obrasQuery;
      if (obrasError) throw obrasError;

      const obraData = await Promise.all(
        obras.map(async (obra) => {
          let custosQuery = supabase
            .from("custos")
            .select("valor")
            .eq("obra_id", obra.id);

          if (dataInicio && dataFim) {
            custosQuery = custosQuery.gte("data", dataInicio).lte("data", dataFim);
          }

          const { data: custos } = await custosQuery;

          const entradas = custos?.filter(c => c.valor > 0).reduce((sum, c) => sum + c.valor, 0) || 0;
          const saidas = Math.abs(custos?.filter(c => c.valor < 0).reduce((sum, c) => sum + c.valor, 0) || 0);

          return {
            nome: obra.nome.length > 20 ? obra.nome.substring(0, 20) + "..." : obra.nome,
            entradas,
            saidas,
          };
        })
      );

      return obraData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entradas vs Saídas por Obra</CardTitle>
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
        <CardTitle>Entradas vs Saídas por Obra</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="nome" 
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
            <Legend />
            <Bar dataKey="entradas" fill="hsl(var(--chart-1))" name="Entradas" />
            <Bar dataKey="saidas" fill="hsl(var(--chart-2))" name="Saídas" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
