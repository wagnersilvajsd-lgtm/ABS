import React, { useState, useEffect } from 'react';
import { X, Edit2, UserCheck, CheckCircle2 } from 'lucide-react';

interface EditSupervisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisorName: string | null;
  linkedOperatorsCount: number;
  onRenameSupervisor: (oldName: string, newName: string) => void;
}

export const EditSupervisorModal: React.FC<EditSupervisorModalProps> = ({
  isOpen,
  onClose,
  supervisorName,
  linkedOperatorsCount,
  onRenameSupervisor
}) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supervisorName && isOpen) {
      setNewName(supervisorName);
      setError(null);
    }
  }, [supervisorName, isOpen]);

  if (!isOpen || !supervisorName) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = newName.trim().toUpperCase();
    if (!trimmed) {
      setError('Informe o novo nome completo do supervisor.');
      return;
    }

    onRenameSupervisor(supervisorName, trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 animate-backdrop-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#006772] to-[#005059] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit2 className="w-5 h-5 text-[#f0ad35]" />
            <div>
              <h3 className="text-base font-bold">
                Editar Nome do Supervisor
              </h3>
              <p className="text-xs text-teal-100">
                Atualiza o cadastro do supervisor e sua equipe vinculada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Nome Atual
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              <UserCheck className="w-3.5 h-3.5 text-[#006772]" />
              <span>{supervisorName}</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              {linkedOperatorsCount} operador(es) vinculados serão atualizados automaticamente.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
              Novo Nome do Supervisor:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="NOME COMPLETO DO SUPERVISOR"
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold uppercase focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
            />
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
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar Novo Nome</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
