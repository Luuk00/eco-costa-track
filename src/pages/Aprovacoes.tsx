import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Aprovacoes() {
  const queryClient = useQueryClient();
  const { user, empresaAtiva } = useAuth();
  const [selectedCusto, setSelectedCusto] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: custosPendentes, isLoading } = useQuery({
    queryKey: ["custos-pendentes", empresaAtiva],
    queryFn: async () => {
      let query = supabase
        .from("custos")
        .select(`
          *,
          obras:obra_id (nome),
          gastos:gasto_id (nome, cliente),
          fornecedores:fornecedor_id (nome)
        `)
        .eq("status_aprovacao", "pendente")
        .order("created_at", { ascending: false });

      if (empresaAtiva) {
        query = query.eq("empresa_id", empresaAtiva);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: custosAprovados } = useQuery({
    queryKey: ["custos-aprovados", empresaAtiva],
    queryFn: async () => {
      let query = supabase
        .from("custos")
        .select(`
          *,
          obras:obra_id (nome),
          fornecedores:fornecedor_id (nome)
        `)
        .in("status_aprovacao", ["aprovado", "rejeitado"])
        .order("aprovado_em", { ascending: false })
        .limit(20);

      if (empresaAtiva) {
        query = query.eq("empresa_id", empresaAtiva);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("custos")
        .update({
          status_aprovacao: status,
          aprovado_por: user?.id,
          aprovado_em: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custos-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["custos-aprovados"] });
      queryClient.invalidateQueries({ queryKey: ["custos"] });
      toast.success("Status atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  const handleApprove = (id: string) => {
    approvalMutation.mutate({ id, status: "aprovado" });
  };

  const handleReject = (id: string) => {
    approvalMutation.mutate({ id, status: "rejeitado" });
  };

  const handleViewDetails = (custo: any) => {
    setSelectedCusto(custo);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Aprovações</h1>
        <p className="text-muted-foreground">Gerencie as aprovações de custos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pendentes de Aprovação ({custosPendentes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {custosPendentes && custosPendentes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Central de Custos</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custosPendentes.map((custo) => (
                  <TableRow key={custo.id}>
                    <TableCell>
                      {format(new Date(custo.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{(custo.obras as any)?.nome || "-"}</TableCell>
                    <TableCell>{(custo.fornecedores as any)?.nome || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{custo.descricao || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(custo.valor)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(custo)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(custo.id)}
                        >
                          <CheckCircle className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(custo.id)}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum custo pendente de aprovação
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Aprovações</CardTitle>
        </CardHeader>
        <CardContent>
          {custosAprovados && custosAprovados.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Central de Custos</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aprovado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custosAprovados.map((custo) => (
                  <TableRow key={custo.id}>
                    <TableCell>
                      {format(new Date(custo.data + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{(custo.obras as any)?.nome || "-"}</TableCell>
                    <TableCell>{(custo.fornecedores as any)?.nome || "-"}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(custo.valor)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={custo.status_aprovacao === "aprovado" ? "default" : "destructive"}
                      >
                        {custo.status_aprovacao === "aprovado" ? "Aprovado" : "Rejeitado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {custo.aprovado_em
                        ? format(new Date(custo.aprovado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum histórico de aprovação
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Custo</DialogTitle>
          </DialogHeader>
          {selectedCusto && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(new Date(selectedCusto.data + "T00:00:00"), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(selectedCusto.valor)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Central de Custos</p>
                  <p className="font-medium">{(selectedCusto.obras as any)?.nome || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">
                    {(selectedCusto.fornecedores as any)?.nome || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Transação</p>
                  <p className="font-medium">{selectedCusto.tipo_transacao || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Operação</p>
                  <p className="font-medium">{selectedCusto.tipo_operacao || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="font-medium">{selectedCusto.descricao || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Observação</p>
                <p className="font-medium">{selectedCusto.observacao || "-"}</p>
              </div>
              {selectedCusto.comprovante_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Comprovante</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedCusto.comprovante_url} target="_blank" rel="noopener noreferrer">
                      Ver Comprovante
                    </a>
                  </Button>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Fechar
                </Button>
                {selectedCusto.status_aprovacao === "pendente" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleReject(selectedCusto.id);
                        setDetailsOpen(false);
                      }}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => {
                        handleApprove(selectedCusto.id);
                        setDetailsOpen(false);
                      }}
                    >
                      Aprovar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
