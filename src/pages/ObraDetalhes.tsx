import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ObraDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: obra, isLoading: obraLoading } = useQuery({
    queryKey: ["obra", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: custos, isLoading: custosLoading } = useQuery({
    queryKey: ["custos-obra", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custos")
        .select("*")
        .eq("obra_id", id)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (obraLoading || custosLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!obra) {
    return <div className="text-center py-8">Central de Custos não encontrada</div>;
  }

  const totalCustos = custos?.reduce((sum, c) => sum + c.valor, 0) || 0;
  const totalEntradas = custos?.filter(c => c.valor > 0).reduce((sum, c) => sum + c.valor, 0) || 0;
  const totalSaidas = custos?.filter(c => c.valor < 0).reduce((sum, c) => sum + c.valor, 0) || 0;
  
  const orcamentoTotal = obra?.orcamento_total || 0;
  const totalGasto = Math.abs(totalSaidas);
  const percentualGasto = orcamentoTotal > 0 ? (totalGasto / orcamentoTotal) * 100 : 0;
  const orcamentoUltrapassado = percentualGasto > 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/obras")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{obra.nome}</h1>
          <p className="text-muted-foreground">{obra.observacao || "-"}</p>
        </div>
      </div>

      {orcamentoUltrapassado && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Orçamento Ultrapassado!</AlertTitle>
          <AlertDescription>
            Esta central de custos ultrapassou o orçamento previsto em {(percentualGasto - 100).toFixed(1)}%.
          </AlertDescription>
        </Alert>
      )}

      {orcamentoTotal > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Controle de Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Orçamento Total</p>
                <p className="text-xl font-bold text-foreground">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(orcamentoTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gasto</p>
                <p className="text-xl font-bold text-foreground">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalGasto)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentual Consumido</p>
                <p className={`text-xl font-bold ${
                  percentualGasto > 100 ? 'text-red-600' : 
                  percentualGasto > 80 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {percentualGasto.toFixed(1)}%
                </p>
              </div>
            </div>
            <div>
              <Progress 
                value={Math.min(percentualGasto, 100)} 
                className={
                  percentualGasto > 100 ? 'bg-red-100 [&>div]:bg-red-600' : 
                  percentualGasto > 80 ? 'bg-yellow-100 [&>div]:bg-yellow-600' : 
                  'bg-green-100 [&>div]:bg-green-600'
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Custos</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Math.abs(totalCustos))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalEntradas)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Math.abs(totalSaidas))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Central de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Observação</p>
              <p className="font-medium">{obra.observacao || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{obra.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Lançamentos</p>
              <p className="font-medium">{custos?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          {custos && custos.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Receptor/Destinatário</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {custos.map((custo) => (
                    <TableRow key={custo.id}>
                      <TableCell>
                        {format(new Date(custo.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{custo.receptor_destinatario || "-"}</TableCell>
                      <TableCell>{custo.descricao || "-"}</TableCell>
                      <TableCell>{custo.tipo_operacao || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{custo.observacao || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-secondary">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(custo.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Nenhum custo registrado para esta central de custos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
