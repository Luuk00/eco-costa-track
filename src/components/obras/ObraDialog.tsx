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
import { toast } from "sonner";
import { useEffect } from "react";

interface ObraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obra?: any;
}

export function ObraDialog({ open, onOpenChange, obra }: ObraDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      nome: "",
      cliente: "",
      data_inicio: "",
      data_fim: "",
      status: "em andamento",
    },
  });

  const status = watch("status");

  useEffect(() => {
    if (obra) {
      reset({
        nome: obra.nome,
        cliente: obra.cliente,
        data_inicio: obra.data_inicio,
        data_fim: obra.data_fim || "",
        status: obra.status,
      });
    } else {
      reset({
        nome: "",
        cliente: "",
        data_inicio: "",
        data_fim: "",
        status: "em andamento",
      });
    }
  }, [obra, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (obra) {
        const { error } = await supabase
          .from("obras")
          .update(data)
          .eq("id", obra.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("obras").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      toast.success(obra ? "Obra atualizada!" : "Obra criada com sucesso!");
      onOpenChange(false);
      reset();
    },
    onError: () => {
      toast.error("Erro ao salvar obra");
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      data_fim: data.data_fim || null,
    };
    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{obra ? "Editar Obra" : "Nova Obra"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Obra</Label>
            <Input id="nome" {...register("nome", { required: true })} />
          </div>

          <div>
            <Label htmlFor="cliente">Cliente</Label>
            <Input id="cliente" {...register("cliente", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                {...register("data_inicio", { required: true })}
              />
            </div>

            <div>
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input id="data_fim" type="date" {...register("data_fim")} />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setValue("status", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em andamento">Em Andamento</SelectItem>
                <SelectItem value="concluída">Concluída</SelectItem>
                <SelectItem value="parada">Parada</SelectItem>
              </SelectContent>
            </Select>
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
