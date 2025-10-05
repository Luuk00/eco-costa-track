import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
    return <div className="text-center py-8">Obra não encontrada</div>;
  }

  const totalCustos = custos?.reduce((sum, c) => sum + c.valor, 0) || 0;
  const totalEntradas = custos?.filter(c => c.valor > 0).reduce((sum, c) => sum + c.valor, 0) || 0;
  const totalSaidas = custos?.filter(c => c.valor < 0).reduce((sum, c) => sum + c.valor, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/obras")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{obra.nome}</h1>
          <p className="text-muted-foreground">{obra.cliente}</p>
        </div>
      </div>

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
          <CardTitle>Informações da Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data Início</p>
              <p className="font-medium">
                {obra.data_inicio ? format(new Date(obra.data_inicio + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Fim</p>
              <p className="font-medium">
                {obra.data_fim ? format(new Date(obra.data_fim + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }) : "-"}
              </p>
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
            <p className="text-center py-8 text-muted-foreground">Nenhum custo registrado para esta obra</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
