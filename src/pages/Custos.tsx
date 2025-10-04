import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustoDialog } from "@/components/custos/CustoDialog";
import { CustosTable } from "@/components/custos/CustosTable";
import { toast } from "sonner";

export default function Custos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: custos, isLoading } = useQuery({
    queryKey: ["custos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custos")
        .select(`
          *,
          obras:obra_id (
            nome
          )
        `)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custos"] });
      toast.success("Custo excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir custo");
    },
  });

  const handleEdit = (custo: any) => {
    setEditingCusto(custo);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este custo?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCusto(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Custos</h1>
          <p className="text-muted-foreground">Gerencie os custos das obras</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Custo
        </Button>
      </div>

      <CustosTable
        custos={custos || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CustoDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        custo={editingCusto}
      />
    </div>
  );
}
