export function csvBBDateToISO(dateStr?: string): string {
// Converte DD/MM/YYYY (Banco do Brasil) -> YYYY-MM-DD
// Não usa new Date() — apenas manipulação de string para evitar erro de fuso e formato.
if (!dateStr) return "";
const s = dateStr.trim();
if (s.includes("/")) {
const partes = s.split("/");
if (partes.length === 3) {
const [dia, mes, ano] = partes;
return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}
}
// Se já vier em formato ISO ou outro, retorna o original
return s;
}

export function isoToPtBr(iso?: string): string {
// Converte YYYY-MM-DD -> DD/MM/YYYY (apenas texto, sem new Date)
if (!iso) return "-";
const s = iso.trim();
if (s.includes("-")) {
const partes = s.split("-");
if (partes.length >= 3) {
const [ano, mes, dia] = partes;
return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
}
}
if (s.includes("/")) return s;
return s;
}
