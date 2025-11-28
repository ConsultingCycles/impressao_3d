import React from 'react';
import { useUIStore } from '../store/uiStore';
import { AlertTriangle, Info } from 'lucide-react';

export const ConfirmDialog = () => {
  const { confirmDialog, closeConfirm } = useUIStore();
  const { isOpen, options } = confirmDialog;

  // DIAGNÓSTICO: Isso vai aparecer no F12 quando o modal tentar abrir
  if (isOpen) {
    console.log("📢 O MODAL DEVERIA ESTAR VISÍVEL AGORA!");
  }

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // Fundo bem escuro
        zIndex: 99999, // Z-Index máximo absurdo para ficar na frente de tudo
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
      }}
      onClick={() => closeConfirm(false)}
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Impede que clicar no card feche o modal
        className="bg-gray-800 border border-gray-600 rounded-xl w-full max-w-md p-6 shadow-2xl"
        style={{ minWidth: '320px' }}
      >
        
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-full ${options.type === 'danger' ? 'bg-red-900/30 text-red-400' : 'bg-cyan-900/30 text-cyan-400'}`}>
            {options.type === 'danger' ? <AlertTriangle size={32} /> : <Info size={32} />}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{options.title}</h3>
            <p className="text-gray-300 text-base leading-relaxed">{options.message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => closeConfirm(false)}
            className="px-5 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          >
            {options.cancelText || 'Cancelar'}
          </button>
          <button
            onClick={() => closeConfirm(true)}
            className={`px-5 py-2.5 rounded-lg text-white font-bold transition-colors flex items-center gap-2 ${
              options.type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-cyan-600 hover:bg-cyan-700'
            }`}
          >
            {options.confirmText || (options.type === 'danger' ? 'Sim, Confirmar' : 'OK')}
          </button>
        </div>

      </div>
    </div>
  );
};