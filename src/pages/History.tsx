import { useEffect, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { Trash2, FileText, Search, Eye, X, Factory } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Print } from '../types';
import logo from '../assets/logo.png';

export const History = () => {
  const { prints, filaments, products, printers, fetchData, deletePrint } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrint, setSelectedPrint] = useState<Print | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helpers para buscar nomes
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Produto Excluído';
  const getPrinterName = (id: string) => printers.find(p => p.id === id)?.name || 'Desconhecida';
  const getFilamentName = (id: string) => {
    const f = filaments.find(fil => fil.id === id);
    return f ? `${f.name} (${f.brand})` : 'Filamento Excluído';
  };

  const filteredPrints = prints.filter(p => {
    const prodName = getProductName(p.product_id).toLowerCase();
    return prodName.includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de produção?')) {
      await deletePrint(id);
    }
  };

  const openDetails = (print: Print) => setSelectedPrint(print);
  const closeDetails = () => setSelectedPrint(null);

  const exportPDF = () => {
    const doc = new jsPDF();
    const logoImg = new Image();
    logoImg.src = logo;

    logoImg.onload = () => {
      doc.addImage(logoImg, 'PNG', 15, 10, 30, 12);
      doc.setFontSize(18);
      doc.setTextColor(30, 136, 229);
      doc.text('Relatório de Produção', 195, 20, { align: 'right' });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 195, 26, { align: 'right' });

      const tableData = filteredPrints.map(p => [
        new Date(p.print_date).toLocaleDateString(),
        getProductName(p.product_id),
        getPrinterName(p.printer_id),
        p.quantity_produced,
        `R$ ${(p.cost_filament_total + p.cost_energy + p.cost_depreciation + p.cost_additional).toFixed(2)}`
      ]);

      autoTable(doc, {
        head: [['Data', 'Produto', 'Impressora', 'Qtd', 'Custo Total']],
        body: tableData,
        startY: 35,
        headStyles: { fillColor: [30, 136, 229] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save('historico_producao.pdf');
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Factory className="text-cyan-400" /> Histórico de Produção
        </h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar produção..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium transition"
          >
            <FileText size={20} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPrints.length === 0 ? (
          <p className="text-gray-400 text-center py-12">Nenhuma produção registrada.</p>
        ) : (
          filteredPrints.map(print => {
            const totalCost = print.cost_filament_total + print.cost_energy + print.cost_depreciation + print.cost_additional;
            
            return (
              <div key={print.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500/50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{getProductName(print.product_id)}</h3>
                      <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded text-xs font-bold">
                        {print.quantity_produced} un
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4">
                      Produzido em {new Date(print.print_date).toLocaleDateString()} na impressora <span className="text-white">{getPrinterName(print.printer_id)}</span>
                    </p>

                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-500 block text-xs">Custo Total do Lote</span>
                        <span className="text-white font-bold">R$ {totalCost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">Custo Unitário</span>
                        <span className="text-green-400 font-bold">R$ {print.unit_cost_final.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openDetails(print)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-cyan-400">
                      <Eye size={20} />
                    </button>
                    <button onClick={() => handleDelete(print.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition text-red-400">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedPrint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
              <h2 className="text-2xl font-bold text-white">Detalhes do Lote</h2>
              <button onClick={closeDetails} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <span className="block text-gray-400 text-xs">Produto</span>
                  <span className="text-white font-medium">{getProductName(selectedPrint.product_id)}</span>
                </div>
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <span className="block text-gray-400 text-xs">Data</span>
                  <span className="text-white font-medium">{new Date(selectedPrint.print_date).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="text-cyan-400 font-medium mb-2 text-sm uppercase">Filamentos Usados</h4>
                <div className="space-y-2">
                  {selectedPrint.filaments_used?.map((f, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-700/30 p-2 rounded">
                      <span className="text-gray-300">{getFilamentName(f.filament_id)}</span>
                      <span className="text-white">{f.material_weight_g}g</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-cyan-400 font-medium mb-2 text-sm uppercase">Composição de Custo</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">Filamento</span>
                    <span className="text-white">R$ {selectedPrint.cost_filament_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">Energia ({selectedPrint.print_time_minutes} min)</span>
                    <span className="text-white">R$ {selectedPrint.cost_energy.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-1">
                    <span className="text-gray-400">Depreciação</span>
                    <span className="text-white">R$ {selectedPrint.cost_depreciation.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-gray-400">Custos Extras</span>
                    <span className="text-white">R$ {selectedPrint.cost_additional.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                <span className="text-green-400 font-medium">Custo Unitário Final</span>
                <span className="text-2xl font-bold text-green-400">R$ {selectedPrint.unit_cost_final.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};