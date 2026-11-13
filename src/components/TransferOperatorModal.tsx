import React, { useState, useEffect } from 'react';
import { Operator } from '../types/abs';
import { X, ArrowRightLeft, Clock, UserCheck, Send } from 'lucide-react';

interface TransferOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  operator: Operator | null;
  availableSupervisors: string[];
  onSubmitTransfer: (payload: {
    operator: Operator;
    toSupervisor: string;
    toEntrada: string;
    toSaida: string;
    toJornadaMin: number;
    reason: string;
  }) => void;
}

export const TransferOperatorModal: React.FC<TransferOperatorModalProps> = ({
  isOpen,
  onClose,
  operator,
  availableSupervisors,
  onSubmitTransfer
}) => {
  const [toSupervisor, setToSupervisor] = useState('');
  const [isCustomSupervisor, setIsCustomSupervisor] = useState(false);
  const [customSupervisor, setCustomSupervisor] = useState('');
  const [toEntrada, setToEntrada] = useState('08:00:00');
  const [toSaida, setToSaida] = useState('14:20:00');
  const [toJornadaMin, setToJornadaMin] = useState(380);
  const [reason, setReason] = useState('Readequação de turno / balanceamento de equipe');
  const [error, setError] = useState<string | null>(null);

  const destinationOptions = availableSupervisors.filter(
    s => !operator || s.toLowerCase().trim() !== operator.supervisor.toLowerCase().trim()
  );

  useEffect(() => {
    if (operator && isOpen) {
      const others = availableSupervisors.filter(
        s => s.toLowerCase().trim() !== operator.supervisor.toLowerCase().trim()
      );
      setToSupervisor(others[0] || '');
      setIsCustomSupervisor(others.length === 0);
      setCustomSupervisor('');
      setToEntrada(operator.entrada);
      setToSaida(operator.saida);
      setToJornadaMin(operator.jornadaMin);
      setReason('Readequação de turno / balanceamento de equipe');
      setError(null);
    }
  }, [operator, isOpen, availableSupervisors]);

  if (!isOpen || !operator) return null;

  const handleEntradaChange = (val: string) => {
    setToEntrada(val);
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
        setToSaida(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const chosenSup = (isCustomSupervisor ? customSupervisor : toSupervisor).trim().toUpperCase();
    if (!chosenSup) {
      setError('Selecione ou informe o supervisor de destino.');
      return;
    }
    if (chosenSup.toLowerCase() === operator.supervisor.toLowerCase().trim()) {
      setError('O supervisor de destino deve ser diferente do supervisor atual.');
      return;
    }

    onSubmitTransfer({
      operator,
      toSupervisor: chosenSup,
      toEntrada: toEntrada.trim() || operator.entrada,
      toSaida: toSaida.trim() || operator.saida,
      toJornadaMin: Number(toJornadaMin) || operator.jornadaMin,
      reason: reason.trim() || 'Transferência operacional entre supervisões'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 animate-backdrop-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#006772] to-[#005059] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft className="w-5 h-5 text-[#f0ad35]" />
            <div>
              <h3 className="text-base font-bold">
                Transferir Operador de Supervisor
              </h3>
              <p className="text-xs text-teal-100">
                Envia solicitação com horário e registro automático no histórico
              </p>
            </div>
          </div>
          <button
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

          {/* Current Operator Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Colaborador &amp; Origem Atual
            </span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              {operator.nome}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#006772]" />
                <strong>{operator.supervisor}</strong>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {operator.entrada} – {operator.saida} ({operator.jornadaMin}m)
              </span>
            </div>
          </div>

          {/* Destination Supervisor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Supervisor de Destino (Recebedor):
              </label>
              {destinationOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomSupervisor(!isCustomSupervisor)}
                  className="text-[11px] font-semibold text-[#006772] dark:text-[#2dd4bf] hover:underline cursor-pointer"
                >
                  {isCustomSupervisor ? 'Escolher da Operação' : '+ Informar Outro Supervisor'}
                </button>
              )}
            </div>

            {isCustomSupervisor ? (
              <input
                type="text"
                required
                value={customSupervisor}
                onChange={(e) => setCustomSupervisor(e.target.value)}
                placeholder="NOME DO SUPERVISOR DESTINO"
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold uppercase focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
              />
            ) : (
              <select
                value={toSupervisor}
                onChange={(e) => setToSupervisor(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 cursor-pointer"
              >
                {destinationOptions.map(sup => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* New Schedule */}
          <div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-1.5">
              Horário na Nova Supervisão (Ajuste se houver troca de turno):
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase">
                  Nova Entrada
                </label>
                <input
                  type="text"
                  required
                  value={toEntrada}
                  onChange={(e) => handleEntradaChange(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase">
                  Nova Saída
                </label>
                <input
                  type="text"
                  required
                  value={toSaida}
                  onChange={(e) => setToSaida(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase">
                  Jornada (min)
                </label>
                <input
                  type="number"
                  min="60"
                  max="600"
                  value={toJornadaMin}
                  onChange={(e) => setToJornadaMin(parseInt(e.target.value, 10) || 380)}
                  className="w-full h-9 px-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
              Motivo / Informativo da Transferência:
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique o motivo da transferência para o supervisor que vai receber..."
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300">
            Ao enviar, o supervisor de destino receberá um <strong>pop-up informativo</strong> para aceitar ou recusar a transferência com data, hora e horário atualizado.
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
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Solicitação de Transferência</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
