import { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore'; // <--- NOVO
import { useForm } from 'react-hook-form';
import { Tag, Plus, Edit2, Trash2, X, Search } from 'lucide-react';

export const Expenses = () => {
  const { expenses, fetchData, addExpense, updateExpense, deleteExpense } = useDataStore();
  const { confirm } = useUIStore(); // <--- NOVO
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = expenses.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const openModal = (expense?: any) => {
    if (expense) {
      setEditingId(expense.id);
      setValue('name', expense.name);
      setValue('cost', expense.cost);
      setValue('unit', expense.unit);
    } else {
      setEditingId(null);
      reset();
      setValue('unit', 'un');
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    const payload = {
      name: data.name,
      cost: Number(data.cost),
      unit: data.unit
    };
    if (editingId) await updateExpense(editingId, payload);
    else await addExpense(payload);
    setIsModalOpen(false);
    reset();
  };

  // --- MODAL BONITO AQUI ---
  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      'Deseja excluir esta despesa? Ela será removida da lista de seleção.', 
      'Excluir Despesa',
      'danger'
    );
    if (confirmed) deleteExpense(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Tag className="text-cyan-400" /> Cadastro de Custos Extras
        </h1>
        <button onClick={() => openModal()} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Novo Custo
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 flex items-center gap-2">
        <Search className="text-gray-400 ml-2" size={20} />
        <input type="text" placeholder="Buscar despesa..." className="bg-transparent text-white w-full focus:outline-none" onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900/50 text-gray-400 uppercase font-medium border-b border-gray-700">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4 text-center">Unidade</th>
              <th className="px-6 py-4 text-right">Custo Unitário</th>
              <th className="px-6 py-4 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-gray-700/30 transition-colors group">
                <td className="px-6 py-4 text-white font-medium">{e.name}</td>
                <td className="px-6 py-4 text-center text-gray-400">{e.unit}</td>
                <td className="px-6 py-4 text-right text-green-400 font-bold">R$ {e.cost.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(e)} className="p-2 hover:bg-cyan-500/20 text-cyan-400 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(e.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum custo cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Custo' : 'Novo Custo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do Item</label>
                <input {...register('name', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Ex: Caixa de Papelão P" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Custo Unit. (R$)</label>
                  <input type="number" step="0.01" {...register('cost', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Unidade</label>
                  <input {...register('unit')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="un, kg, m..." />
                </div>
              </div>
              <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 rounded-lg mt-4">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};