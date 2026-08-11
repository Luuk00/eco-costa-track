import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { ImportPreview } from "@/components/importar/ImportPreview";
import { useAuth } from "@/contexts/AuthContext";

export default function ImportarCSV() {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");
  const { empresaAtiva } = useAuth();

  // ---------- Detecção automática do banco ----------
  const detectarBanco = (text: string): "bradesco" | "bb" => {
    const normalized = text.toLowerCase();
    if (
      normalized.includes("lançamento;dcto") ||
      normalized.includes("lancamento;dcto") ||
      (normalized.includes("crédito (r$)") && normalized.includes("débito (r$)")) ||
      (normalized.includes("credito (r$)") && normalized.includes("debito (r$)"))
    ) {
      return "bradesco";
    }
    return "bb";
  };

  // ---------- Helpers Bradesco ----------
  const parseValorBR = (raw: string) => {
    if (!raw) return 0;
    const cleaned = raw.replace(/[^\d,.\-]/g, "").replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const dataBRparaISO = (raw: string) => {
    const partes = (raw || "").trim().split(/[\/.]/);
    if (partes.length !== 3) return "";
    const [dia, mes, ano] = partes;
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  };

  const interpretarLancamentoBradesco = (descricaoOriginal: string) => {
    const descricao = (descricaoOriginal || "").replace(/\s+/g, " ").trim();
    const upper = descricao.toUpperCase();

    const limparNome = (valor: string) =>
      valor
        .replace(/\s+\d{2}\/\d{2}(\/\d{2,4})?\s*$/, "") // remove data final DD/MM
        .replace(/\s+/g, " ")
        .trim();

    if (upper.startsWith("PIX ENVIADO")) {
      const nome = limparNome(descricao.replace(/^PIX\s+ENVIADO(\s+DES:?)?/i, ""));
      return { tipo: "Pix - Enviado", nome: nome || descricao };
    }

    if (upper.startsWith("PIX RECEBIDO")) {
      const nome = limparNome(descricao.replace(/^PIX\s+RECEBIDO(\s+(DES|REM|REMET)\.?:?)?/i, ""));
      return { tipo: "Pix - Recebido", nome: nome || descricao };
    }

    const mapa: { match: string; tipo: string }[] = [
      { match: "PAGTO ELETRON", tipo: "Pagamento Eletrônico" },
      { match: "GASTOS CARTAO", tipo: "Cartão de Crédito" },
      { match: "TARIFA", tipo: "Tarifa Bancária" },
      { match: "TED", tipo: "TED" },
      { match: "DOC", tipo: "DOC" },
      { match: "MORA", tipo: "Juros / Mora" },
      { match: "CAPITAL DE GIRO", tipo: "Capital de Giro" },
      { match: "TRANSFERENCIA", tipo: "Transferência" },
    ];

    const encontrado = mapa.find((m) => upper.includes(m.match));
    return {
      tipo: encontrado ? encontrado.tipo : descricao.split(" ").slice(0, 3).join(" ") || "Outros",
      nome: limparNome(descricao),
    };
  };

  const processCSVBradesco = (text: string) => {
    const lines = text.split(/\r?\n/);
    const ignorar = [
      "extrato de",
      "saldo anterior",
      "total",
      "saldos invest",
      "saldo invest",
      "últimos lançamentos",
      "ultimos lancamentos",
      "data;lançamento",
      "data;lancamento",
    ];

    const lancamentosProcessados = lines
      .map((line) => {
        if (!line || !line.trim()) return null;
        const lower = line.toLowerCase().trim();
        if (ignorar.some((termo) => lower.startsWith(termo))) return null;

        const cols = line.split(";");
        if (cols.length < 5) return null;

        const dataISO = dataBRparaISO(cols[0]);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) return null;

        const descricao = cols[1] || "";
        const documento = (cols[2] || "").trim();
        const creditoRaw = (cols[3] || "").trim();
        const debitoRaw = (cols[4] || "").trim();

        const isCredito = creditoRaw !== "";
        const valorBruto = parseValorBR(isCredito ? creditoRaw : debitoRaw);
        if (!valorBruto) return null;

        const { tipo, nome } = interpretarLancamentoBradesco(descricao);

        return {
          data: dataISO,
          documento,
          codigo_operacao: "",
          tipo_operacao: tipo,
          valor: Math.abs(valorBruto),
          nome,
          obra_id: null,
          gasto_id: null,
          tipo_transacao: isCredito ? "Entrada" : "Saída",
          empresa_id: empresaAtiva || null,
        };
      })
      .filter(Boolean) as any[];

    if (lancamentosProcessados.length === 0) {
      toast.error("Nenhum lançamento válido encontrado no extrato Bradesco");
      return;
    }

    setLancamentos(lancamentosProcessados);
    toast.success(`${lancamentosProcessados.length} lançamentos importados (Bradesco)`);
  };

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
      
      // Converter data de DD/MM/AAAA ou DD.MM.AAAA para AAAA-MM-DD
      const dataOriginal = columns[3] || "";
      let dataFormatada = dataOriginal;
      if (dataOriginal && (dataOriginal.includes("/") || dataOriginal.includes("."))) {
        const partes = dataOriginal.split(/[\/.]/);
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
        gasto_id: null,
        tipo_transacao: null,
        empresa_id: empresaAtiva || null,
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
      if (detectarBanco(text) === "bradesco") {
        processCSVBradesco(text);
      } else {
        processCSV(text);
      }
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
