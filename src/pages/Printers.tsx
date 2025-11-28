import { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore'; // <--- NOVO
import { useForm } from 'react-hook-form';
import { Printer, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

export const Printers = () => {
  const { printers, fetchData, addPrinter, updatePrinter, deletePrinter } = useDataStore();
  const { confirm } = useUIStore(); // <--- NOVO
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (printer?: any) => {
    if (printer) {
      setEditingId(printer.id);
      setValue('name', printer.name);
      setValue('model', printer.model);
      setValue('purchase_price', printer.purchase_price);
      setValue('lifespan_hours', printer.lifespan_hours);
      setValue('power_watts', printer.power_watts);
    } else {
      setEditingId(null);
      reset();
      setValue('lifespan_hours', 5000);
      setValue('power_watts', 250);
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        model: data.model,
        purchase_price: Number(data.purchase_price),
        lifespan_hours: Number(data.lifespan_hours),
        power_watts: Number(data.power_watts)
      };

      if (editingId) await updatePrinter(editingId, payload);
      else await addPrinter(payload);
      
      setIsModalOpen(false);
      reset();
    } catch (error) {
      alert('Erro ao salvar impressora');
    }
  };

  // --- MODAL BONITO AQUI ---
  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      'Tem certeza que deseja excluir esta impressora? Isso pode afetar o cálculo de histórico.',
      'Excluir Impressora',
      'danger'
    );
    if (confirmed) await deletePrinter(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Printer className="text-cyan-400" /> Impressoras
        </h1>
        <button onClick={() => openModal()} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Nova Impressora
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {printers.map((p) => {
          const costPerHour = (p.purchase_price / p.lifespan_hours) || 0;
          return (
            <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{p.name}</h3>
                  <p className="text-gray-400 text-sm">{p.model}</p>
                </div>
                <div className="bg-gray-700 p-2 rounded text-cyan-400">
                  <Printer size={20} />
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-300 mb-6">
                <div className="flex justify-between">
                  <span>Depreciação:</span>
                  <span className="text-white font-medium">R$ {costPerHour.toFixed(2)} / hora</span>
                </div>
                <div className="flex justify-between">
                  <span>Potência:</span>
                  <span className="text-white font-medium">{p.power_watts} W</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Impresso:</span>
                  <span className="text-cyan-400 font-bold">{p.total_hours_printed?.toFixed(1)} h</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openModal(p)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg flex justify-center items-center gap-2">
                  <Edit2 size={16} /> Editar
                </button>
                <button onClick={() => handleDelete(p.id)} className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar' : 'Nova'} Impressora</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome (Apelido)</label>
                <input {...register('name', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" placeholder="Ex: Ender 3 Pro" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Modelo</label>
                <input {...register('model')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Preço Compra (R$)</label>
                  <input type="number" step="0.01" {...register('purchase_price')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Vida Útil (Horas)</label>
                  <input type="number" {...register('lifespan_hours')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Consumo (Watts)</label>
                <input type="number" {...register('power_watts')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="text-blue-400 mt-0.5" size={16} />
                <p className="text-xs text-blue-200">
                  O valor de depreciação por hora será calculado automaticamente (Preço / Vida Útil).
                </p>
              </div>

              <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 rounded-lg">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};