import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";

interface CustoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custo?: any;
}

export function CustoDialog({ open, onOpenChange, custo }: CustoDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      obra_id: "",
      data: "",
      valor: "",
      descricao: "",
      tipo_operacao: "",
      documento: "",
      codigo_operacao: "",
      receptor_destinatario: "",
      observacao: "",
    },
  });

  const obraId = watch("obra_id");

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

  useEffect(() => {
    if (custo) {
      // Corrigir problema de data - usar formato local sem conversão de timezone
      const dataLocal = custo.data ? new Date(custo.data + 'T00:00:00') : null;
      const dataFormatada = dataLocal ? dataLocal.toISOString().split('T')[0] : '';
      
      reset({
        obra_id: custo.obra_id,
        data: dataFormatada,
        valor: custo.valor,
        descricao: custo.descricao || "",
        tipo_operacao: custo.tipo_operacao || "",
        documento: custo.documento || "",
        codigo_operacao: custo.codigo_operacao || "",
        receptor_destinatario: custo.receptor_destinatario || "",
        observacao: custo.observacao || "",
      });
    } else {
      reset({
        obra_id: "",
        data: "",
        valor: "",
        descricao: "",
        tipo_operacao: "",
        documento: "",
        codigo_operacao: "",
        receptor_destinatario: "",
        observacao: "",
      });
    }
  }, [custo, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        valor: parseFloat(data.valor),
      };

      if (custo) {
        const { error } = await supabase
          .from("custos")
          .update(payload)
          .eq("id", custo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custos").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custos"] });
      toast.success(custo ? "Custo atualizado!" : "Custo criado com sucesso!");
      onOpenChange(false);
      reset();
    },
    onError: () => {
      toast.error("Erro ao salvar custo");
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{custo ? "Editar Custo" : "Novo Custo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="obra_id">Obra</Label>
            <Select value={obraId} onValueChange={(value) => setValue("obra_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma obra" />
              </SelectTrigger>
              <SelectContent>
                {obras?.map((obra) => (
                  <SelectItem key={obra.id} value={obra.id}>
                    {obra.nome} - {obra.cliente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" {...register("data", { required: true })} />
            </div>

            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                {...register("valor", { required: true })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register("descricao")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_operacao">Tipo de Operação</Label>
              <Input id="tipo_operacao" {...register("tipo_operacao")} />
            </div>

            <div>
              <Label htmlFor="documento">Documento</Label>
              <Input id="documento" {...register("documento")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo_operacao">Código da Operação</Label>
              <Input id="codigo_operacao" {...register("codigo_operacao")} />
            </div>

            <div>
              <Label htmlFor="receptor_destinatario">Receptor/Destinatário</Label>
              <Input id="receptor_destinatario" {...register("receptor_destinatario")} />
            </div>
          </div>

          <div>
            <Label htmlFor="observacao">Observação</Label>
            <Textarea id="observacao" {...register("observacao")} placeholder="Adicione observações sobre este custo..." />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
