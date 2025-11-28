import { useEffect, useState } from 'react';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Calculator, FileText, Plus, Trash2, ChevronDown, Check, Tag } from 'lucide-react';
import { jsPDF } from 'jspdf';
import logo from '../assets/logo.png';

// Componente de Seleção com Cor
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

export const Simulation = () => {
  const { filaments, printers, expenses, marketplaces, fetchData } = useDataStore();
  const { config } = useAuthStore();
  
  const { register, control, watch, setValue } = useForm({
    defaultValues: {
      name: '',
      printer_id: '',
      marketplace_id: '',
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

  // --- CÁLCULOS ---
  const formValues = watch();
  const selectedPrinter = printers.find(p => p.id === formValues.printer_id);
  const selectedMarketplace = marketplaces.find(m => m.id === formValues.marketplace_id);
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
  const priceWithMargin = unitCost * (1 + (margin / 100));

  // Taxas do Marketplace
  const marketplaceFee = selectedMarketplace 
    ? (priceWithMargin * (selectedMarketplace.fee_percent / 100)) + selectedMarketplace.fee_fixed 
    : 0;

  const finalSuggestedPrice = priceWithMargin + marketplaceFee;
  const profit = finalSuggestedPrice - marketplaceFee - unitCost;

  // --- GERAR PDF DE ORÇAMENTO ---
  const generatePDF = () => {
    const doc = new jsPDF();
    const logoImg = new Image();
    logoImg.src = logo;
    
    logoImg.onload = () => {
      doc.addImage(logoImg, 'PNG', 20, 10, 30, 12);
      doc.setFontSize(22);
      doc.setTextColor(30, 136, 229);
      doc.text('Orçamento de Impressão 3D', 190, 20, { align: 'right' });
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 30, 190, 30);

      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text(`Peça: ${formValues.name || 'Sem nome'}`, 20, 45);
      
      // Detalhes Técnicos
      doc.setFillColor(245, 245, 245);
      doc.rect(20, 55, 170, 70, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text('Tempo de Impressão:', 30, 70);
      doc.text(`${Math.floor(totalTimeHours)}h ${Math.round((totalTimeHours % 1) * 60)}min`, 100, 70);
      
      doc.text('Peso Estimado:', 30, 80);
      const totalWeight = formValues.filaments_used.reduce((acc, i) => acc + Number(i.material_weight_g), 0);
      doc.text(`${totalWeight}g`, 100, 80);

      doc.text('Material:', 30, 90);
      const materials = formValues.filaments_used.map(i => filaments.find(f => f.id === i.filament_id)?.name).filter(Boolean).join(', ');
      doc.text(materials || '-', 100, 90);

      // Preço
      doc.setFontSize(16);
      doc.setTextColor(30, 136, 229);
      doc.text('Valor Total:', 30, 110);
      doc.text(`R$ ${finalSuggestedPrice.toFixed(2)}`, 180, 110, { align: 'right' });

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Orçamento válido por 7 dias.', 105, 280, { align: 'center' });

      doc.save(`orcamento-${formValues.name}.pdf`);
    };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Calculator className="text-cyan-400" /> Simulador de Orçamento
        </h1>
        <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-lg text-yellow-200 text-sm">
          Modo Simulação: Nada será salvo no banco de dados.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Dados da Peça</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome (para o PDF)</label>
              <input {...register('name')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Ex: Peça Cliente X" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Impressora</label>
                <select {...register('printer_id')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">Selecione...</option>
                  {printers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Quantidade</label>
                <input type="number" {...register('quantity_produced')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Material e Tempo</h2>
            <div className="space-y-3 mb-6">
              <label className="block text-sm text-gray-400">Filamentos</label>
              {filamentFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start bg-gray-700/30 p-2 rounded-lg">
                  <div className="flex-1">
                    <Controller
                      name={`filaments_used.${index}.filament_id`}
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <FilamentSelect value={value} onChange={onChange} filaments={filaments} placeholder="Filamento..." />
                      )}
                    />
                  </div>
                  <div className="w-24">
                    <input type="number" placeholder="g" {...register(`filaments_used.${index}.material_weight_g`)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none h-[38px]" />
                  </div>
                  <button type="button" onClick={() => removeFilament(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded h-[38px]"><Trash2 size={18} /></button>
                </div>
              ))}
              <button type="button" onClick={() => appendFilament({ filament_id: '', material_weight_g: 0 })} className="text-sm text-cyan-400 flex items-center gap-1"><Plus size={16} /> Adicionar cor</button>
            </div>

            <div className="flex gap-4 border-t border-gray-700 pt-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400">Horas</label>
                <input type="number" {...register('print_time_hours')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400">Minutos</label>
                <input type="number" {...register('print_time_minutes')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Tag size={20} className="text-cyan-400" /> Custos Extras
            </h2>
            <div className="space-y-3">
              {expenseFields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-center bg-gray-700/30 p-2 rounded-lg">
                  <div className="flex-1">
                    <select {...register(`expenses_used.${index}.expense_id`)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                      <option value="">Selecione...</option>
                      {expenses.map(e => <option key={e.id} value={e.id}>{e.name} (R$ {e.cost.toFixed(2)})</option>)}
                    </select>
                  </div>
                  <div className="w-24">
                    <input type="number" placeholder="Qtd" {...register(`expenses_used.${index}.quantity`)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                  </div>
                  <button type="button" onClick={() => removeExpense(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={18} /></button>
                </div>
              ))}
              <button type="button" onClick={() => appendExpense({ expense_id: '', quantity: 0 })} className="text-sm text-cyan-400 flex items-center gap-1"><Plus size={16} /> Adicionar despesa</button>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6">Orçamento</h2>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Simular Marketplace</label>
              <select {...register('marketplace_id')} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none text-sm">
                <option value="">Venda Direta (Sem taxas)</option>
                {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-1">Margem Lucro (%)</label>
              <div className="flex items-center bg-gray-700 border border-gray-600 rounded-lg">
                <input type="number" {...register('margin_percentage')} className="w-full bg-transparent px-3 py-2 text-white focus:outline-none font-bold text-center" />
                <span className="px-3 text-gray-400 font-bold">%</span>
              </div>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg mb-4 space-y-2 text-sm border border-gray-600">
              <div className="flex justify-between"><span className="text-gray-400">Custo Produção</span><span className="text-white">R$ {totalBatchCost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Custo Unitário</span><span className="text-white">R$ {unitCost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-red-400">Taxas Mkt</span><span className="text-red-400">- R$ {marketplaceFee.toFixed(2)}</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-600"><span className="text-green-400 font-bold">Lucro Líquido</span><span className="text-green-400 font-bold">R$ {profit.toFixed(2)}</span></div>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/30 border border-cyan-500/50 p-4 rounded-lg mb-6 text-center">
              <span className="block text-cyan-200 text-xs uppercase tracking-wider mb-1">Preço Final Sugerido</span>
              <span className="block text-3xl font-bold text-cyan-400">R$ {finalSuggestedPrice.toFixed(2)}</span>
            </div>

            <button onClick={generatePDF} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all transform active:scale-[0.98]">
              <FileText size={20} /> Gerar PDF Orçamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};