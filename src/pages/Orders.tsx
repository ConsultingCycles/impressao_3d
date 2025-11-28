import { useEffect, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore'; // <--- NOVO
import { PackageCheck, Plus, CheckCircle, Printer, Square, CheckSquare, Hash, Edit2, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/logo.png';

export const Orders = () => {
  const { orders, marketplaces, products, fetchData, finalizeOrder, deleteOrder } = useDataStore();
  const { confirm } = useUIStore(); // <--- NOVO
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- MODAL PARA FINALIZAR PEDIDO ---
  const handleFinalize = async (id: string) => {
    const confirmed = await confirm(
      'Deseja efetivar a saída deste pedido? Isso irá baixar os itens do estoque e não poderá ser desfeito.',
      'Confirmar Venda',
      'info' // ícone de informação
    );
    if (confirmed) await finalizeOrder(id);
  };

  // --- MODAL PARA EXCLUIR PEDIDO ---
  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      'Tem certeza que deseja EXCLUIR este pedido? Esta ação não pode ser desfeita.',
      'Excluir Pedido',
      'danger' // ícone de perigo
    );
    if (confirmed) await deleteOrder(id);
  };

  const getMarketplaceName = (id: string) => marketplaces.find(m => m.id === id)?.name || 'Venda Direta';

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map(o => o.id));
    }
  };

  const handlePrintSelection = () => {
    const doc = new jsPDF();
    const logoImg = new Image();
    logoImg.src = logo;

    logoImg.onload = () => {
      const ordersToPrint = orders.filter(o => selectedIds.includes(o.id));

      ordersToPrint.forEach((order, index) => {
        if (index > 0) doc.addPage();

        doc.addImage(logoImg, 'PNG', 15, 10, 30, 12);
        
        doc.setFontSize(24);
        doc.setTextColor(33, 33, 33);
        doc.text('Ordem de Separação', 195, 20, { align: 'right' });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, 28, 195, 28);

        const startY = 35;
        const col1 = 15;
        const col2 = 110;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        
        doc.text('CLIENTE', col1, startY);
        doc.text('CANAL DE VENDA', col1, startY + 12);
        
        doc.text('DATA DO PEDIDO', col2, startY);
        doc.text('CÓD. PEDIDO EXTERNO', col2, startY + 12);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        
        doc.text(order.customer_name.toUpperCase(), col1, startY + 5);
        doc.text(getMarketplaceName(order.marketplace_id), col1, startY + 17);
        
        doc.text(new Date(order.order_date).toLocaleDateString(), col2, startY + 5);
        
        if (order.marketplace_order_id) {
          doc.setFillColor(240, 240, 240);
          doc.rect(col2 - 2, startY + 13, 60, 6, 'F');
          doc.setFont('helvetica', 'bold');
          doc.text(order.marketplace_order_id, col2, startY + 17);
          doc.setFont('helvetica', 'normal');
        } else {
          doc.text('-', col2, startY + 17);
        }

        const tableData = order.items?.map(item => {
          const prod = products.find(p => p.id === item.product_id);
          return [
            prod?.sku || '-',
            prod?.name || 'Item Removido',
            item.quantity,
            '[   ]'
          ];
        }) || [];

        autoTable(doc, {
          startY: 65,
          head: [['SKU', 'PRODUTO', 'QTD', 'CONFERE']],
          body: tableData,
          theme: 'striped',
          headStyles: { 
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: { fontSize: 11, cellPadding: 4, textColor: [50, 50, 50] },
          columnStyles: {
            0: { cellWidth: 30, fontStyle: 'bold' },
            2: { cellWidth: 20, halign: 'center', fontStyle: 'bold', fontSize: 12 },
            3: { cellWidth: 30, halign: 'center' }
          },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 30;
        doc.setDrawColor(150, 150, 150);
        doc.line(15, finalY, 85, finalY);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('Responsável pela Separação', 15, finalY + 5);
        doc.line(125, finalY, 195, finalY);
        doc.text('Responsável pela Conferência', 125, finalY + 5);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(`Custo3D - Gerado em ${new Date().toLocaleString()}`, 105, 290, { align: 'center' });
      });

      doc.save('ordem-de-separacao.pdf');
    };
  };

  return (
    <div className="space-y-6 pb-24 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <PackageCheck className="text-cyan-400" /> Pedidos de Venda
        </h1>
        <div className="flex gap-3">
          <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white text-sm flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition">
            {selectedIds.length === orders.length ? <CheckSquare size={18} /> : <Square size={18} />}
            {selectedIds.length === orders.length ? 'Desmarcar Todos' : 'Marcar Todos'}
          </button>
          <Link to="/orders/new" className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <Plus size={20} /> Novo Pedido
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => {
          const isSelected = selectedIds.includes(order.id);
          const isShipped = order.status === 'shipped';

          return (
            <div 
              key={order.id} 
              className={`relative bg-gray-800 border rounded-xl p-6 transition-all cursor-pointer group ${isSelected ? 'border-cyan-500 ring-1 ring-cyan-500 bg-gray-800/80' : 'border-gray-700 hover:border-cyan-500/50'}`}
              onClick={() => toggleSelect(order.id)}
            >
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                {isSelected ? <CheckSquare className="text-cyan-400 w-6 h-6" /> : <Square className="text-gray-600 w-6 h-6 group-hover:text-gray-400" />}
              </div>

              <div className="pl-10 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">{order.customer_name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${isShipped ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {isShipped ? 'Finalizado' : 'Aberto'}
                    </span>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-gray-400 mt-2">
                    <p>{new Date(order.order_date).toLocaleDateString()} via <span className="text-cyan-400">{getMarketplaceName(order.marketplace_id)}</span></p>
                    {order.marketplace_order_id && (
                      <div className="flex items-center gap-1 text-gray-300 bg-gray-700/50 px-2 rounded">
                        <Hash size={12} className="text-gray-500" />
                        {order.marketplace_order_id}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-gray-300">
                    {order.items?.length} itens - Total: <span className="font-bold text-white">R$ {order.total_price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right hidden md:block mr-4">
                    <span className="block text-xs text-gray-500">Lucro Estimado</span>
                    <span className="font-bold text-green-400">R$ {order.net_profit.toFixed(2)}</span>
                  </div>
                  
                  {!isShipped ? (
                    <>
                      <button onClick={() => handleDelete(order.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition" title="Excluir Pedido"><Trash2 size={18} /></button>
                      <button onClick={() => navigate(`/orders/edit/${order.id}`)} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition" title="Editar Pedido"><Edit2 size={18} /></button>
                      <button onClick={() => handleFinalize(order.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"><CheckCircle size={18} /> <span className="hidden sm:inline">Efetivar Saída</span></button>
                    </>
                  ) : (
                    <div className="bg-gray-700 px-4 py-2 rounded-lg text-gray-400 flex items-center gap-2 cursor-default"><CheckCircle size={18} /> Estoque Baixado</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-gray-500 text-center py-10">Nenhum pedido registrado.</p>}
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-cyan-900 text-white px-6 py-3 rounded-full shadow-2xl border border-cyan-500 flex items-center gap-6 z-50 animate-bounce-in">
          <span className="font-bold text-cyan-200">{selectedIds.length} selecionado(s)</span>
          <div className="h-6 w-px bg-cyan-700"></div>
          <button onClick={handlePrintSelection} className="flex items-center gap-2 hover:text-cyan-200 transition font-bold"><Printer size={20} /> Imprimir Ordem</button>
        </div>
      )}
    </div>
  );
};