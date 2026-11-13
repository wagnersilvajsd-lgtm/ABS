import React from 'react';
import { Operator } from '../types/abs';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  operator: Operator | null;
  onConfirmDelete: (operatorId: string) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  operator,
  onConfirmDelete
}) => {
  if (!isOpen || !operator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-100 dark:border-rose-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
              Confirmar Exclusão de Operador
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Você está prestes a excluir permanentemente este colaborador da operação, incluindo seus apontamentos mensais e histórico:
          </p>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {operator.nome}
            </div>
            <div className="text-xs text-slate-500">
              Supervisor: <strong>{operator.supervisor}</strong>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Horário: {operator.entrada} – {operator.saida} ({operator.jornadaMin}m)
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(operator.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirmar Exclusão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
