import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";

interface CustosFiltersProps {
  obras: any[];
  gastos: any[];
  observacoes: string[];
  selectedObra: string;
  setSelectedObra: (value: string) => void;
  selectedGasto: string;
  setSelectedGasto: (value: string) => void;
  selectedTipo: string;
  setSelectedTipo: (value: string) => void;
  selectedObservacao: string;
  setSelectedObservacao: (value: string) => void;
  dataInicio: string;
  setDataInicio: (value: string) => void;
  dataFim: string;
  setDataFim: (value: string) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export function CustosFilters({
  obras,
  gastos,
  observacoes,
  selectedObra,
  setSelectedObra,
  selectedGasto,
  setSelectedGasto,
  selectedTipo,
  setSelectedTipo,
  selectedObservacao,
  setSelectedObservacao,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  onExportCSV,
  onExportPDF,
}: CustosFiltersProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Central de Custos</Label>
          <Select value={selectedObra} onValueChange={setSelectedObra}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {obras?.map((obra) => (
                <SelectItem key={obra.id} value={obra.id}>
                  {obra.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Obra/Projeto</Label>
          <Select value={selectedGasto} onValueChange={setSelectedGasto}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {gastos?.map((gasto) => (
                <SelectItem key={gasto.id} value={gasto.id}>
                  {gasto.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo de Operação</Label>
          <Select value={selectedTipo} onValueChange={setSelectedTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Pix enviado">Pix enviado</SelectItem>
              <SelectItem value="Pix recebido">Pix recebido</SelectItem>
              <SelectItem value="TED">TED</SelectItem>
              <SelectItem value="DOC">DOC</SelectItem>
              <SelectItem value="Débito">Débito</SelectItem>
              <SelectItem value="Crédito">Crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Data Início</Label>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>

        <div>
          <Label>Data Fim</Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>

        <div>
          <Label>Observação</Label>
          <Select value={selectedObservacao} onValueChange={setSelectedObservacao}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {observacoes?.map((obs, idx) => (
                <SelectItem key={idx} value={obs}>
                  {obs}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
        <Button variant="outline" onClick={onExportPDF}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>
    </div>
  );
}
