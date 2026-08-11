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

  // ---------- Helpers ----------
  const normalize = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  // ---------- Detecção automática do banco ----------
  const detectarBanco = (text: string): "bradesco" | "bb" => {
    const linhas = text.split(/\r\n|\n|\r/);
    const temCabecalhoBradesco = linhas.some((linha) => {
      const n = normalize(linha);
      return (
        n.includes("lancamento") &&
        n.includes("credito") &&
        n.includes("debito") &&
        n.includes("saldo")
      );
    });
    return temCabecalhoBradesco ? "bradesco" : "bb";
  };

  // ---------- Helpers Bradesco ----------
  const parseBRL = (value?: string): number | null => {
    if (!value || !value.trim()) return null;
    const normalized = value
      .trim()
      .replace(/"/g, "")
      .replace(/R\$/gi, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    if (!normalized || normalized === "-") return null;
    const number = Number(normalized);
    return Number.isNaN(number) ? null : number;
  };

  const dataBRparaISO = (raw: string) => {
    const partes = (raw || "").trim().split(/[\/.]/);
    if (partes.length !== 3) return "";
    const [dia, mes, ano] = partes;
    return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  };

  const interpretarLancamentoBradesco = (
    descricaoOriginal: string,
    natureza: "entrada" | "saida"
  ) => {
    const descricao = (descricaoOriginal || "").replace(/"/g, "").replace(/\s+/g, " ").trim();
    const upper = normalize(descricao).toUpperCase();

    const limparNome = (valor: string) =>
      valor
        .replace(/\s+\d{2}\/\d{2}(\/\d{2,4})?\s*$/, "") // remove data final DD/MM
        .replace(/\s+/g, " ")
        .trim();

    if (upper.startsWith("PIX ENVIADO")) {
      const nome = limparNome(descricao.replace(/^PIX\s+ENVIADO(\s+DES\.?:?)?/i, ""));
      return { tipo: "Pix - Enviado", nome: nome || descricao };
    }

    if (upper.startsWith("PIX RECEBIDO")) {
      const nome = limparNome(
        descricao.replace(/^PIX\s+RECEBIDO(\s+(DES|REM|REMET)\.?:?)?/i, "")
      );
      return { tipo: "Pix - Recebido", nome: nome || descricao };
    }

    if (upper.startsWith("TED") || upper.includes("TRANSF ELET")) {
      const nome = limparNome(
        descricao.replace(/^TED[\s-]*TRANSF\s+ELET\s+DISPON\s*(REMET\.?)?/i, "")
      );
      return {
        tipo: natureza === "entrada" ? "TED - Recebida" : "TED - Enviada",
        nome: nome || descricao,
      };
    }

    const mapa: { match: string; tipo: string }[] = [
      { match: "PAGTO ELETRON", tipo: "Pagamento Eletrônico" },
      { match: "GASTOS CARTAO", tipo: "Cartão de Crédito" },
      { match: "TARIFA", tipo: "Tarifa Bancária" },
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
    const lines = text.split(/\r\n|\n|\r/);
    const dataRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    const lancamentosProcessados: any[] = [];

    for (const line of lines) {
      if (!line || !line.trim()) continue;

      const n = normalize(line);

      // A partir da seção de investimentos, paramos de importar
      if (n.includes("saldos invest")) break;

      if (
        n.startsWith("saldo anterior") ||
        n.includes(";saldo anterior") ||
        n.startsWith("total") ||
        n.includes("saldo invest")
      ) {
        continue;
      }

      const cols = line.split(";").map((c) => c.replace(/"/g, "").trim());
      if (cols.length < 6) continue;
      if (!dataRegex.test(cols[0])) continue;

      const dataISO = dataBRparaISO(cols[0]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) continue;

      const credito = parseBRL(cols[3]);
      const debito = parseBRL(cols[4]);

      let valor: number | null = null;
      let natureza: "entrada" | "saida" = "saida";

      if (credito !== null && credito !== 0) {
        valor = Math.abs(credito);
        natureza = "entrada";
      } else if (debito !== null && debito !== 0) {
        valor = Math.abs(debito);
        natureza = "saida";
      }

      if (valor === null) continue;

      const { tipo, nome } = interpretarLancamentoBradesco(cols[1], natureza);

      lancamentosProcessados.push({
        data: dataISO,
        documento: cols[2] || "",
        codigo_operacao: "",
        tipo_operacao: tipo,
        valor,
        nome,
        obra_id: null,
        gasto_id: null,
        tipo_transacao: natureza === "entrada" ? "Entrada" : "Saída",
        empresa_id: empresaAtiva || null,
      });
    }

    if (lancamentosProcessados.length === 0) {
      console.log("Banco detectado:", "bradesco");
      console.log("Total linhas:", lines.length);
      console.log("Primeiras linhas:", lines.slice(0, 10));
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
