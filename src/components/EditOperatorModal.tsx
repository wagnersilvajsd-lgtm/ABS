import React, { useState, useEffect } from 'react';
import { Operator } from '../types/abs';
import { X, Edit2, Clock, CheckCircle2, User } from 'lucide-react';

interface EditOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  operator: Operator | null;
  onSaveOperator: (updated: {
    id: string;
    nome: string;
    entrada: string;
    saida: string;
    jornadaMin: number;
  }) => void;
}

export const EditOperatorModal: React.FC<EditOperatorModalProps> = ({
  isOpen,
  onClose,
  operator,
  onSaveOperator
}) => {
  const [nome, setNome] = useState('');
  const [entrada, setEntrada] = useState('08:00:00');
  const [saida, setSaida] = useState('14:20:00');
  const [jornadaMin, setJornadaMin] = useState(380);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (operator && isOpen) {
      setNome(operator.nome);
      setEntrada(operator.entrada);
      setSaida(operator.saida);
      setJornadaMin(operator.jornadaMin || 380);
      setError(null);
    }
  }, [operator, isOpen]);

  if (!isOpen || !operator) return null;

  const handleEntradaChange = (val: string) => {
    setEntrada(val);
    const parts = val.split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        m += 20;
        h += 6;
        if (m >= 60) {
          m -= 60;
          h += 1;
        }
        h = h % 24;
        setSaida(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedNome = nome.trim().toUpperCase();
    if (!trimmedNome) {
      setError('Informe o nome completo do operador.');
      return;
    }

    onSaveOperator({
      id: operator.id,
      nome: trimmedNome,
      entrada: entrada.trim() || operator.entrada,
      saida: saida.trim() || operator.saida,
      jornadaMin: Number(jornadaMin) || operator.jornadaMin || 380
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#006772] to-[#005059] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit2 className="w-5 h-5 text-[#f0ad35]" />
            <div>
              <h3 className="text-base font-bold">
                Editar Dados do Operador
              </h3>
              <p className="text-xs text-teal-100">
                Atualize o nome completo ou o horário contratual
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

          {/* Nome do Operador */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
              Nome Completo do Operador:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="NOME COMPLETO DO OPERADOR"
                className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold uppercase focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
              />
            </div>
          </div>

          {/* Supervisor Atual (somente exibição — troca via Transferência) */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Supervisor Vinculado:
            </span>
            <strong className="text-slate-800 dark:text-slate-100">{operator.supervisor}</strong>
          </div>

          {/* Horários e Jornada */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">
                Entrada
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={entrada}
                  onChange={(e) => handleEntradaChange(e.target.value)}
                  className="w-full h-9 pl-8 pr-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">
                Saída
              </label>
              <input
                type="text"
                required
                value={saida}
                onChange={(e) => setSaida(e.target.value)}
                className="w-full h-9 px-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">
                Jornada (min)
              </label>
              <input
                type="number"
                min="60"
                max="600"
                value={jornadaMin}
                onChange={(e) => setJornadaMin(parseInt(e.target.value, 10) || 380)}
                className="w-full h-9 px-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
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
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
