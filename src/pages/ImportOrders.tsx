import { useState, useRef } from 'react';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore'; // <--- Import Novo
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { parseShopeeExcel } from '../utils/shopeeParser';
import { useNavigate } from 'react-router-dom';

export const ImportOrders = () => {
  const { marketplaces, products, importOrdersBatch } = useDataStore();
  const { confirm } = useUIStore(); // <--- Hook do Modal
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedMarketplace, setSelectedMarketplace] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLoading(true);
      
      try {
        const { valid } = await parseShopeeExcel(e.target.files[0], products);
        setPreviewData(valid);
      } catch (err) {
        await confirm('Erro ao ler arquivo. Verifique se é um relatório da Shopee válido.', 'Erro de Leitura', 'danger');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedMarketplace) {
      await confirm('Por favor, selecione o canal de venda de origem.', 'Atenção', 'info');
      return;
    }

    setProcessing(true);
    await importOrdersBatch(previewData, selectedMarketplace);
    setProcessing(false);
    
    await confirm('Importação concluída! Os pedidos novos foram adicionados.', 'Sucesso', 'info');
    navigate('/orders');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3">
        <Upload className="text-cyan-400" /> Importar Pedidos
      </h1>

      {/* Passo 1: Configuração */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">1. Canal de Venda (Origem)</label>
            <select 
              value={selectedMarketplace} 
              onChange={(e) => setSelectedMarketplace(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Selecione...</option>
              {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">2. Arquivo de Pedidos (.xlsx)</label>
            <input 
              type="file" 
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-600 hover:border-cyan-500 bg-gray-700/30 hover:bg-gray-700 text-gray-300 rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors"
            >
              <FileSpreadsheet size={20} />
              {file ? file.name : 'Clique para selecionar o arquivo da Shopee'}
            </button>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex gap-3 text-sm text-blue-200">
          <AlertTriangle className="shrink-0" size={18} />
          <p>
            O sistema usará o <strong>SKU</strong> do Excel para vincular aos seus produtos. 
            Certifique-se de que os SKUs na Shopee são idênticos aos cadastrados aqui.
          </p>
        </div>
      </div>

      {/* Passo 2: Prévia */}
      {loading && <div className="text-center text-white py-10">Lendo arquivo...</div>}

      {!loading && previewData.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden animate-fade-in">
          <div className="p-4 bg-gray-750 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-white">Prévia da Importação ({previewData.length} pedidos encontrados)</h3>
            <span className="text-sm text-gray-400">Total Bruto: R$ {previewData.reduce((acc, o) => acc + o.total, 0).toFixed(2)}</span>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-700 text-gray-100 sticky top-0">
                <tr>
                  <th className="p-3">ID Pedido</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Itens (SKU)</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {previewData.map((order) => (
                  <tr key={order.externalId} className="hover:bg-gray-700/50">
                    <td className="p-3 font-mono text-xs text-cyan-400">{order.externalId}</td>
                    <td className="p-3 text-xs">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="p-3">{order.customer}</td>
                    <td className="p-3">
                      {order.items.map((i: any, idx: number) => (
                        <div key={idx} className="flex gap-2 text-xs">
                          <span className={products.find(p => p.sku === i.sku) ? 'text-green-400' : 'text-red-400 font-bold'}>
                            {i.quantity}x {i.sku || '(Sem SKU)'}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="p-3 text-right text-white font-medium">R$ {order.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-750 border-t border-gray-700 flex justify-end">
            <button 
              onClick={handleImport}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              {processing ? <Loader className="animate-spin" /> : <CheckCircle />}
              {processing ? 'Importando...' : 'Confirmar Importação'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};