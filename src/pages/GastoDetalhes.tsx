import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GastoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: gasto, isLoading } = useQuery({
    queryKey: ["gasto", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gastos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: custos } = useQuery({
    queryKey: ["custos-gasto", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custos")
        .select("*")
        .eq("gasto_id", id)
        .order("data", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!gasto) {
    return (
      <div className="container mx-auto py-8">
        <p>Gasto não encontrado</p>
      </div>
    );
  }

  const totalCustos = custos?.reduce((sum, custo) => {
    const valor = custo.valor || 0;
    return custo.tipo_transacao === 'Entrada' ? sum + valor : sum - valor;
  }, 0) || 0;

  const formatDate = (dateString: string) => {
    const [ano, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/gastos")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{gasto.nome}</CardTitle>
              <Badge
                variant={
                  gasto.status === "concluída"
                    ? "default"
                    : gasto.status === "em andamento"
                    ? "secondary"
                    : "outline"
                }
              >
                {gasto.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cliente:</span>
              <span className="font-medium">{gasto.cliente}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Início:</span>
              <span className="font-medium">{formatDate(gasto.data_inicio)}</span>
            </div>

            {gasto.data_fim && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Fim:</span>
                <span className="font-medium">{formatDate(gasto.data_fim)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {totalCustos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total de custos associados ({custos?.length || 0} lançamentos)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
