import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GastosTableProps {
  gastos: any[];
  isLoading: boolean;
  onEdit: (gasto: any) => void;
  onDelete: (id: string) => void;
}

export function GastosTable({
  gastos,
  isLoading,
  onEdit,
  onDelete,
}: GastosTableProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    const [ano, mes, dia] = dateString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Fim</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gastos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhum gasto cadastrado
              </TableCell>
            </TableRow>
          ) : (
            gastos.map((gasto) => (
              <TableRow key={gasto.id}>
                <TableCell className="font-medium">{gasto.nome}</TableCell>
                <TableCell>{gasto.cliente}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      gasto.status === "concluída"
                        ? "default"
                        : gasto.status === "em andamento"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {gasto.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(gasto.data_inicio)}</TableCell>
                <TableCell>
                  {gasto.data_fim ? formatDate(gasto.data_fim) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/gastos/${gasto.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(gasto)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(gasto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
