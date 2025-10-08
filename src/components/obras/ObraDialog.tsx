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
      status: "em andamento",
      cliente: "",
      data_inicio: "",
      data_fim: "",
    },
  });

  const status = watch("status");

  useEffect(() => {
    if (obra) {
      reset({
        nome: obra.nome,
        status: obra.status,
        cliente: obra.cliente || "",
        data_inicio: obra.data_inicio || "",
        data_fim: obra.data_fim || "",
      });
    } else {
      reset({
        nome: "",
        status: "em andamento",
        cliente: "",
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: "",
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
      toast.success(obra ? "Central de Custos atualizada!" : "Central de Custos criada com sucesso!");
      onOpenChange(false);
      reset();
    },
    onError: () => {
      toast.error("Erro ao salvar central de custos");
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{obra ? "Editar Central de Custos" : "Nova Central de Custos"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Central de Custos</Label>
            <Input id="nome" {...register("nome", { required: true })} />
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
