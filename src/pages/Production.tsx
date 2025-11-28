import { useEffect, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore'; // <--- Import Novo
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Calculator, Save, Plus, Trash2, Printer as PrinterIcon, ChevronDown, Check, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Componente de Seleção com Cor (Mantido igual)
const FilamentSelect = ({ value, onChange, filaments, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedFilament = filaments.find((f: any) => f.id === value);

  return (
    <div className="relative w-full">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-left text-sm text-white flex items-center justify-between focus:ring-2 focus:ring-cyan-400 focus:outline-none">
        <div className="flex items-center gap-2 truncate">
          {selectedFilament ? (
            <>
              <div className="w-4 h-4 rounded-full border border-gray-500 shadow-sm shrink-0" style={{ backgroundColor: selectedFilament.color || '#fff' }} />
              <span className="truncate">{selectedFilament.name} <span className='text-gray-400 text-xs'>({selectedFilament.brand})</span></span>
            </>
          ) : <span className="text-gray-400">{placeholder || 'Selecione...'}</span>}
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {filaments.map((f: any) => (
              <button key={f.id} type="button" onClick={() => { onChange(f.id); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700/50 last:border-0">
                <div className="w-4 h-4 rounded-full border border-gray-500 shadow-sm shrink-0" style={{ backgroundColor: f.color || '#fff' }} />
                <div className="flex-1"><span className="block font-medium">{f.name}</span><span className="text-xs text-gray-500">{f.brand}</span></div>
                {value === f.id && <Check size={14} className="text-cyan-400" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const Production = () => {
  const { filaments, printers, products, expenses, registerProduction, fetchData } = useDataStore();
  const { config } = useAuthStore();
  const { confirm } = useUIStore(); // <--- Hook do Modal
  const navigate = useNavigate();
  
  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      product_id: '',
      printer_id: '',
      filaments_used: [{ filament_id: '', material_weight_g: 0 }],
      expenses_used: [{ expense_id: '', quantity: 0 }],
      print_time_hours: 0,
      print_time_minutes: 0,
      quantity_produced: 1,
      margin_percentage: config?.margem_padrao || 30
    }
  });

  const { fields: filamentFields, append: appendFilament, remove: removeFilament } = useFieldArray({ control, name: "filaments_used" });
  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = useFieldArray({ control, name: "expenses_used" });

  useEffect(() => { fetchData(); }, [fetchData]);
  
  useEffect(() => {
    if (config?.margem_padrao) setValue('margin_percentage', config.margem_padrao);
  }, [config, setValue]);

  // Cálculos (Mantidos iguais)
  const formValues = watch();
  const selectedPrinter = printers.find(p => p.id === formValues.printer_id);
  const totalTimeHours = Number(formValues.print_time_hours) + (Number(formValues.print_time_minutes) / 60);
  
  let costFilament = 0;
  formValues.filaments_used?.forEach(item => {
    const f = filaments.find(fil => fil.id === item.filament_id);
    if (f && item.material_weight_g) costFilament += (Number(item.material_weight_g) * (f.roll_price / f.roll_weight_g));
  });

  const powerW = selectedPrinter?.power_watts || 250; 
  const energyRate = config?.tarifa_energia || 0.75;
  const costEnergy = (powerW * totalTimeHours / 1000) * energyRate;

  const depreciationRate = selectedPrinter ? (selectedPrinter.purchase_price / selectedPrinter.lifespan_hours) : 0;
  const costDepreciation = totalTimeHours * depreciationRate;

  let costExpenses = 0;
  formValues.expenses_used?.forEach(item => {
    const e = expenses.find(exp => exp.id === item.expense_id);
    if (e && item.quantity) costExpenses += (e.cost * Number(item.quantity));
  });

  const totalBatchCost = costFilament + costEnergy + costDepreciation + costExpenses;
  const quantity = Number(formValues.quantity_produced) || 1;
  const unitCost = totalBatchCost / quantity;
  
  const margin = Number(formValues.margin_percentage) || 0;
  const suggestedPrice = unitCost * (1 + (margin / 100));

  const onSubmit = async (data: any) => {
    try {
      const filamentsData = data.filaments_used.map((item: any) => {
        const f = filaments.find(fil => fil.id === item.filament_id);
        return { ...item, cost: f ? (item.material_weight_g * (f.roll_price / f.roll_weight_g)) : 0 };
      }).filter((i: any) => i.filament_id && i.material_weight_g > 0);

      const expensesData = data.expenses_used.map((item: any) => {
        const e = expenses.find(exp => exp.id === item.expense_id);
        return { ...item, cost: e ? (e.cost * item.quantity) : 0 };
      }).filter((i: any) => i.expense_id && i.quantity > 0);

      await registerProduction({
        product_id: data.product_id,
        printer_id: data.printer_id,
        print_date: new Date().toISOString(),
        print_time_minutes: (Number(data.print_time_hours) * 60) + Number(data.print_time_minutes),
        quantity_produced: Number(data.quantity_produced),
        filaments_used: filamentsData,
        expenses_used: expensesData,
        cost_filament_total: costFilament,
        cost_energy: costEnergy,
        cost_depreciation: costDepreciation,
        cost_additional: costExpenses,
        unit_cost_final: unitCost,
        status: 'completed',
        energy_rate: energyRate,
        printer_power_w: powerW,
        applied_margin: margin,
        suggested_price_generated: suggestedPrice
      });

      // Modal Bonito
      await confirm('Produção registrada e produto precificado!', 'Sucesso', 'info');
      navigate('/products');
    } catch (error) {
      console.error(error);
      // Modal Bonito de Erro
      await confirm('Erro ao registrar produção.', 'Erro', 'danger');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3">
        <PrinterIcon className="text-cyan-400" /> Registrar Produção
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Seleção Básica */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">O que foi produzido?</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Impressora</label>
                <select {...register('printer_id', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Selecione...</option>
                  {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Produto</label>
                <select {...register('product_id', { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Selecione...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantidade Produzida</label>
              <input type="number" {...register('quantity_produced', { required: true, min: 1 })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
          </div>

          {/* Materiais e Tempo */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator size={20} className="text-cyan-400" /> Material e Tempo
            </h2>
            
            <div className="space-y-3 mb-6">
              <label className="block text-sm text-gray-400">Filamentos</label>
              {filamentFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start bg-gray-700/30 p-2 rounded-lg">
                  <div className="flex-1">
                    <Controller
                      name={`filaments_used.${index}.filament_id`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { onChange, value } }) => (
                        <FilamentSelect value={value} onChange={onChange} filaments={filaments} placeholder="Filamento..." />
                      )}
                    />
                  </div>
                  <div className="w-24">
                    <input type="number" placeholder="g" {...register(`filaments_used.${index}.material_weight_g`, { required: true })} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 h-[38px]" />
                  </div>
                  <button type="button" onClick={() => removeFilament(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded h-[38px] flex items-center justify-center"><Trash2 size={18} /></button>
                </div>
              ))}
              <button type="button" onClick={() => appendFilament({ filament_id: '', material_weight_g: 0 })} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus size={16} /> Adicionar cor</button>
            </div>

            <div className="flex gap-4 border-t border-gray-700 pt-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400">Horas</label>
                <input type="number" {...register('print_time_hours')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400">Minutos</label>
                <input type="number" {...register('print_time_minutes')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
          </div>

          {/* DESPESAS EXTRAS */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Tag size={20} className="text-cyan-400" /> Despesas / Embalagem
            </h2>
            
            <div className="space-y-3">
              {expenseFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-center bg-gray-700/30 p-2 rounded-lg">
                  <div className="flex-1">
                    <select {...register(`expenses_used.${index}.expense_id`)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                      <option value="">Selecione o item...</option>
                      {expenses.map(e => <option key={e.id} value={e.id}>{e.name} (R$ {e.cost.toFixed(2)})</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <input type="number" placeholder="Qtd" {...register(`expenses_used.${index}.quantity`)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <button type="button" onClick={() => removeExpense(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={18} /></button>
                </div>
              ))}
              <button type="button" onClick={() => appendExpense({ expense_id: '', quantity: 0 })} className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus size={16} /> Adicionar despesa</button>
            </div>
          </div>
        </div>

        {/* Resumo e Precificação */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6">Custos do Lote</h2>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Filamento</span><span className="text-white">R$ {costFilament.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Energia</span><span className="text-white">R$ {costEnergy.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Depreciação</span><span className="text-white">R$ {costDepreciation.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Despesas Extras</span><span className="text-white">R$ {costExpenses.toFixed(2)}</span></div>
              <div className="border-t border-gray-600 my-2 pt-2 flex justify-between font-bold text-lg">
                <span className="text-white">Total Lote</span>
                <span className="text-cyan-400">R$ {totalBatchCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg mb-6 text-center border border-gray-600">
              <span className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Custo Unitário (Sem Margem)</span>
              <span className="block text-2xl font-bold text-white">R$ {unitCost.toFixed(2)}</span>
            </div>

            {/* Configuração de Margem */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Margem de Lucro (%)</label>
              <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                <input 
                  type="number" 
                  {...register('margin_percentage')} 
                  className="w-full bg-transparent px-3 py-2 text-white focus:outline-none text-center font-bold"
                />
                <span className="px-3 text-gray-400 font-bold">%</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/50 p-4 rounded-lg mb-6 text-center">
              <span className="block text-green-200 text-xs uppercase tracking-wider mb-1">Preço Sugerido (Unitário)</span>
              <span className="block text-3xl font-bold text-green-400">R$ {suggestedPrice.toFixed(2)}</span>
            </div>

            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all transform active:scale-[0.98]">
              <Save size={20} /> Registrar & Precificar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};