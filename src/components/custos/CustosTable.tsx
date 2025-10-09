import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustosTableProps {
  custos: any[];
  isLoading: boolean;
  onEdit: (custo: any) => void;
  onDelete: (id: string) => void;
  ordenacaoData: "asc" | "desc";
  setOrdenacaoData: (ordenacao: "asc" | "desc") => void;
}

export function CustosTable({ custos, isLoading, onEdit, onDelete, ordenacaoData, setOrdenacaoData }: CustosTableProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (custos.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">Nenhum custo cadastrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center gap-2">
                Data
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOrdenacaoData(ordenacaoData === "asc" ? "desc" : "asc")}
                  className="h-6 w-6 p-0"
                >
                  {ordenacaoData === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </TableHead>
            <TableHead>Central de Custos</TableHead>
            <TableHead>Obra/Projeto</TableHead>
            <TableHead>Tipo Transação</TableHead>
            <TableHead>Receptor/Destinatário</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Observação</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {custos.map((custo) => {
            // Parsear data corretamente do formato YYYY-MM-DD
            const [ano, mes, dia] = custo.data.split('-');
            const dataFormatada = `${dia}/${mes}/${ano}`;
            
            return (
            <TableRow key={custo.id}>
              <TableCell>
                {dataFormatada}
              </TableCell>
              <TableCell className="font-medium">
                {custo.obras?.nome || "-"}
              </TableCell>
              <TableCell className="font-medium">
                {custo.gastos?.nome || "-"}
              </TableCell>
              <TableCell>
                {custo.tipo_transacao ? (
                  <span className={custo.tipo_transacao === 'Entrada' ? 'text-green-600' : 'text-red-600'}>
                    {custo.tipo_transacao}
                  </span>
                ) : "-"}
              </TableCell>
              <TableCell>{custo.receptor_destinatario || "-"}</TableCell>
              <TableCell>{custo.descricao || "-"}</TableCell>
              <TableCell>{custo.tipo_operacao || "-"}</TableCell>
              <TableCell className="max-w-xs truncate">{custo.observacao || "-"}</TableCell>
              <TableCell className="text-right font-semibold text-secondary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(custo.valor)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(custo)}
                  className="mr-2"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(custo.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
