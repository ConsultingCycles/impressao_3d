import { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore'; // <--- NOVO
import { useForm } from 'react-hook-form';
import { Package, Plus, Edit2, Trash2, X, Search, AlertCircle } from 'lucide-react';

export const Products = () => {
  const { products, fetchData, addProduct, updateProduct, deleteProduct } = useDataStore();
  const { confirm } = useUIStore(); // <--- NOVO
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const openModal = (prod?: any) => {
    if (prod) {
      setEditingId(prod.id);
      setValue('name', prod.name);
      setValue('sku', prod.sku);
      setValue('description', prod.description);
    } else {
      setEditingId(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    const basePayload = {
      name: data.name,
      sku: data.sku,
      description: data.description,
    };

    if (editingId) {
      await updateProduct(editingId, basePayload);
    } else {
      await addProduct({
        ...basePayload,
        stock_quantity: 0,
        average_cost: 0,
        suggested_price: 0
      });
    }
    setIsModalOpen(false);
    reset();
  };

  // --- MODAL BONITO AQUI ---
  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      'Tem certeza que deseja excluir este produto? Se ele tiver histórico, a exclusão pode ser bloqueada.',
      'Excluir Produto',
      'danger'
    );
    if (confirmed) deleteProduct(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Package className="text-cyan-400" /> Catálogo de Produtos
        </h1>
        <button onClick={() => openModal()} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 flex items-center gap-2">
        <Search className="text-gray-400 ml-2" size={20} />
        <input type="text" placeholder="Buscar produto..." className="bg-transparent text-white w-full focus:outline-none placeholder-gray-500" onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900/50 text-gray-400 uppercase font-medium border-b border-gray-700">
              <tr>
                <th className="px-6 py-4">Nome / Descrição</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4 text-center">Estoque</th>
                <th className="px-6 py-4 text-right">Custo Médio</th>
                <th className="px-6 py-4 text-right">Preço Sugerido</th>
                <th className="px-6 py-4 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-700/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white text-base">{p.name}</div>
                    {p.description && <div className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{p.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{p.sku || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${p.stock_quantity > 0 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-400'}`}>{p.stock_quantity}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-300">R$ {p.average_cost?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-medium text-green-400">R$ {p.suggested_price?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(p)} className="p-2 hover:bg-cyan-500/20 text-cyan-400 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do Produto</label>
                <input {...register('name', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">SKU (Cód.)</label>
                <input {...register('sku')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <textarea {...register('description')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" rows={3} />
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="text-blue-400 mt-0.5" size={16} />
                <p className="text-xs text-blue-200">
                  O preço sugerido e o custo serão calculados automaticamente após a primeira produção desta peça.
                </p>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20">Salvar Produto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};