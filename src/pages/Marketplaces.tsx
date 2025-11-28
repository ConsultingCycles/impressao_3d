import { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore'; // <--- Import do Modal Bonito
import { useForm } from 'react-hook-form';
import { ShoppingBag, Plus, Trash2, X, AlertCircle, Store, Edit2 } from 'lucide-react';

export const Marketplaces = () => {
  const { marketplaces, fetchData, addMarketplace, updateMarketplace, deleteMarketplace } = useDataStore();
  // Pegamos a função 'confirm' do nosso store visual
  const { confirm } = useUIStore(); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => { fetchData(); }, [fetchData]);

  // Essa é a função importante que recupera os dados para edição
  const openModal = (marketplace?: any) => {
    if (marketplace) {
      setEditingId(marketplace.id);
      // Preenche os campos do formulário com os dados existentes
      setValue('name', marketplace.name);
      setValue('fee_percent', marketplace.fee_percent);
      setValue('fee_fixed', marketplace.fee_fixed);
      setValue('notes', marketplace.notes);
    } else {
      setEditingId(null);
      reset(); // Limpa o formulário se for novo
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        fee_percent: Number(data.fee_percent),
        fee_fixed: Number(data.fee_fixed),
        notes: data.notes
      };

      if (editingId) {
        await updateMarketplace(editingId, payload);
      } else {
        await addMarketplace(payload);
      }
      
      setIsModalOpen(false);
      reset();
    } catch (error) {
      alert('Erro ao salvar canal de venda');
    }
  };

  // Função de deletar atualizada para usar o Modal Bonito
  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      'Tem certeza que deseja excluir este canal de venda? Isso pode afetar o histórico de pedidos antigos.',
      'Excluir Canal',
      'danger'
    );

    if (confirmed) {
      await deleteMarketplace(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Store className="text-cyan-400" /> Canais de Venda
        </h1>
        <button 
          onClick={() => openModal()} 
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Novo Canal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketplaces.map((m) => (
          <div key={m.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-700 p-2 rounded-lg text-cyan-400">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{m.name}</h3>
                  <p className="text-xs text-gray-400">Canal Ativo</p>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => openModal(m)}
                  className="text-gray-500 hover:text-cyan-400 transition p-2"
                  title="Editar Canal"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(m.id)}
                  className="text-gray-500 hover:text-red-400 transition p-2"
                  title="Excluir Canal"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-gray-700/30 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Comissão (%)</span>
                <span className="text-white font-bold text-lg">{m.fee_percent}%</span>
              </div>
              <div className="w-full h-px bg-gray-600/50"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Taxa Fixa (R$)</span>
                <span className="text-white font-bold text-lg">R$ {m.fee_fixed.toFixed(2)}</span>
              </div>
            </div>

            {m.notes && (
              <div className="mt-4 text-xs text-gray-500 italic border-t border-gray-700 pt-2">
                "{m.notes}"
              </div>
            )}
          </div>
        ))}

        {marketplaces.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <p>Nenhum canal de venda cadastrado.</p>
            <p className="text-sm mt-2">Cadastre Shopee, Mercado Livre ou Venda Direta para calcular as taxas automaticamente.</p>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Canal' : 'Novo Canal de Venda'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do Canal</label>
                <input 
                  {...register('name', { required: true })} 
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" 
                  placeholder="Ex: Shopee, Mercado Livre, Instagram" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Comissão (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01" 
                      {...register('fee_percent', { required: true })} 
                      defaultValue={0}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" 
                    />
                    <span className="absolute right-3 top-2 text-gray-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Taxa Fixa (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      {...register('fee_fixed', { required: true })} 
                      defaultValue={0}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Observações</label>
                <textarea 
                  {...register('notes')} 
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none" 
                  rows={2} 
                  placeholder="Ex: Taxa de frete grátis acima de R$ 39"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex gap-3 items-start">
                <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-200 leading-relaxed">
                  Ao selecionar este canal num pedido, o sistema descontará automaticamente 
                  <strong> {`%`} + Taxa Fixa</strong> do valor total para calcular seu <strong>Lucro Líquido</strong>.
                </p>
              </div>

              <button 
                type="submit" 
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 rounded-lg transition transform active:scale-[0.98]"
              >
                {editingId ? 'Atualizar Canal' : 'Salvar Canal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};