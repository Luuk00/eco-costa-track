import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isoToPtBr } from "@/lib/dateUtils";

export const exportToCSV = (custos: any[], filename: string = "custos") => {
  const headers = [
    "Data",
    "Central de Custos",
    "Obra/Projeto",
    "Tipo Transação",
    "Receptor/Destinatário",
    "Descrição",
    "Tipo",
    "Observação",
    "Valor",
  ];

  const totalEntradas = custos
    .filter(c => c.tipo_transacao === 'Entrada')
    .reduce((sum, c) => sum + c.valor, 0);
  
  const totalSaidas = custos
    .filter(c => c.tipo_transacao === 'Saída')
    .reduce((sum, c) => sum + c.valor, 0);
  
  const totalLiquido = totalEntradas - totalSaidas;

  const rows = custos.map((custo) => {
    const dataFormatada = isoToPtBr(String(custo.data));
    return [
      dataFormatada,
      custo.descricao || "",
      custo.valor?.toFixed(2) || "0.00",
      custo.tipo_operacao || "",
    ];
  });

    
    return [
      dataFormatada,
      custo.obras?.nome || "-",
      custo.gastos?.nome || "-",
      custo.tipo_transacao || "-",
      custo.receptor_destinatario || "-",
      custo.descricao || "-",
      custo.tipo_operacao || "-",
      custo.observacao || "-",
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(custo.valor),
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    "",
    `"","","","","","","","Total de Entradas:","${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalEntradas)}"`,
    `"","","","","","","","Total de Saídas:","${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalSaidas)}"`,
    `"","","","","","","","Total Líquido (Entradas - Saídas):","${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalLiquido)}"`,
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (custos: any[], filename: string = "custos") => {
  const headers = [
    "Data",
    "Central de Custos",
    "Obra/Projeto",
    "Tipo Transação",
    "Receptor/Destinatário",
    "Descrição",
    "Tipo",
    "Observação",
    "Valor",
  ];

  const totalEntradas = custos
    .filter(c => c.tipo_transacao === 'Entrada')
    .reduce((sum, c) => sum + c.valor, 0);
  
  const totalSaidas = custos
    .filter(c => c.tipo_transacao === 'Saída')
    .reduce((sum, c) => sum + c.valor, 0);
  
  const totalLiquido = totalEntradas - totalSaidas;

  const rows = custos.map((custo) => {
    const [ano, mes, dia] = custo.data.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    
    return [
      dataFormatada,
      custo.obras?.nome || "-",
      custo.gastos?.nome || "-",
      custo.tipo_transacao || "-",
      custo.receptor_destinatario || "-",
      custo.descricao || "-",
      custo.tipo_operacao || "-",
      custo.observacao || "-",
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(custo.valor),
    ];
  });

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #047857; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #047857; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .total { font-weight: bold; background-color: #e0f2f1; }
      </style>
    </head>
    <body>
      <h1>Relatório de Custos - MAP AMBIENTAL</h1>
      <p>Data de geração: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
          <tr class="total">
            <td colspan="8">Total de Entradas:</td>
            <td>${new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(custos.filter(c => c.tipo_transacao === 'Entrada').reduce((sum, c) => sum + c.valor, 0))}</td>
          </tr>
          <tr class="total">
            <td colspan="8">Total de Saídas:</td>
            <td>${new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(custos.filter(c => c.tipo_transacao === 'Saída').reduce((sum, c) => sum + c.valor, 0))}</td>
          </tr>
          <tr class="total">
            <td colspan="8">Total Líquido (Entradas - Saídas):</td>
            <td>${new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(custos.reduce((sum, c) => {
              const valor = c.valor;
              return c.tipo_transacao === 'Entrada' ? sum + valor : sum - valor;
            }, 0))}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};
