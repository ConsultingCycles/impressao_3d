import * as XLSX from 'xlsx';
import { Product } from '../types';

interface ParsedOrder {
  externalId: string;
  date: string;
  customer: string;
  items: {
    sku: string;
    quantity: number;
    price: number;
    name: string;
  }[];
  total: number;
}

export const parseShopeeExcel = async (file: File, systemProducts: Product[]): Promise<{ valid: ParsedOrder[], errors: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const ordersMap = new Map<string, ParsedOrder>();
        const errors: string[] = [];

        jsonData.forEach((row: any) => {
          // Mapeamento de colunas (Várias possibilidades para evitar erro)
          const orderId = row['Número do pedido'] || row['Order ID'] || row['order_sn'];
          const status = row['Status do pedido'] || row['Order Status'];
          
          if (!orderId) return;
          if (status && (status.includes('Cancelado') || status.includes('Cancelled'))) return;

          // TRATAMENTO DE SKU (O Segredo)
          let skuRaw = row['SKU de referência'] || row['Parent SKU'] || row['Código do produto'] || '';
          const sku = skuRaw ? String(skuRaw).trim() : '';
          
          const qty = Number(row['Quantidade'] || row['Quantity'] || 1);
          const price = Number(row['Preço do acordo'] || row['Deal Price'] || row['Preço unitário'] || 0);
          
          const dateStr = row['Data de criação do pedido'] || row['Order Creation Date'];
          const customer = row['Nome do destinatário'] || 'Cliente Shopee';

          // CORREÇÃO AQUI: Verifica se p.sku existe antes de comparar
          const product = systemProducts.find(p => p.sku && p.sku.trim() === sku);
          
          // Se não achar o produto, a gente avisa no console para debug
          if (!product && sku) {
            console.warn(`Aviso: SKU da planilha "${sku}" não encontrado no sistema.`);
          }

          if (!ordersMap.has(orderId)) {
            ordersMap.set(orderId, {
              externalId: String(orderId),
              date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
              customer: String(customer),
              items: [],
              total: 0
            });
          }

          const currentOrder = ordersMap.get(orderId)!;
          
          currentOrder.items.push({
            sku,
            quantity: qty,
            price: price,
            name: row['Nome do produto'] || 'Produto Shopee'
          });
          
          currentOrder.total += (price * qty);
        });

        resolve({ valid: Array.from(ordersMap.values()), errors });

      } catch (error) {
        console.error(error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};