import { useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { Package, AlertTriangle, TrendingDown } from 'lucide-react';

export const Stock = () => {
  const { filaments, fetchData } = useDataStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ordena filamentos pelo nível de estoque (menor primeiro)
  const sortedFilaments = [...filaments].sort((a, b) => {
    const stockA = a.current_weight_g || 0;
    const stockB = b.current_weight_g || 0;
    return stockA - stockB;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3">
        <Package size={32} className="text-cyan-400" />
        Controle de Estoque (Filamentos)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedFilaments.map((filament) => {
          const currentWeight = filament.current_weight_g || 0;
          const minStock = filament.min_stock_alert_g || 0;
          const isLowStock = currentWeight < minStock;
          const stockPercentage = Math.min(100, Math.max(0, (currentWeight / (filament.roll_weight_g || 1000)) * 100));
          
          return (
            <div 
              key={filament.id} 
              className={`bg-gray-800 rounded-xl border ${isLowStock ? 'border-red-500/50' : 'border-gray-700'} p-6 transition-all hover:shadow-lg`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {filament.name}
                    {isLowStock && <AlertTriangle size={18} className="text-red-500" />}
                  </h3>
                  <p className="text-gray-400 text-sm">{filament.brand} - {filament.type}</p>
                </div>
                <div 
                  className="w-8 h-8 rounded-full border-2 border-gray-600 shadow-sm" 
                  style={{ backgroundColor: filament.color || '#fff' }}
                />
              </div>

              <div className="space-y-4">
                {/* Barra Visual de Estoque */}
                <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                      isLowStock ? 'bg-red-500' : stockPercentage < 30 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-700/30 p-3 rounded-lg">
                    <span className="block text-gray-400 text-xs mb-1">Peso Atual</span>
                    <span className={`font-bold text-lg ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                      {currentWeight.toFixed(0)}g
                    </span>
                  </div>
                  <div className="bg-gray-700/30 p-3 rounded-lg">
                    <span className="block text-gray-400 text-xs mb-1">Rolos</span>
                    <span className="font-bold text-lg text-white">
                      {filament.rolls || 0}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-700">
                  <span>Alerta em: {minStock}g</span>
                  <span>Total: {filament.roll_weight_g}g/rolo</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedFilaments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <TrendingDown size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum filamento cadastrado.</p>
        </div>
      )}
    </div>
  );
};