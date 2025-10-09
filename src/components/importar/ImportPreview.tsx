import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

interface ImportPreviewProps {
  lancamentos: any[];
  onUpdate: (lancamentos: any[]) => void;
  onComplete: () => void;
}

export function ImportPreview({ lancamentos, onUpdate, onComplete }: ImportPreviewProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: obras } = useQuery({
    queryKey: ["obras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: gastos } = useQuery({
    queryKey: ["gastos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gastos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const handleObraChange = (index: number, obraId: string) => {
    const updated = [...lancamentos];
    updated[index].obra_id = obraId;
    onUpdate(updated);
  };

  const handleGastoChange = (index: number, gastoId: string) => {
    const updated = [...lancamentos];
    updated[index].gasto_id = gastoId;
    onUpdate(updated);
  };

  const handleTipoTransacaoChange = (index: number, tipo: string) => {
    const updated = [...lancamentos];
    updated[index].tipo_transacao = tipo;
    onUpdate(updated);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const custosToInsert = lancamentos
        .filter((l) => l.obra_id || l.gasto_id)
        .map((l) => {
          // Validar formato da data YYYY-MM-DD
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          if (!datePattern.test(l.data)) {
            throw new Error(`Data inválida: ${l.data}`);
          }
          
          // Validar valores de dia e mês
          const [ano, mes, dia] = l.data.split('-');
          const mesNum = parseInt(mes);
          const diaNum = parseInt(dia);
          
          if (mesNum < 1 || mesNum > 12) {
            throw new Error(`Mês inválido: ${mes} na data ${l.data}`);
          }
          if (diaNum < 1 || diaNum > 31) {
            throw new Error(`Dia inválido: ${dia} na data ${l.data}`);
          }
          
          return {
            obra_id: l.obra_id || null,
            gasto_id: l.gasto_id || null,
            tipo_transacao: l.tipo_transacao || null,
            data: l.data,
            valor: l.valor,
            documento: l.documento,
            codigo_operacao: l.codigo_operacao,
            tipo_operacao: l.tipo_operacao,
            receptor_destinatario: l.nome,
            descricao: `Importado de CSV - ${l.tipo_operacao}`,
          };
        });

      const { error } = await supabase.from("custos").insert(custosToInsert);
      if (error) throw error;
      
      return custosToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["custos"] });
      toast.success(`${count} lançamentos salvos com sucesso!`);
      onComplete();
    },
    onError: () => {
      toast.error("Erro ao salvar lançamentos");
    },
  });

  const handleSave = () => {
    const semAtribuicao = lancamentos.filter((l) => !l.obra_id && !l.gasto_id).length;
    
    if (semAtribuicao > 0) {
      if (!confirm(`${semAtribuicao} lançamentos sem central serão ignorados. Continuar?`)) {
        return;
      }
    }

    setSaving(true);
    saveMutation.mutate();
  };

  const totalSelecionados = lancamentos.filter((l) => l.obra_id || l.gasto_id).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Lançamentos Importados</span>
          <span className="text-sm font-normal text-muted-foreground">
            {totalSelecionados} de {lancamentos.length} vinculados
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border overflow-hidden max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[200px]">Central de Custos</TableHead>
                <TableHead className="w-[200px]">Obra/Projeto</TableHead>
                <TableHead className="w-[150px]">Tipo Transação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.map((lancamento, index) => (
                <TableRow key={index}>
                  <TableCell className="whitespace-nowrap">{lancamento.data}</TableCell>
                  <TableCell>{lancamento.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lancamento.tipo_operacao}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-secondary">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(lancamento.valor)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lancamento.obra_id || ""}
                      onValueChange={(value) => handleObraChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {obras?.map((obra) => (
                          <SelectItem key={obra.id} value={obra.id}>
                            {obra.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lancamento.gasto_id || ""}
                      onValueChange={(value) => handleGastoChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {gastos?.map((gasto) => (
                          <SelectItem key={gasto.id} value={gasto.id}>
                            {gasto.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lancamento.tipo_transacao || ""}
                      onValueChange={(value) => handleTipoTransacaoChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Saída">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onComplete}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || totalSelecionados === 0}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : `Salvar ${totalSelecionados} Lançamentos`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
