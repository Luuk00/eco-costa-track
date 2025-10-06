import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { ImportPreview } from "@/components/importar/ImportPreview";

export default function ImportarCSV() {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");

  const processCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    
    if (lines.length < 3) {
      toast.error("Arquivo CSV inválido");
      return;
    }

    // Ignorar primeira e última linha (saldos)
    const dataLines = lines.slice(1, -1);
    
    const lancamentosProcessados = dataLines.map((line) => {
      const columns = line.split(";");
      
      // Coluna M (índice 12): processar nome
      let nome = columns[12] || "";
      // Remover números iniciais se começar com dígitos
      nome = nome.replace(/^\d+[\s\/\-:]*/g, "").trim();
      
      // Converter data de DD/MM/AAAA para AAAA-MM-DD
      const dataOriginal = columns[3] || "";
      let dataFormatada = dataOriginal;
      if (dataOriginal && dataOriginal.includes("/")) {
        const partes = dataOriginal.split("/");
        if (partes.length === 3) {
          const dia = partes[0].padStart(2, "0");
          const mes = partes[1].padStart(2, "0");
          const ano = partes[2];
          dataFormatada = `${ano}-${mes}-${dia}`;
        }
      }
      
      return {
        data: dataFormatada,
        documento: columns[7] || "", // Coluna H
        codigo_operacao: columns[8] || "", // Coluna I
        tipo_operacao: columns[9] || "", // Coluna J
        valor: columns[10] ? parseFloat(columns[10].replace(",", ".")) : 0, // Coluna K
        nome: nome,
        obra_id: null,
      };
    });

    setLancamentos(lancamentosProcessados);
    toast.success(`${lancamentosProcessados.length} lançamentos importados`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSV(text);
    };
    reader.readAsText(file, "ISO-8859-1"); // Encoding comum do Banco do Brasil
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Importar CSV</h1>
        <p className="text-muted-foreground">
          Importe extratos bancários do Banco do Brasil
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-12 hover:border-primary transition-colors">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {fileName || "Selecione um arquivo CSV do Banco do Brasil"}
            </p>
            <label htmlFor="csv-upload">
              <Button asChild>
                <span>Selecionar Arquivo</span>
              </Button>
            </label>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="mt-4 text-sm text-muted-foreground space-y-1">
            <p className="font-medium">Formato esperado:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Arquivo CSV separado por ponto e vírgula (;)</li>
              <li>Primeira linha: saldo inicial (será ignorada)</li>
              <li>Última linha: saldo final (será ignorada)</li>
              <li>Coluna D: Data | Coluna H: Documento | Coluna I: Código</li>
              <li>Coluna J: Tipo | Coluna K: Valor | Coluna M: Nome</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {lancamentos.length > 0 && (
        <ImportPreview
          lancamentos={lancamentos}
          onUpdate={setLancamentos}
          onComplete={() => {
            setLancamentos([]);
            setFileName("");
          }}
        />
      )}
    </div>
  );
}
