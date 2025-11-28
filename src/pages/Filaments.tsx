import { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore'; // <--- NOVO
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit2, X, ShoppingCart } from 'lucide-react';

export const Filaments = () => {
  const { filaments, fetchData, addFilament, updateFilament, deleteFilament, addFilamentPurchase } = useDataStore();
  const { confirm } = useUIStore(); // <--- NOVO

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const { register: registerPurchase, handleSubmit: handleSubmitPurchase, reset: resetPurchase } = useForm();
  
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-calculate cost per gram
  const rollWeight = watch('roll_weight_g');
  const rollPrice = watch('roll_price');
  const costPerGram = (rollWeight && rollPrice) ? (rollPrice / rollWeight).toFixed(4) : '0.00';

  const watchedColor = watch('color');

  const openModal = (filament?: any) => {
    if (filament) {
      setEditingId(filament.id);
      setValue('name', filament.name);
      setValue('type', filament.type);
      setValue('color', filament.color);
      setValue('brand', filament.brand);
      setValue('roll_weight_g', filament.roll_weight_g);
      setValue('roll_price', filament.roll_price);
      setValue('min_stock_alert_g', filament.min_stock_alert_g);
      setValue('grams_per_roll', filament.grams_per_roll || 1000);
      setValue('rolls', filament.rolls || 0);
    } else {
      setEditingId(null);
      reset();
      setValue('grams_per_roll', 1000);
      setValue('rolls', 0);
      setValue('color', '#000000'); 
    }
    setIsModalOpen(true);
  };

  const openPurchaseModal = (filament: any) => {
    setPurchaseId(filament.id);
    resetPurchase();
    setIsPurchaseModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const basePayload = {
        name: data.name,
        type: data.type,
        color: data.color,
        brand: data.brand,
        roll_weight_g: Number(data.roll_weight_g),
        roll_price: Number(data.roll_price),
        min_stock_alert_g: Number(data.min_stock_alert_g),
        grams_per_roll: Number(data.grams_per_roll),
        rolls: Number(data.rolls)
      };

      if (editingId) {
        await updateFilament(editingId, basePayload);
      } else {
        const newPayload = {
          ...basePayload,
          current_weight_g: Number(data.rolls) * Number(data.grams_per_roll)
        };
        await addFilament(newPayload);
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar filamento');
    }
  };

  const onPurchaseSubmit = async (data: any) => {
    if (!purchaseId) return;
    try {
      await addFilamentPurchase(purchaseId, Number(data.rolls_purchased));
      setIsPurchaseModalOpen(false);
      resetPurchase();
      alert('Compra registrada com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao registrar compra');
    }
  };

  // --- MODAL BONITO AQUI ---
  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      'Tem certeza que deseja excluir este filamento?', 
      'Excluir Filamento',
      'danger'
    );
    if (confirmed) await deleteFilament(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Filamentos</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Filamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filaments.map((filament) => (
          <div key={filament.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-cyan-500/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{filament.name}</h3>
                <p className="text-gray-400 text-sm">{filament.brand} - {filament.type}</p>
              </div>
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-sm" 
                style={{ backgroundColor: filament.color || '#fff' }}
              />
            </div>
            
            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <div className="flex justify-between"><span>Preço do Rolo:</span><span className="font-medium text-white">R$ {filament.roll_price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Estoque (Rolos):</span><span className="font-medium text-white">{filament.rolls || 0}</span></div>
              <div className="flex justify-between"><span>Estoque (Gramas):</span><span className={`font-medium ${filament.current_weight_g && filament.current_weight_g < filament.min_stock_alert_g ? 'text-red-500' : 'text-white'}`}>{filament.current_weight_g?.toFixed(0)}g</span></div>
              <div className="flex justify-between"><span>Custo/g:</span><span className="font-medium text-cyan-400">R$ {(filament.roll_price / filament.roll_weight_g).toFixed(4)}</span></div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => openPurchaseModal(filament)} className="flex items-center justify-center px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors" title="Registrar Compra"><ShoppingCart size={16} /></button>
              <button onClick={() => openModal(filament)} className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"><Edit2 size={16} /> Editar</button>
              <button onClick={() => handleDelete(filament.id)} className="flex items-center justify-center px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Registrar Compra</h2>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitPurchase(onPurchaseSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Quantidade de Rolos</label>
                <input type="number" {...registerPurchase('rolls_purchased', { required: true, min: 1 })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors">Confirmar Compra</button>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Filamento' : 'Novo Filamento'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                <input {...register('name', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" placeholder="Ex: PLA Preto Basic" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Marca</label>
                  <input {...register('brand')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                  <select {...register('type', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none">
                    <option value="PLA">PLA</option>
                    <option value="ABS">ABS</option>
                    <option value="PETG">PETG</option>
                    <option value="TPU">TPU</option>
                    <option value="ASA">ASA</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cor</label>
                  <div className="flex gap-2">
                    <div className="relative overflow-hidden w-12 h-10 rounded-lg border border-gray-600 shrink-0">
                      <input type="color" value={watchedColor || '#000000'} onChange={(e) => setValue('color', e.target.value)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-none p-0" />
                    </div>
                    <input type="text" {...register('color')} placeholder="#FFFFFF" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Alerta Estoque (g)</label>
                  <input type="number" {...register('min_stock_alert_g')} defaultValue={100} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Peso Rolo (g)</label>
                  <input type="number" {...register('roll_weight_g', { required: true })} defaultValue={1000} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Preço Rolo (R$)</label>
                  <input type="number" step="0.01" {...register('roll_price', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Gramas por Rolo (Padrão)</label>
                  <input type="number" {...register('grams_per_roll', { required: true })} defaultValue={1000} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Rolos em Estoque</label>
                  <input type="number" {...register('rolls')} defaultValue={0} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none" />
                </div>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center border border-gray-600">
                <span className="text-gray-400 text-sm">Custo calculado:</span>
                <span className="text-cyan-400 font-bold">R$ {costPerGram} / g</span>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 rounded-lg transition-transform active:scale-[0.98] shadow-lg shadow-cyan-500/20">Salvar Filamento</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};