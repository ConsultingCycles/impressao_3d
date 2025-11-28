import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { useUIStore } from '../store/uiStore';
import { Save, Settings as SettingsIcon } from 'lucide-react';

export const Settings = () => {
  const { config } = useAuthStore();
  const { updateConfig } = useDataStore();
  const { confirm } = useUIStore();
  
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      tarifa_energia: config?.tarifa_energia || 0.75,
      margem_padrao: config?.margem_padrao || 30,
      moeda: config?.moeda || 'BRL'
    }
  });

  // O "Vigia" que carrega o valor do banco assim que ele chega
  useEffect(() => {
    if (config) {
      reset({
        tarifa_energia: config.tarifa_energia,
        margem_padrao: config.margem_padrao,
        moeda: config.moeda
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await updateConfig({
        tarifa_energia: Number(data.tarifa_energia),
        margem_padrao: Number(data.margem_padrao),
        moeda: data.moeda
      });
      
      setLoading(false);
      
      // AQUI: Usa o confirm (Modal Escuro), não o alert
      await confirm('Configurações salvas com sucesso!', 'Salvo', 'info');
      
    } catch (error) {
      console.error(error);
      setLoading(false);
      await confirm('Não foi possível salvar as configurações.', 'Erro', 'danger');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="text-cyan-400" size={32} />
        <h1 className="text-3xl font-bold text-white">Configurações Gerais</h1>
      </div>
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Tarifa de Energia (R$/kWh)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('tarifa_energia')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Margem de Lucro Padrão (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('margem_padrao')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};