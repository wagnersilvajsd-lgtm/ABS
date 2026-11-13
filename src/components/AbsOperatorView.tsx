import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Operator,
  OperatorMonthlyData,
  DayRecord,
  StatusType
} from '../types/abs';
import {
  STATUS_OPTIONS
} from '../data/initialData';
import {
  formatMonthLabel,
  getMonthWeekends,
  getWeekdayAbbr,
  isWeekendDate,
  parseMonthKey,
  WeekendFolgaMode
} from '../utils/calendar';
import {
  calculateDayAbs,
  calculateOperatorStats,
  calculateSupervisorStats,
  formatMinutesToHours,
  formatPercent
} from '../utils/calculations';
import {
  Save,
  RotateCcw,
  Eraser,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Info,
  CalendarCheck,
  Filter,
  Users,
  Search,
  CheckCheck,
  SlidersHorizontal,
  Flame,
  Zap,
  Target,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface AbsOperatorViewProps {
  operators: Operator[];
  currentOperatorId: string;
  onSelectOperator: (id: string) => void;
  monthlyData: Record<string, OperatorMonthlyData>;
  onUpdateDays: (operatorId: string, dias: DayRecord[]) => void;
  onSave: () => void;
  onResetOperatorMonth: (operatorId: string) => void;
  onApply6x1Schedule: (operatorId: string, mode?: WeekendFolgaMode) => void;
  selectedMonthKey: string;
}

export const AbsOperatorView: React.FC<AbsOperatorViewProps> = ({
  operators,
  currentOperatorId,
  onSelectOperator,
  monthlyData,
  onUpdateDays,
  onSave,
  onResetOperatorMonth,
  onApply6x1Schedule,
  selectedMonthKey
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const monthWeekends = useMemo(() => getMonthWeekends(year, month), [year, month]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('todos');
  const [opSearchTerm, setOpSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<'todos' | 'desvios' | 'faltas' | 'folgas' | 'fds'>('todos');
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  // List of distinct supervisors from current operators
  const availableSupervisors = useMemo(() => {
    return Array.from(new Set(operators.map(op => op.supervisor).filter(Boolean))).sort();
  }, [operators]);

  // Count of operators per supervisor
  const supervisorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    operators.forEach(op => {
      counts[op.supervisor] = (counts[op.supervisor] || 0) + 1;
    });
    return counts;
  }, [operators]);

  // Operators filtered by supervisor & search query
  const operatorsBySupervisor = useMemo(() => {
    let list = operators;
    if (selectedSupervisor !== 'todos') {
      list = list.filter(op => op.supervisor.toLowerCase() === selectedSupervisor.toLowerCase());
    }
    if (opSearchTerm.trim()) {
      const term = opSearchTerm.toLowerCase();
      list = list.filter(op => op.nome.toLowerCase().includes(term) || op.entrada.includes(term));
    }
    return list;
  }, [operators, selectedSupervisor, opSearchTerm]);

  // Filtered index of active operator
  const currentFilteredIndex = useMemo(() => {
    const idx = operatorsBySupervisor.findIndex(op => op.id === currentOperatorId);
    return idx >= 0 ? idx : 0;
  }, [operatorsBySupervisor, currentOperatorId]);

  const operator = operatorsBySupervisor[currentFilteredIndex] || operatorsBySupervisor[0] || operators[0];

  // Keep supervisor filter in sync if current operator changes externally
  useEffect(() => {
    if (operator && selectedSupervisor !== 'todos' && operator.supervisor.toLowerCase() !== selectedSupervisor.toLowerCase()) {
      setSelectedSupervisor(operator.supervisor);
    }
  }, [currentOperatorId, operator, selectedSupervisor]);

  // Switch supervisor filter and auto-select their first operator
  const handleSupervisorFilterChange = (supervisor: string) => {
    setSelectedSupervisor(supervisor);
    if (supervisor !== 'todos') {
      const matching = operators.filter(op => op.supervisor.toLowerCase() === supervisor.toLowerCase());
      if (matching.length > 0 && (!operator || operator.supervisor.toLowerCase() !== supervisor.toLowerCase())) {
        onSelectOperator(matching[0].id);
      }
    }
  };

  // Operator monthly records (31 days)
  const opData = monthlyData[operator?.id] || {
    operatorId: operator?.id,
    dias: []
  };

  const dias = opData.dias;

  // Real-time calculations matching Google Sheets
  const operatorStats = useMemo(() => {
    return calculateOperatorStats(dias, operator?.jornadaMin || 380);
  }, [dias, operator?.jornadaMin]);

  // Supervisor ABS (Coluna F in Google Sheets)
  const supervisorStats = useMemo(() => {
    if (!operator) return null;
    return calculateSupervisorStats(operator.supervisor, operators, monthlyData);
  }, [operator, operators, monthlyData]);

  // Show temporary toast feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handlers for updating row data
  const handleStatusChange = (diaNum: number, newStatus: StatusType) => {
    const updated = dias.map(d => {
      if (d.dia === diaNum) {
        const nextAtraso = newStatus === 'dia ok/atraso' ? (d.atraso > 0 ? d.atraso : 15) : 0;
        return {
          ...d,
          status: newStatus,
          atraso: nextAtraso
        };
      }
      return d;
    });
    onUpdateDays(operator.id, updated);
  };

  const handleAtrasoChange = (diaNum: number, minutes: number) => {
    const validMinutes = Math.max(0, Math.min(operator.jornadaMin, minutes || 0));
    const updated = dias.map(d => {
      if (d.dia === diaNum) {
        return {
          ...d,
          atraso: validMinutes,
          status: validMinutes > 0 ? ('dia ok/atraso' as StatusType) : ('dia ok' as StatusType)
        };
      }
      return d;
    });
    onUpdateDays(operator.id, updated);
  };

  // Quick single-day presets
  const handleSetRowQuick = (diaNum: number, status: StatusType, atraso: number = 0) => {
    const updated = dias.map(d => (d.dia === diaNum ? { ...d, status, atraso } : d));
    onUpdateDays(operator.id, updated);
  };

  // Batch action: fill all non-folga days with 'dia ok'
  const handleBatchFillWorkingDaysOk = () => {
    const updated = dias.map(d => {
      if (d.status !== 'folga') {
        return { ...d, status: 'dia ok' as StatusType, atraso: 0 };
      }
      return d;
    });
    onUpdateDays(operator.id, updated);
    showToast('Todos os dias escalados foram definidos como "Dia OK"!');
  };

  // Previous and Next Operator navigation (strictly within supervisor team)
  const handlePrevOperator = () => {
    if (operatorsBySupervisor.length === 0) return;
    if (currentFilteredIndex > 0) {
      onSelectOperator(operatorsBySupervisor[currentFilteredIndex - 1].id);
    } else {
      onSelectOperator(operatorsBySupervisor[operatorsBySupervisor.length - 1].id);
    }
  };

  const handleNextOperator = () => {
    if (operatorsBySupervisor.length === 0) return;
    if (currentFilteredIndex < operatorsBySupervisor.length - 1) {
      onSelectOperator(operatorsBySupervisor[currentFilteredIndex + 1].id);
    } else {
      onSelectOperator(operatorsBySupervisor[0].id);
    }
  };

  // Keyboard navigation shortcuts (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevOperator();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextOperator();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFilteredIndex, operatorsBySupervisor]);

  // Jump to specific day row in the table
  const handleScrollToDay = (diaNum: number) => {
    setFocusedDay(diaNum);
    setDayFilter('todos');
    setTimeout(() => {
      const el = document.getElementById(`dia-row-${diaNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
    setTimeout(() => setFocusedDay(null), 2500);
  };

  // Counts of days for interactive filter tabs
  const countsByStatus = useMemo(() => {
    const desvios = dias.filter(d => d.status === 'dia ok/atraso' || d.status === 'falta' || d.status === 'atestado' || d.status === 'suspensão').length;
    const faltas = dias.filter(d => d.status === 'falta' || d.status === 'suspensão' || d.status === 'atestado').length;
    const folgas = dias.filter(d => d.status === 'folga').length;
    const fds = dias.filter(d => isWeekendDate(year, month, d.dia)).length;
    return { desvios, faltas, folgas, fds };
  }, [dias, year, month]);

  // Filtered days list for the table
  const displayedDias = useMemo(() => {
    if (dayFilter === 'todos') return dias;
    if (dayFilter === 'desvios') {
      return dias.filter(d => d.status === 'dia ok/atraso' || d.status === 'falta' || d.status === 'atestado' || d.status === 'suspensão');
    }
    if (dayFilter === 'faltas') {
      return dias.filter(d => d.status === 'falta' || d.status === 'suspensão' || d.status === 'atestado');
    }
    if (dayFilter === 'folgas') {
      return dias.filter(d => d.status === 'folga');
    }
    if (dayFilter === 'fds') {
      return dias.filter(d => isWeekendDate(year, month, d.dia));
    }
    return dias;
  }, [dias, dayFilter, year, month]);

  // Target WFM benchmark 3% metrics for the active operator
  const targetAbsThreshold = 0.03; // 3.00%
  const maxAllowedLostMinutes = Math.floor(operatorStats.minutosEscalados * targetAbsThreshold);
  const minutesMargin = maxAllowedLostMinutes - operatorStats.minutosPerdidos;
  const isOperatorWithinMeta = operatorStats.absMensal <= targetAbsThreshold;

  // Percentage breakdown for visual composition bar
  const totalDays = dias.length || monthWeekends.totalDays;
  const pctOk = Math.round((operatorStats.diasTrabalhados / totalDays) * 100);
  const pctFolga = Math.round((operatorStats.diasFolga / totalDays) * 100);
  const pctAtraso = Math.round((operatorStats.diasAtraso / totalDays) * 100);
  const pctFalta = Math.round(((operatorStats.diasFalta + operatorStats.diasAtestado + operatorStats.diasSuspensao) / totalDays) * 100);

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status: StatusType) => {
    switch (status) {
      case 'dia ok':
        return 'bg-teal-50 text-[#006772] dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800/40';
      case 'dia ok/atraso':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
      case 'falta':
        return 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
      case 'atestado':
        return 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
      case 'suspensão':
        return 'bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
      case 'folga':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-400 border-slate-200 dark:border-slate-700/60';
    }
  };

  if (!operator) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-xs">
        <Users className="w-10 h-10 text-[#006772] mx-auto mb-3 opacity-80" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Nenhum operador cadastrado nesta operação
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Acesse a aba <strong>Operações</strong> ou <strong>Operadores</strong> para adicionar supervisores e colaboradores a esta operação.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#2dd4bf] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section: Operator Selection & Supervisor ABS Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Dynamic Header & Operator Selection */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#006772] dark:text-[#2dd4bf]">
                  Apontamento Dinâmico (ABS OPERADOR)
                </span>
                <span className="text-[10px] bg-teal-50 dark:bg-teal-950/60 text-[#006772] dark:text-teal-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  Escala 6x1
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {operator.nome}
              </h2>
            </div>

            {/* Quick Navigation Between Operators + Keyboard Hints */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
                Atalho: [← / →]
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {currentFilteredIndex + 1} de {operatorsBySupervisor.length}
                {selectedSupervisor !== 'todos' ? ` (${selectedSupervisor})` : ''}
              </span>
              <button
                onClick={handlePrevOperator}
                title="Operador anterior (tecla ←)"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextOperator}
                title="Próximo operador (tecla →)"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filtro por Supervisor */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf] shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                Filtro de Supervisor:
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSupervisorFilterChange('todos')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedSupervisor === 'todos'
                    ? 'bg-[#006772] text-white font-bold shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Todos ({operators.length})
              </button>
              {availableSupervisors.map((sup) => (
                <button
                  key={sup}
                  type="button"
                  onClick={() => handleSupervisorFilterChange(sup)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    selectedSupervisor.toLowerCase() === sup.toLowerCase()
                      ? 'bg-[#006772] text-white font-bold shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {sup} ({supervisorCounts[sup] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Form fields mimicking cells A1:D4 + Quick Search */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Cell B1: Seleção do Operador */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  B1: Seleção do Operador
                </label>
                {selectedSupervisor !== 'todos' && (
                  <span className="text-[10px] text-[#006772] dark:text-[#2dd4bf] font-semibold bg-teal-50 dark:bg-teal-950/50 px-1.5 py-0.5 rounded">
                    Equipe de {selectedSupervisor} ({operatorsBySupervisor.length})
                  </span>
                )}
              </div>
              
              <div className="space-y-1.5">
                <div className="relative">
                  <select
                    value={operator?.id || ''}
                    onChange={(e) => onSelectOperator(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-teal-50/70 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 font-bold text-sm rounded-lg border border-teal-300 dark:border-teal-700/60 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/40 transition-all cursor-pointer truncate"
                  >
                    {operatorsBySupervisor.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nome} {selectedSupervisor === 'todos' ? `— ${op.supervisor}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instant Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={opSearchTerm}
                    onChange={(e) => setOpSearchTerm(e.target.value)}
                    placeholder="Filtrar por nome ou horário..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                  {opSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setOpSearchTerm('')}
                      className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-600 px-1 bg-slate-200 dark:bg-slate-700 rounded"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cell B2: Supervisor (PROCV) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                B2: Supervisor (PROCV)
              </label>
              <div className="h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                  <span className="truncate">{operator.supervisor}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-[#006772] dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 font-bold">
                  Meta Sup: ≤ 3.00%
                </span>
              </div>

              {/* Cells B3 & B4: Horários Entrada e Saída */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    B3: Entrada
                  </label>
                  <div className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <Clock className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                    {operator.entrada}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    B4: Saída
                  </label>
                  <div className="h-8 px-2.5 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-mono text-xs rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <Clock className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                    {operator.saida}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Live Health & Target Tolerance Gauge Card */}
          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf]" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Termômetro de Tolerância WFM (Meta ≤ 3.00%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  isOperatorWithinMeta
                    ? 'bg-teal-100 text-[#006772] dark:bg-teal-950/80 dark:text-teal-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                }`}>
                  {isOperatorWithinMeta ? '✓ Dentro da Meta (≤ 3%)' : '⚠ Acima do Teto (> 3%)'}
                </span>
              </div>
            </div>

            {/* Visual Tolerance Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                <span className="text-slate-600 dark:text-slate-400">
                  ABS Atual: <strong className="text-slate-900 dark:text-white font-bold">{formatPercent(operatorStats.absMensal)}</strong>
                </span>
                <span className="text-slate-500 font-medium">
                  {minutesMargin >= 0 ? (
                    <span className="text-[#006772] dark:text-[#2dd4bf] font-bold">
                      +{minutesMargin} min de margem livre
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      {Math.abs(minutesMargin)} min acima da tolerância
                    </span>
                  )}
                </span>
              </div>

              {/* Progress bar with 3% marker */}
              <div className="relative h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    operatorStats.absMensal === 0
                      ? 'bg-[#006772]'
                      : operatorStats.absMensal <= targetAbsThreshold
                      ? 'bg-[#006772]'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (operatorStats.absMensal / 0.06) * 100)}%`
                  }}
                />
              </div>

              {/* Scale reference labels */}
              <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
                <span>0.00%</span>
                <span className="font-bold text-[#006772] dark:text-[#2dd4bf]">Meta: 3.00%</span>
                <span>6.00%+</span>
              </div>
            </div>

            {/* Month Composition Breakdown Bar */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3 flex-wrap text-[11px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Distribuição:
              </span>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006772] shrink-0"></span>
                <span>OK: <strong>{operatorStats.diasTrabalhados}d</strong> ({pctOk}%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d89627] shrink-0"></span>
                <span>Atrasos: <strong>{operatorStats.diasAtraso}d</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>Faltas: <strong>{operatorStats.diasFalta + operatorStats.diasAtestado + operatorStats.diasSuspensao}d</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
                <span>Folgas: <strong>{operatorStats.diasFolga}d</strong> ({pctFolga}%)</span>
              </div>
            </div>
          </div>

          {/* Quick Toolbar for current operator */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  onSave();
                  showToast(`Apontamentos de ${operator.nome} (${monthLabel}) salvos com sucesso!`);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Apontamentos</span>
              </button>

              <button
                onClick={handleBatchFillWorkingDaysOk}
                title="Define todos os dias úteis como OK sem alterar as folgas"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#006772] dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 rounded-lg transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#006772]" />
                <span>Todos Dias Úteis OK</span>
              </button>

              <button
                onClick={() => {
                  onApply6x1Schedule(operator.id, 'auto');
                  showToast(`Escala 6x1 de ${monthLabel} (${totalDays} dias) aplicada!`);
                }}
                title="Aplica automaticamente a escala 6x1 pelos finais de semana reais do mês"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Escala 6x1 ({monthLabel.split('/')[0].trim()})</span>
              </button>

              <button
                onClick={() => {
                  onApply6x1Schedule(operator.id, '3-dom');
                  showToast(`3 folgas de FDS aplicadas em ${monthLabel} (${totalDays - 3} dias escalados).`);
                }}
                title="Aplica 3 folgas de final de semana neste mês (ideal para meses com 3 FDS)"
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 rounded-lg transition-colors cursor-pointer"
              >
                <span>3 Folgas FDS</span>
              </button>

              <button
                onClick={() => {
                  onApply6x1Schedule(operator.id, '4-dom');
                  showToast(`Até 4 folgas de FDS aplicadas em ${monthLabel}.`);
                }}
                title="Aplica até 4 folgas de final de semana neste mês"
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <span>4 Folgas FDS</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm(`Deseja limpar todos os apontamentos de ${monthLabel} de ${operator.nome}? Os dias escalados voltarão para 'dia ok' e atrasos para 0.`)) {
                    onResetOperatorMonth(operator.id);
                    showToast('Mês do operador reiniciado.');
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Limpar Mês</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Col: Coluna F (ABS SUPERVISOR - JSD Telecom Deep Teal gradient card) */}
        <div className="bg-gradient-to-br from-[#006772] via-[#005059] to-[#00383f] text-white rounded-xl p-5 shadow-sm flex flex-col justify-between border border-[#004750]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-teal-200">
                Coluna F: ABS SUPERVISOR
              </span>
              <span className="text-[10px] bg-white/10 text-teal-100 px-2 py-0.5 rounded font-mono border border-white/15">
                SUMIF Ponderado
              </span>
            </div>

            <h3 className="text-base font-bold text-white mt-1">
              {operator.supervisor}
            </h3>
            <p className="text-xs text-teal-200/80 mt-0.5">
              Equipe de {supervisorStats?.totalOperadores || 0} operadores vinculados
            </p>

            <div className="mt-4 pt-4 border-t border-white/15">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-white">
                  {formatPercent(supervisorStats?.absPercent || 0)}
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/20 border border-white/20 text-teal-200">
                  Meta: ≤ 3.00%
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-teal-200 font-medium">
                  Índice Consolidado da Supervisão
                </span>
                <span className={`text-[10px] font-bold ${
                  (supervisorStats?.absPercent || 0) <= 0.03
                    ? 'text-teal-200'
                    : 'text-[#d89627]'
                }`}>
                  {(supervisorStats?.absPercent || 0) <= 0.03 ? '✓ Dentro da Meta (≤ 3%)' : '⚠ Acima de 3.00%'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-white/15 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#002e33]/60 p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-teal-200 block uppercase">Min. Perdidos</span>
              <span className="font-bold font-mono tabular-nums text-white">
                {(supervisorStats?.minutosPerdidos || 0).toLocaleString('pt-BR')} min
              </span>
              <span className="text-[10px] text-teal-300 block">
                ≈ {formatMinutesToHours(supervisorStats?.minutosPerdidos || 0)}
              </span>
            </div>

            <div className="bg-[#002e33]/60 p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-teal-200 block uppercase">Min. Escalados</span>
              <span className="font-bold font-mono tabular-nums text-white">
                {(supervisorStats?.minutosEscalados || 0).toLocaleString('pt-BR')} min
              </span>
              <span className="text-[10px] text-teal-300 block">
                ≈ {formatMinutesToHours(supervisorStats?.minutosEscalados || 0)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Mini-Calendário Interativo do Mês Selecionado */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf]" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Visão de {monthLabel} — {totalDays} Dias ({operatorStats.diasFolga} folgas / {totalDays - operatorStats.diasFolga} escalados)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Finais de semana reais (Sáb/Dom) em destaque laranja
          </span>
        </div>

        {/* Month Day Buttons Row */}
        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 lg:flex lg:gap-1 gap-1">
          {dias.map((d) => {
            const weekdayName = getWeekdayAbbr(year, month, d.dia);
            const isWeekend = isWeekendDate(year, month, d.dia);

            // Status color dot
            let dotColor = 'bg-[#006772]';
            if (d.status === 'dia ok/atraso') dotColor = 'bg-[#d89627]';
            if (d.status === 'falta') dotColor = 'bg-rose-500';
            if (d.status === 'atestado') dotColor = 'bg-blue-500';
            if (d.status === 'suspensão') dotColor = 'bg-purple-500';
            if (d.status === 'folga') dotColor = 'bg-slate-400';

            return (
              <button
                key={d.dia}
                type="button"
                onClick={() => handleScrollToDay(d.dia)}
                title={`Dia ${d.dia} (${weekdayName}) — Status: ${d.status}${d.atraso > 0 ? ` (${d.atraso} min)` : ''}`}
                className={`lg:flex-1 flex flex-col items-center justify-center p-1 rounded-lg border text-center transition-all hover:scale-105 active:scale-95 ${
                  focusedDay === d.dia
                    ? 'ring-2 ring-[#006772] bg-teal-100 dark:bg-teal-950 border-[#006772] shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <span className={`text-[10px] font-bold font-mono ${
                  isWeekend ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {d.dia.toString().padStart(2, '0')}
                </span>
                <span className={`text-[8px] font-semibold ${
                  isWeekend ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                }`}>
                  {weekdayName}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotColor}`}></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Interactive Timesheet Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        
        {/* Table Title and Quick Filters */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Tabela de Apontamento Mensal ({monthLabel})
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Mostrando {displayedDias.length} de {totalDays} dias
            </span>
          </div>

          {/* Quick Day Filter Pills */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setDayFilter('todos')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                dayFilter === 'todos'
                  ? 'bg-[#006772] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos ({totalDays})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('desvios')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                dayFilter === 'desvios'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              Desvios / Atrasos ({countsByStatus.desvios})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('faltas')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                dayFilter === 'faltas'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              Faltas ({countsByStatus.faltas})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('folgas')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                dayFilter === 'folgas'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Folgas ({countsByStatus.folgas})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('fds')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                dayFilter === 'fds'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-700'
              }`}
            >
              Finais de Semana ({countsByStatus.fds})
            </button>
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-[#005059] text-white font-bold text-[11px] tracking-wide">
              <tr>
                <th className="py-2.5 px-4 w-24 text-center border-r border-[#00383f]">
                  dias (A)
                </th>
                <th className="py-2.5 px-4 w-48 text-center border-r border-[#00383f]">
                  status (B)
                </th>
                <th className="py-2.5 px-4 w-44 text-center border-r border-[#00383f]">
                  atraso em minutos (C)
                </th>
                <th className="py-2.5 px-4 w-36 text-center border-r border-[#00383f]">
                  ABS diario (D)
                </th>
                <th className="py-2.5 px-4 text-center">
                  Ações Rápidas de Linha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {displayedDias.map((d) => {
                const weekdayName = getWeekdayAbbr(year, month, d.dia);
                // Apenas finais de semana (Sábado e Domingo) em laranja
                const isWeekend = isWeekendDate(year, month, d.dia);
                const dailyAbs = calculateDayAbs(d.status, d.atraso, operator.jornadaMin);
                const isTargetRow = focusedDay === d.dia;

                return (
                  <tr
                    id={`dia-row-${d.dia}`}
                    key={d.dia}
                    className={`transition-all duration-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                      isTargetRow
                        ? 'bg-teal-100/80 dark:bg-teal-950/70 ring-2 ring-[#006772]'
                        : d.status === 'folga'
                        ? 'bg-slate-50/40 dark:bg-slate-900/40 opacity-80'
                        : d.status === 'falta'
                        ? 'bg-rose-50/30 dark:bg-rose-950/20'
                        : d.status === 'dia ok/atraso'
                        ? 'bg-amber-50/30 dark:bg-amber-950/20'
                        : ''
                    }`}
                  >
                    {/* Dia (Coluna A) */}
                    <td className="py-2 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-center gap-1.5 font-mono">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {d.dia.toString().padStart(2, '0')}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1 rounded ${
                            isWeekend
                              ? 'text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/60 font-bold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {weekdayName}
                        </span>
                      </div>
                    </td>

                    {/* Status (Coluna B) */}
                    <td className="py-1.5 px-3 border-r border-slate-100 dark:border-slate-800">
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d.dia, e.target.value as StatusType)}
                        className={`w-full py-1 px-2.5 text-xs font-semibold rounded-md border text-center transition-all cursor-pointer ${getStatusBadgeClass(
                          d.status
                        )}`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Atraso em Minutos (Coluna C) */}
                    <td className="py-1.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max={operator.jornadaMin}
                          value={d.status === 'dia ok/atraso' ? d.atraso : 0}
                          disabled={d.status !== 'dia ok/atraso'}
                          onChange={(e) => handleAtrasoChange(d.dia, parseInt(e.target.value) || 0)}
                          className={`w-20 text-center font-mono py-1 px-2 text-xs rounded border transition-colors ${
                            d.status === 'dia ok/atraso'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-bold border-amber-300 dark:border-amber-700'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                          }`}
                          placeholder="0"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">min</span>

                        {d.status === 'dia ok/atraso' && (
                          <div className="flex items-center gap-0.5 ml-1">
                            <button
                              type="button"
                              onClick={() => handleAtrasoChange(d.dia, d.atraso + 15)}
                              className="px-1 py-0.5 text-[10px] font-mono bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 rounded cursor-pointer"
                              title="+15 minutos"
                            >
                              +15
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAtrasoChange(d.dia, d.atraso + 30)}
                              className="px-1 py-0.5 text-[10px] font-mono bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 rounded cursor-pointer"
                              title="+30 minutos"
                            >
                              +30
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* ABS Diário (Coluna D - Fórmula) */}
                    <td className="py-2 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                      {dailyAbs === null ? (
                        <span className="text-slate-400 font-normal italic" title="Folga não pontua e não distorce o cálculo">
                          — (folga)
                        </span>
                      ) : dailyAbs === 0 ? (
                        <span className="text-[#006772] dark:text-[#2dd4bf] font-medium">
                          0.00%
                        </span>
                      ) : dailyAbs === 1 ? (
                        <span className="text-rose-700 dark:text-rose-400 font-bold">
                          100.00%
                        </span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-400 font-bold">
                          {(dailyAbs * 100).toFixed(2)}%
                        </span>
                      )}
                    </td>

                    {/* Ações Rápidas por Linha */}
                    <td className="py-1.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'dia ok', 0)}
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                            d.status === 'dia ok'
                              ? 'bg-[#006772] text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-950/60'
                          }`}
                        >
                          OK
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'folga', 0)}
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                            d.status === 'folga'
                              ? 'bg-slate-700 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          Folga
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'falta', 0)}
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                            d.status === 'falta'
                              ? 'bg-rose-700 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950/60'
                          }`}
                        >
                          Falta
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'atestado', 0)}
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                            d.status === 'atestado'
                              ? 'bg-blue-700 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-950/60'
                          }`}
                        >
                          Atestado
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Consolidado Footer (Matching Sheets Rows 38 to 40) */}
        <div className="bg-[#00383f] text-white p-5 border-t border-[#002e33] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Row 39: Minutos Perdidos */}
          <div className="bg-[#002e33]/70 p-3.5 rounded-lg border border-[#004e57]">
            <span className="text-[11px] font-bold text-teal-200 block uppercase tracking-wide">
              Linha 39: Minutos Perdidos (Mês)
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {operatorStats.minutosPerdidos.toLocaleString('pt-BR')} min
            </div>
            <span className="text-xs text-teal-300/80 mt-0.5 block">
              Equivalente a {formatMinutesToHours(operatorStats.minutosPerdidos)}
            </span>
          </div>

          {/* Row 40: Minutos Escalados */}
          <div className="bg-[#002e33]/70 p-3.5 rounded-lg border border-[#004e57]">
            <span className="text-[11px] font-bold text-teal-200 block uppercase tracking-wide">
              Linha 40: Minutos Escalados (Mês)
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {operatorStats.minutosEscalados.toLocaleString('pt-BR')} min
            </div>
            <span className="text-[11px] text-teal-300/80 mt-0.5 block font-mono">
              = (COUNTIF(&lt;&gt;folga) - COUNTIF("")) * {operator.jornadaMin}
            </span>
            <span className="text-[11px] text-teal-300 mt-0.5 block">
              {operatorStats.diasTrabalhados + operatorStats.diasFalta + operatorStats.diasAtestado + operatorStats.diasSuspensao} dias úteis ({operatorStats.diasFolga} folgas flexíveis deduzidas)
            </span>
          </div>

          {/* Row 38: ABS CONSOLIDADO (D39 / D40) */}
          <div className="bg-[#006772] p-3.5 rounded-lg border border-[#2dd4bf]/40 text-center shadow-sm">
            <span className="text-[11px] font-bold text-teal-100 block uppercase tracking-wide">
              Linha 38: ABS CONSOLIDADO (Mês)
            </span>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-white mt-1">
              {formatPercent(operatorStats.absMensal)}
            </div>
            <span className="text-[11px] text-teal-100 mt-0.5 block">
              = Minutos Perdidos / Minutos Escalados
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
