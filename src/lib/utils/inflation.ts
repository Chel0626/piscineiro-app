// Busca o índice de inflação acumulado (IPCA) entre duas datas usando a API do Banco Central (exemplo)
export async function fetchInflationIndex(startDate: string, endDate: string): Promise<number | null> {
  try {
    // Exemplo de endpoint do SGS Banco Central: IPCA código 433
    // Datas no formato YYYY-MM-DD
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    // Soma dos índices mensais
    const total = data.reduce((acc: number, item: { valor: string }) => acc + parseFloat(item.valor), 0);
    return total;
  } catch {
    return null;
  }
}
