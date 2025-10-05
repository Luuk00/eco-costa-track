import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustoDialog } from "@/components/custos/CustoDialog";
import { CustosTable } from "@/components/custos/CustosTable";
import { CustosFilters } from "@/components/custos/CustosFilters";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { toast } from "sonner";

export default function Custos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCusto, setEditingCusto] = useState<any>(null);
  const [selectedObra, setSelectedObra] = useState("all");
  const [selectedTipo, setSelectedTipo] = useState("all");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
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

  // Filtrar custos
  const custosFiltrados = custos?.filter((custo) => {
    if (selectedObra !== "all" && custo.obra_id !== selectedObra) return false;
    if (selectedTipo !== "all" && custo.tipo_operacao !== selectedTipo) return false;
    if (dataInicio && custo.data < dataInicio) return false;
    if (dataFim && custo.data > dataFim) return false;
    return true;
  }) || [];

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

  const handleExportCSV = () => {
    exportToCSV(custosFiltrados, "custos");
    toast.success("CSV exportado com sucesso!");
  };

  const handleExportPDF = () => {
    exportToPDF(custosFiltrados, "custos");
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

      <CustosFilters
        obras={obras || []}
        selectedObra={selectedObra}
        setSelectedObra={setSelectedObra}
        selectedTipo={selectedTipo}
        setSelectedTipo={setSelectedTipo}
        dataInicio={dataInicio}
        setDataInicio={setDataInicio}
        dataFim={dataFim}
        setDataFim={setDataFim}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
      />

      <CustosTable
        custos={custosFiltrados}
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
