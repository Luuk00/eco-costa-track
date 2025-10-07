import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface GastoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gasto?: any;
}

export function GastoDialog({ open, onOpenChange, gasto }: GastoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      nome: "",
      cliente: "",
      status: "em andamento",
      data_inicio: "",
      data_fim: "",
    },
  });

  useEffect(() => {
    if (gasto) {
      reset({
        nome: gasto.nome,
        cliente: gasto.cliente,
        status: gasto.status,
        data_inicio: gasto.data_inicio,
        data_fim: gasto.data_fim || "",
      });
    } else {
      reset({
        nome: "",
        cliente: "",
        status: "em andamento",
        data_inicio: "",
        data_fim: "",
      });
    }
  }, [gasto, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const gastoData = {
        ...data,
        data_fim: data.data_fim || null,
      };

      if (gasto) {
        const { error } = await supabase
          .from("gastos")
          .update(gastoData)
          .eq("id", gasto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gastos").insert(gastoData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      toast({
        title: gasto ? "Gasto atualizado" : "Gasto criado",
        description: gasto
          ? "O gasto foi atualizado com sucesso."
          : "O gasto foi criado com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o gasto.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {gasto ? "Editar Gasto" : "Novo Gasto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Gasto</Label>
            <Input id="nome" {...register("nome")} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input id="cliente" {...register("cliente")} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              defaultValue={gasto?.status || "em andamento"}
              onValueChange={(value) => setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em andamento">Em Andamento</SelectItem>
                <SelectItem value="concluída">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_inicio">Data de Início</Label>
            <Input
              id="data_inicio"
              type="date"
              {...register("data_inicio")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_fim">Data de Fim</Label>
            <Input id="data_fim" type="date" {...register("data_fim")} />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
