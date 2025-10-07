import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { GastosTable } from "@/components/gastos/GastosTable";
import { GastoDialog } from "@/components/gastos/GastoDialog";
import { useToast } from "@/hooks/use-toast";

export default function Gastos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gastos, isLoading } = useQuery({
    queryKey: ["gastos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gastos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      toast({
        title: "Gasto excluído",
        description: "O gasto foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o gasto.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (gasto: any) => {
    setEditingGasto(gasto);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewGasto = () => {
    setEditingGasto(null);
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Gastos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie todos os gastos do projeto
          </p>
        </div>
        <Button onClick={handleNewGasto}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Gasto
        </Button>
      </div>

      <GastosTable
        gastos={gastos || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <GastoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gasto={editingGasto}
      />
    </div>
  );
}
