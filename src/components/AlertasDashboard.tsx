import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export function AlertasDashboard() {
  const { empresaAtiva } = useAuth();

  const { data: orcamentosUltrapassados } = useQuery({
    queryKey: ["alertas-orcamento", empresaAtiva],
    queryFn: async () => {
      let obrasQuery = supabase
        .from("obras")
        .select("id, nome, orcamento_total")
        .not("orcamento_total", "is", null)
        .gt("orcamento_total", 0);

      if (empresaAtiva) {
        obrasQuery = obrasQuery.eq("empresa_id", empresaAtiva);
      }

      const { data: obras, error } = await obrasQuery;
      if (error) throw error;

      const obrasUltrapassadas = await Promise.all(
        obras.map(async (obra) => {
          const { data: custos } = await supabase
            .from("custos")
            .select("valor")
            .eq("obra_id", obra.id)
            .lt("valor", 0);

          const totalGasto = Math.abs(
            custos?.reduce((sum, c) => sum + c.valor, 0) || 0
          );
          const percentual = (totalGasto / obra.orcamento_total!) * 100;

          if (percentual > 100) {
            return {
              nome: obra.nome,
              percentual: percentual.toFixed(1),
            };
          }
          return null;
        })
      );

      return obrasUltrapassadas.filter(Boolean);
    },
  });

  const { data: custosPendentes } = useQuery({
    queryKey: ["alertas-pendentes", empresaAtiva],
    queryFn: async () => {
      let query = supabase
        .from("custos")
        .select("id", { count: "exact", head: true })
        .eq("status_aprovacao", "pendente");

      if (empresaAtiva) {
        query = query.eq("empresa_id", empresaAtiva);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const totalAlertas =
    (orcamentosUltrapassados?.length || 0) + (custosPendentes || 0 > 0 ? 1 : 0);

  if (totalAlertas === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Alertas</h2>
        <Badge variant="destructive">{totalAlertas}</Badge>
      </div>

      {orcamentosUltrapassados && orcamentosUltrapassados.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Orçamento Ultrapassado</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {orcamentosUltrapassados.map((obra: any, idx: number) => (
                <li key={idx}>
                  <strong>{obra.nome}</strong> - {obra.percentual}% do orçamento
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {custosPendentes && custosPendentes > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Custos Pendentes de Aprovação</AlertTitle>
          <AlertDescription>
            Existem <strong>{custosPendentes}</strong> custos aguardando aprovação.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
