import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ObraDialog } from "@/components/obras/ObraDialog";
import { ObrasTable } from "@/components/obras/ObrasTable";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Obras() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<any>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: obras, isLoading } = useQuery({
    queryKey: ["obras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obras")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("obras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      toast.success("Obra excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir obra");
    },
  });

  const handleEdit = (obra: any) => {
    setEditingObra(obra);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta obra?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingObra(null);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/obras/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Obras</h1>
          <p className="text-muted-foreground">Gerencie todas as obras da empresa</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Obra
        </Button>
      </div>

      <ObrasTable
        obras={obras || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
      />

      <ObraDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        obra={editingObra}
      />
    </div>
  );
}
