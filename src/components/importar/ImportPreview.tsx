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

  const handleObraChange = (index: number, obraId: string) => {
    const updated = [...lancamentos];
    updated[index].obra_id = obraId;
    onUpdate(updated);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const custosToInsert = lancamentos
        .filter((l) => l.obra_id)
        .map((l) => ({
          obra_id: l.obra_id,
          data: l.data,
          valor: l.valor,
          documento: l.documento,
          codigo_operacao: l.codigo_operacao,
          tipo_operacao: l.tipo_operacao,
          nome: l.nome,
          descricao: `Importado de CSV - ${l.tipo_operacao}`,
        }));

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
    const semObra = lancamentos.filter((l) => !l.obra_id).length;
    
    if (semObra > 0) {
      if (!confirm(`${semObra} lançamentos sem obra serão ignorados. Continuar?`)) {
        return;
      }
    }

    setSaving(true);
    saveMutation.mutate();
  };

  const totalSelecionados = lancamentos.filter((l) => l.obra_id).length;

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
                <TableHead className="w-[250px]">Obra</TableHead>
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
