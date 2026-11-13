import React, { useState } from 'react';
import { Operator, OperatorMonthlyData, DayRecord, StatusType } from '../types/abs';
import { SUPERVISORES_LIST } from '../data/initialData';
import { X, UserPlus, Clock, UserCheck, CalendarCheck, Check } from 'lucide-react';

interface AddOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOperator: (operator: Operator, monthlyData: OperatorMonthlyData) => void;
  existingSupervisors: string[];
  activeOperationId?: string;
}

export const AddOperatorModal: React.FC<AddOperatorModalProps> = ({
  isOpen,
  onClose,
  onAddOperator,
  existingSupervisors,
  activeOperationId = 'caern'
}) => {
  const [nome, setNome] = useState('');
  const [supervisor, setSupervisor] = useState(existingSupervisors[0] || SUPERVISORES_LIST[0]);
  const [isCustomSupervisor, setIsCustomSupervisor] = useState(false);
  const [customSupervisorName, setCustomSupervisorName] = useState('');
  const [entrada, setEntrada] = useState('08:00:00');
  const [saida, setSaida] = useState('14:20:00');
  const [jornadaMin, setJornadaMin] = useState(380);
  const [folgaFdsType, setFolgaFdsType] = useState<'domingo' | 'sabado'>('domingo');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-calculate saída based on entrada (adding 6h20min)
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
        const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
        setSaida(formatted);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedNome = nome.trim().toUpperCase();
    if (!trimmedNome) {
      setError('Por favor, informe o nome completo do colaborador.');
      return;
    }

    const finalSupervisor = (isCustomSupervisor ? customSupervisorName.trim() : supervisor).toUpperCase();
    if (!finalSupervisor) {
      setError('Por favor, selecione ou informe o supervisor responsável.');
      return;
    }

    // Generate unique ID
    const newId = `op-${Date.now()}`;

    // Determine weekend off days [7, 14, 21, 28] for Domingos or [6, 13, 20, 27] for Sábados
    const fdsFolgas = folgaFdsType === 'domingo' ? [7, 14, 21, 28] : [6, 13, 20, 27];

    const newOperator: Operator = {
      id: newId,
      nome: trimmedNome,
      supervisor: finalSupervisor,
      entrada: entrada.trim(),
      saida: saida.trim(),
      jornadaMin: Number(jornadaMin) || 380,
      offDayOfWeek: folgaFdsType === 'domingo' ? 1 : 7,
      operacaoId: activeOperationId
    };

    // Initialize 31 days with 4 flexible weekend folgas and 27 'dia ok'
    const dias: DayRecord[] = Array.from({ length: 31 }, (_, i) => {
      const dayNum = i + 1;
      const isFolga = fdsFolgas.indexOf(dayNum) !== -1;
      return {
        dia: dayNum,
        status: isFolga ? ('folga' as StatusType) : ('dia ok' as StatusType),
        atraso: 0
      };
    });

    const newMonthlyData: OperatorMonthlyData = {
      operatorId: newId,
      dias
    };

    onAddOperator(newOperator, newMonthlyData);

    // Reset form and close
    setNome('');
    setCustomSupervisorName('');
    setIsCustomSupervisor(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#006772] flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Adicionar Novo Operador
              </h3>
              <p className="text-xs text-slate-500">
                Cadastre o colaborador, vincule ao supervisor e defina a escala contratual.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
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
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: CARLOS EDUARDO DA SILVA"
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 uppercase"
            />
          </div>

          {/* Supervisor Responsável */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Supervisor Responsável:
              </label>
              <button
                type="button"
                onClick={() => setIsCustomSupervisor(!isCustomSupervisor)}
                className="text-[11px] text-[#006772] dark:text-[#2dd4bf] hover:underline font-medium cursor-pointer"
              >
                {isCustomSupervisor ? 'Selecionar da Lista' : '+ Novo Supervisor'}
              </button>
            </div>

            {isCustomSupervisor ? (
              <input
                type="text"
                required
                value={customSupervisorName}
                onChange={(e) => setCustomSupervisorName(e.target.value)}
                placeholder="Ex: FERNANDA ALVES PEREIRA"
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 uppercase"
              />
            ) : (
              <select
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 cursor-pointer"
              >
                {existingSupervisors.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Horários de Entrada e Saída */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                Horário de Entrada:
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={entrada}
                  onChange={(e) => handleEntradaChange(e.target.value)}
                  placeholder="08:00:00"
                  className="w-full h-10 pl-9 pr-3 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                Horário de Saída:
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={saida}
                  onChange={(e) => setSaida(e.target.value)}
                  placeholder="14:20:00"
                  className="w-full h-10 pl-9 pr-3 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>
            </div>
          </div>

          {/* Jornada Prevista e Escala de Folgas FDS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                Jornada Diária (Minutos):
              </label>
              <input
                type="number"
                min="60"
                max="600"
                value={jornadaMin}
                onChange={(e) => setJornadaMin(parseInt(e.target.value) || 380)}
                className="w-full h-10 px-3 text-xs font-mono font-bold bg-teal-50 dark:bg-teal-950/30 border border-teal-300 dark:border-teal-800 rounded-lg text-teal-950 dark:text-teal-200 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Padrão 380 min (6h20min)
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                4 Folgas FDS (Escala 6x1):
              </label>
              <select
                value={folgaFdsType}
                onChange={(e) => setFolgaFdsType(e.target.value as any)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold cursor-pointer"
              >
                <option value="domingo">Domingos (Dias 7, 14, 21, 28)</option>
                <option value="sabado">Sábados (Dias 6, 13, 20, 27)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Total: 4 folgas / 27 dias úteis
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Cadastrar Operador</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
