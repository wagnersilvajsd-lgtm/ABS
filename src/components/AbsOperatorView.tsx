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
  Eraser,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  CheckCircle2,
  CalendarCheck,
  Users,
  Search,
  Zap,
  Target,
  ClipboardList,
  ArrowRightLeft,
  Edit2
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
  onOpenProfile?: (operator: Operator) => void;
  onOpenTransfer?: (operator: Operator) => void;
  onOpenEditOperator?: (operator: Operator) => void;
  onOpenEditSupervisor?: (supervisorName: string, linkedCount: number) => void;
  operatorHistoryCount?: number;
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
  selectedMonthKey,
  onOpenProfile,
  onOpenTransfer,
  onOpenEditOperator,
  onOpenEditSupervisor,
  operatorHistoryCount = 0
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const monthWeekends = useMemo(() => getMonthWeekends(year, month), [year, month]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('todos');
  const [opSearchTerm, setOpSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<'todos' | 'desvios' | 'faltas' | 'abonos' | 'folgas' | 'fds'>('todos');
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

  // Operator monthly records
  const opData = monthlyData[operator?.id] || {
    operatorId: operator?.id,
    dias: []
  };

  const dias = opData.dias;

  // Real-time calculations
  const operatorStats = useMemo(() => {
    return calculateOperatorStats(dias, operator?.jornadaMin || 380);
  }, [dias, operator?.jornadaMin]);

  // Supervisor ABS
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
        if (newStatus === 'dia ok/atraso') {
          return {
            ...d,
            status: newStatus,
            atraso: d.atraso > 0 ? d.atraso : 15,
            abonoMin: undefined
          };
        }
        if (newStatus === 'abono' || newStatus === 'abono_legal') {
          const defaultAbono = Math.max(0, operator.jornadaMin - Math.min(120, operator.jornadaMin));
          return {
            ...d,
            status: newStatus,
            atraso: 0,
            abonoMin: d.abonoMin !== undefined && d.abonoMin > 0 ? Math.min(operator.jornadaMin, d.abonoMin) : defaultAbono
          };
        }
        return {
          ...d,
          status: newStatus,
          atraso: 0,
          abonoMin: undefined
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
          abonoMin: undefined,
          status: validMinutes > 0 ? ('dia ok/atraso' as StatusType) : ('dia ok' as StatusType)
        };
      }
      return d;
    });
    onUpdateDays(operator.id, updated);
  };

  const handleAbonoWorkedChange = (
    diaNum: number,
    workedMinutes: number,
    targetStatus: 'abono' | 'abono_legal' = 'abono'
  ) => {
    const validWorked = Math.max(0, Math.min(operator.jornadaMin, workedMinutes || 0));
    const nextAbono = Math.max(0, operator.jornadaMin - validWorked);
    const updated = dias.map(d => {
      if (d.dia === diaNum) {
        return {
          ...d,
          status: targetStatus as StatusType,
          atraso: 0,
          abonoMin: nextAbono
        };
      }
      return d;
    });
    onUpdateDays(operator.id, updated);
  };

  // Quick single-day presets
  const handleSetRowQuick = (diaNum: number, status: StatusType, atraso: number = 0, abonoMin?: number) => {
    const updated = dias.map(d => {
      if (d.dia !== diaNum) return d;
      if (status === 'abono' || status === 'abono_legal') {
        const defaultAbono = abonoMin !== undefined
          ? Math.max(0, Math.min(operator.jornadaMin, abonoMin))
          : Math.max(0, operator.jornadaMin - Math.min(120, operator.jornadaMin));
        return { ...d, status, atraso: 0, abonoMin: defaultAbono };
      }
      return { ...d, status, atraso, abonoMin: undefined };
    });
    onUpdateDays(operator.id, updated);
  };

  // Batch action: fill all non-folga days with 'dia ok'
  const handleBatchFillWorkingDaysOk = () => {
    const updated = dias.map(d => {
      if (d.status !== 'folga') {
        return { ...d, status: 'dia ok' as StatusType, atraso: 0, abonoMin: undefined };
      }
      return d;
    });
    onUpdateDays(operator.id, updated);
    showToast('Todos os dias escalados foram definidos como "Dia OK"!');
  };

  // Previous and Next Operator navigation
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
    const desvios = dias.filter(
      d =>
        d.status === 'dia ok/atraso' ||
        d.status === 'abono' ||
        d.status === 'falta' ||
        d.status === 'atestado' ||
        d.status === 'suspensão'
    ).length;
    const faltas = dias.filter(d => d.status === 'falta' || d.status === 'suspensão' || d.status === 'atestado').length;
    const abonos = dias.filter(
      d =>
        d.status === 'abono' ||
        d.status === 'abono_legal' ||
        d.status === 'banco_horas_integral' ||
        d.status === 'folga_aniversario'
    ).length;
    const folgas = dias.filter(
      d => d.status === 'folga' || d.status === 'folga_aniversario' || d.status === 'banco_horas_integral'
    ).length;
    const fds = dias.filter(d => isWeekendDate(year, month, d.dia)).length;
    return { desvios, faltas, abonos, folgas, fds };
  }, [dias, year, month]);

  // Filtered days list for the table
  const displayedDias = useMemo(() => {
    if (dayFilter === 'todos') return dias;
    if (dayFilter === 'desvios') {
      return dias.filter(
        d =>
          d.status === 'dia ok/atraso' ||
          d.status === 'abono' ||
          d.status === 'falta' ||
          d.status === 'atestado' ||
          d.status === 'suspensão'
      );
    }
    if (dayFilter === 'faltas') {
      return dias.filter(d => d.status === 'falta' || d.status === 'suspensão' || d.status === 'atestado');
    }
    if (dayFilter === 'abonos') {
      return dias.filter(
        d =>
          d.status === 'abono' ||
          d.status === 'abono_legal' ||
          d.status === 'banco_horas_integral' ||
          d.status === 'folga_aniversario'
      );
    }
    if (dayFilter === 'folgas') {
      return dias.filter(
        d => d.status === 'folga' || d.status === 'folga_aniversario' || d.status === 'banco_horas_integral'
      );
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
  const isSupervisorWithinMeta = (supervisorStats?.absPercent || 0) <= targetAbsThreshold;

  const totalDays = dias.length || monthWeekends.totalDays;
  const pctOk = totalDays > 0 ? Math.round((operatorStats.diasTrabalhados / totalDays) * 100) : 0;

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status: StatusType) => {
    switch (status) {
      case 'dia ok':
        return 'bg-teal-50 text-[#006772] dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800/40';
      case 'dia ok/atraso':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
      case 'abono':
        return 'bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800/40';
      case 'abono_legal':
        return 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40';
      case 'banco_horas_integral':
        return 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40';
      case 'folga_aniversario':
        return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
        <Users className="w-10 h-10 text-[#006772] mx-auto mb-3 opacity-80" />
        <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
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

      {/* Bar 1: Supervisor Filter, Operator Selector & Prev/Next Navigation */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Supervisor Segmented Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
              Equipe:
            </span>
            <button
              type="button"
              onClick={() => handleSupervisorFilterChange('todos')}
              className={`h-8 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedSupervisor === 'todos'
                  ? 'bg-[#006772] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({operators.length})
            </button>
            {availableSupervisors.map((sup) => (
              <button
                key={sup}
                type="button"
                onClick={() => handleSupervisorFilterChange(sup)}
                className={`h-8 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  selectedSupervisor.toLowerCase() === sup.toLowerCase()
                    ? 'bg-[#006772] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sup} ({supervisorCounts[sup] || 0})
              </button>
            ))}
          </div>

          {/* Prev/Next Navigation */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
            <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
              [← / →]
            </span>
            <span className="h-9 px-3 inline-flex items-center text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {currentFilteredIndex + 1} / {operatorsBySupervisor.length}
            </span>
            <button
              type="button"
              onClick={handlePrevOperator}
              title="Operador anterior (tecla ←)"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextOperator}
              title="Próximo operador (tecla →)"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selector & Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="md:col-span-7">
            <label className="sr-only" htmlFor="abs-operator-select">
              Selecionar Colaborador
            </label>
            <select
              id="abs-operator-select"
              value={operator?.id || ''}
              onChange={(e) => onSelectOperator(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/40 transition-colors cursor-pointer truncate"
            >
              {operatorsBySupervisor.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.nome} {selectedSupervisor === 'todos' ? `— ${op.supervisor}` : ''} ({op.entrada}–{op.saida})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={opSearchTerm}
              onChange={(e) => setOpSearchTerm(e.target.value)}
              placeholder="Buscar colaborador por nome ou turno..."
              className="w-full h-9 pl-9 pr-14 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
            />
            {opSearchTerm && (
              <button
                type="button"
                onClick={() => setOpSearchTerm('')}
                className="absolute right-2 top-1.5 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-200/80 dark:bg-slate-700 rounded cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Bar 2: Symmetrical 3-Column Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">

        {/* Card 1: Colaborador & Turno */}
        <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Colaborador · Escala 6x1
                </span>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {operator.nome}
                </h2>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                {operatorStats.diasTrabalhados}d OK ({pctOk}%)
              </span>
            </div>

            {/* Supervisor inline row */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf] shrink-0" />
              <span className="text-slate-400">Supervisão:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {operator.supervisor}
              </span>
              {onOpenEditSupervisor && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenEditSupervisor(
                      operator.supervisor,
                      supervisorCounts[operator.supervisor] || 0
                    )
                  }
                  title="Editar nome deste supervisor"
                  className="p-1 text-slate-400 hover:text-[#006772] dark:hover:text-[#2dd4bf] rounded transition-colors cursor-pointer shrink-0"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Schedule 3-column hairline strip */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Entrada</span>
                <span className="text-xs font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {operator.entrada}
                </span>
              </div>
              <div className="border-x border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Saída</span>
                <span className="text-xs font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 mt-0.5">
                  {operator.saida}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Jornada</span>
                <span className="text-xs font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {operator.jornadaMin}m/dia
                </span>
              </div>
            </div>
          </div>

          {/* 3-Button Action Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
            {onOpenEditOperator && (
              <button
                type="button"
                onClick={() => onOpenEditOperator(operator)}
                title="Editar nome e horário deste operador"
                className="h-8 flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}
            {onOpenProfile && (
              <button
                type="button"
                onClick={() => onOpenProfile(operator)}
                className="h-8 flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg cursor-pointer transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Perfil</span>
                {operatorHistoryCount > 0 && (
                  <span className="px-1.5 rounded-full bg-amber-600 text-white text-[10px] font-mono">
                    {operatorHistoryCount}
                  </span>
                )}
              </button>
            )}
            {onOpenTransfer && (
              <button
                type="button"
                onClick={() => onOpenTransfer(operator)}
                className="h-8 flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800 rounded-lg cursor-pointer transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transferir</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: ABS Individual & Tolerância */}
        <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 inline-flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf]" />
                ABS Individual · Meta ≤ 3.00%
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  isOperatorWithinMeta
                    ? 'text-[#006772] dark:text-[#2dd4bf]'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isOperatorWithinMeta ? 'Dentro da meta' : 'Acima da meta'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <div
                className={`font-display text-3xl font-bold font-mono tabular-nums tracking-tight ${
                  isOperatorWithinMeta
                    ? 'text-slate-900 dark:text-white'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatPercent(operatorStats.absMensal)}
              </div>
              <span
                className={`text-xs font-mono font-semibold ${
                  minutesMargin >= 0
                    ? 'text-[#006772] dark:text-[#2dd4bf]'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {minutesMargin >= 0
                  ? `+${minutesMargin} min livres`
                  : `${Math.abs(minutesMargin)} min excedentes`}
              </span>
            </div>

            {/* Tolerance Bar (0% - 3% - 6%) */}
            <div className="mt-3">
              <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isOperatorWithinMeta ? 'bg-[#006772] dark:bg-[#2dd4bf]' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (operatorStats.absMensal / 0.06) * 100)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400/70 dark:bg-slate-500"
                  title="Teto 3.00%"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0.00%</span>
                <span className="font-semibold text-[#006772] dark:text-[#2dd4bf]">3.00%</span>
                <span>6.00%+</span>
              </div>
            </div>
          </div>

          {/* Crisp Distribution Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-x-3 gap-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#006772]"></span>OK
              </span>
              <strong className="font-mono tabular-nums">{operatorStats.diasTrabalhados}d</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d89627]"></span>Atraso
              </span>
              <strong className="font-mono tabular-nums">{operatorStats.diasAtraso}d</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>Decl.
              </span>
              <strong className="font-mono tabular-nums">{operatorStats.diasAbono}d</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>BH/Aniv.
              </span>
              <strong className="font-mono tabular-nums">
                {operatorStats.diasAbonoLegal +
                  operatorStats.diasBancoHorasIntegral +
                  operatorStats.diasFolgaAniversario}d
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>Faltas
              </span>
              <strong className="font-mono tabular-nums">
                {operatorStats.diasFalta + operatorStats.diasAtestado + operatorStats.diasSuspensao}d
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>DSR
              </span>
              <strong className="font-mono tabular-nums">{operatorStats.diasFolga}d</strong>
            </div>
          </div>
        </div>

        {/* Card 3: ABS da Supervisão */}
        <div className="h-full bg-[#005059] text-white rounded-xl border border-[#004148] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-200">
                ABS da Supervisão
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  isSupervisorWithinMeta ? 'text-teal-200' : 'text-amber-300'
                }`}
              >
                {isSupervisorWithinMeta ? 'Dentro da meta' : 'Acima de 3.00%'}
              </span>
            </div>

            <div className="mt-1 flex items-baseline justify-between gap-2">
              <h3 className="font-display text-base font-bold text-white truncate">
                {operator.supervisor}
              </h3>
              <span className="text-xs text-teal-200/80 font-mono shrink-0">
                {supervisorStats?.totalOperadores || 0} operadores
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <div className="font-display text-3xl font-bold font-mono tabular-nums tracking-tight text-white">
                {formatPercent(supervisorStats?.absPercent || 0)}
              </div>
              <span className="text-xs font-mono text-teal-200/80">
                Meta ≤ 3.00%
              </span>
            </div>

            <div className="mt-3">
              <div className="relative h-2 bg-white/15 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isSupervisorWithinMeta ? 'bg-[#2dd4bf]' : 'bg-[#d89627]'
                  }`}
                  style={{
                    width: `${Math.min(100, ((supervisorStats?.absPercent || 0) / 0.06) * 100)}%`
                  }}
                />
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40" />
              </div>
            </div>
          </div>

          {/* Symmetrical 2-column hairline stats */}
          <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-teal-200/80 uppercase tracking-wider block">
                Min. Perdidos
              </span>
              <span className="font-bold font-mono tabular-nums text-sm text-white block mt-0.5">
                {(supervisorStats?.minutosPerdidos || 0).toLocaleString('pt-BR')} min
              </span>
              <span className="text-[11px] text-teal-200/75 font-mono">
                {formatMinutesToHours(supervisorStats?.minutosPerdidos || 0)}
              </span>
            </div>

            <div className="border-l border-white/15 pl-4">
              <span className="text-[10px] text-teal-200/80 uppercase tracking-wider block">
                Min. Escalados
              </span>
              <span className="font-bold font-mono tabular-nums text-sm text-white block mt-0.5">
                {(supervisorStats?.minutosEscalados || 0).toLocaleString('pt-BR')} min
              </span>
              <span className="text-[11px] text-teal-200/75 font-mono">
                {formatMinutesToHours(supervisorStats?.minutosEscalados || 0)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bar 3: Interactive Month Day Strip */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf]" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Mapa de {monthLabel} · {totalDays} dias ({totalDays - operatorStats.diasFolga} escalados · {operatorStats.diasFolga} folgas)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Clique em um dia para ir direto à linha · Sáb/Dom em âmbar
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 lg:flex lg:gap-1 gap-1">
          {dias.map((d) => {
            const weekdayName = getWeekdayAbbr(year, month, d.dia);
            const isWeekend = isWeekendDate(year, month, d.dia);

            let dotColor = 'bg-[#006772]';
            if (d.status === 'dia ok/atraso') dotColor = 'bg-[#d89627]';
            if (d.status === 'abono') dotColor = 'bg-orange-500';
            if (d.status === 'abono_legal') dotColor = 'bg-cyan-500';
            if (d.status === 'banco_horas_integral') dotColor = 'bg-indigo-500';
            if (d.status === 'folga_aniversario') dotColor = 'bg-emerald-500';
            if (d.status === 'falta') dotColor = 'bg-rose-500';
            if (d.status === 'atestado') dotColor = 'bg-blue-500';
            if (d.status === 'suspensão') dotColor = 'bg-purple-500';
            if (d.status === 'folga') dotColor = 'bg-slate-400';

            const dotTitle =
              d.status === 'abono'
                ? `Dia ${d.dia} (${weekdayName}) — Declaração / Horas Faltantes (${d.abonoMin || 0} min faltantes — gera ABS)`
                : d.status === 'abono_legal'
                ? `Dia ${d.dia} (${weekdayName}) — Abono Legal BH (${d.abonoMin || 0} min BH — sem ABS)`
                : d.status === 'banco_horas_integral'
                ? `Dia ${d.dia} (${weekdayName}) — Banco de Horas Integral (sem ABS)`
                : d.status === 'folga_aniversario'
                ? `Dia ${d.dia} (${weekdayName}) — Folga Aniversário (sem ABS)`
                : `Dia ${d.dia} (${weekdayName}) — Status: ${d.status}${d.atraso > 0 ? ` (${d.atraso} min)` : ''}`;

            return (
              <button
                key={d.dia}
                type="button"
                onClick={() => handleScrollToDay(d.dia)}
                title={dotTitle}
                className={`lg:flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-center btn-press cursor-pointer ${
                  focusedDay === d.dia
                    ? 'ring-2 ring-[#006772] bg-teal-50 dark:bg-teal-950 border-[#006772]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <span className={`text-[10px] font-bold font-mono tabular-nums ${
                  isWeekend ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {d.dia.toString().padStart(2, '0')}
                </span>
                <span className={`text-[9px] font-medium ${
                  isWeekend ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                }`}>
                  {weekdayName}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotColor}`}></span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Bar 4: Interactive Timesheet Sheet */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

        {/* Batch Actions & Title Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              Folha de Apontamento Mensal · {monthLabel}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exibindo {displayedDias.length} de {totalDays} dias
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onSave();
                showToast(`Apontamentos de ${operator.nome} (${monthLabel}) salvos com sucesso!`);
              }}
              className="h-9 inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Apontamentos</span>
            </button>

            <button
              type="button"
              onClick={handleBatchFillWorkingDaysOk}
              title="Define todos os dias úteis como OK sem alterar as folgas"
              className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-[#006772] dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Dias Úteis OK</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onApply6x1Schedule(operator.id, 'auto');
                showToast(`Escala 6x1 de ${monthLabel} (${totalDays} dias) aplicada!`);
              }}
              title="Aplica automaticamente a escala 6x1 pelos finais de semana reais do mês"
              className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Escala 6x1</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onApply6x1Schedule(operator.id, '3-dom');
                showToast(`3 folgas de FDS aplicadas em ${monthLabel} (${totalDays - 3} dias escalados).`);
              }}
              title="Aplica 3 folgas de final de semana neste mês"
              className="h-9 inline-flex items-center px-3 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 rounded-lg transition-colors cursor-pointer"
            >
              3 Folgas FDS
            </button>

            <button
              type="button"
              onClick={() => {
                onApply6x1Schedule(operator.id, '4-dom');
                showToast(`Até 4 folgas de FDS aplicadas em ${monthLabel}.`);
              }}
              title="Aplica até 4 folgas de final de semana neste mês"
              className="h-9 inline-flex items-center px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              4 Folgas FDS
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Deseja limpar todos os apontamentos de ${monthLabel} de ${operator.nome}? Os dias escalados voltarão para 'dia ok' e atrasos para 0.`)) {
                  onResetOperatorMonth(operator.id);
                  showToast('Mês do operador reiniciado.');
                }
              }}
              className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-lg transition-colors cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Limpar Mês</span>
            </button>
          </div>
        </div>

        {/* Status Filter Segmented Strip */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setDayFilter('todos')}
              className={`h-8 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                dayFilter === 'todos'
                  ? 'bg-[#006772] text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              Todos ({totalDays})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('desvios')}
              className={`h-8 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                dayFilter === 'desvios'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              Desvios / Atrasos ({countsByStatus.desvios})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('faltas')}
              className={`h-8 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                dayFilter === 'faltas'
                  ? 'bg-rose-700 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              Faltas ({countsByStatus.faltas})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('abonos')}
              className={`h-8 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                dayFilter === 'abonos'
                  ? 'bg-cyan-700 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              Abonos ({countsByStatus.abonos})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('folgas')}
              className={`h-8 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                dayFilter === 'folgas'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              Folgas ({countsByStatus.folgas})
            </button>
            <button
              type="button"
              onClick={() => setDayFilter('fds')}
              className={`h-8 px-3 rounded-lg font-semibold transition-colors cursor-pointer ${
                dayFilter === 'fds'
                  ? 'bg-amber-700 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              Finais de Semana ({countsByStatus.fds})
            </button>
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-[#005059] text-white font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-24 text-center border-r border-[#00383f]">
                  Dia
                </th>
                <th className="py-3 px-4 w-56 text-left border-r border-[#00383f]">
                  Status do Dia
                </th>
                <th className="py-3 px-4 w-72 text-center border-r border-[#00383f]">
                  Ocorrência / Minutos
                </th>
                <th className="py-3 px-4 w-36 text-right border-r border-[#00383f]">
                  ABS Diário
                </th>
                <th className="py-3 px-4 text-center">
                  Ações Rápidas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {displayedDias.map((d) => {
                const weekdayName = getWeekdayAbbr(year, month, d.dia);
                const isWeekend = isWeekendDate(year, month, d.dia);
                const validAbono = Math.max(0, Math.min(operator.jornadaMin, Number(d.abonoMin) || 0));
                const workedMinAbono = Math.max(0, operator.jornadaMin - validAbono);
                const dailyAbs = calculateDayAbs(d.status, d.atraso, operator.jornadaMin, validAbono);
                const isTargetRow = focusedDay === d.dia;

                return (
                  <tr
                    id={`dia-row-${d.dia}`}
                    key={d.dia}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                      isTargetRow
                        ? 'bg-teal-100/80 dark:bg-teal-950/70 ring-2 ring-[#006772]'
                        : d.status === 'folga'
                        ? 'bg-slate-50/40 dark:bg-slate-900/40 opacity-85'
                        : d.status === 'abono'
                        ? 'bg-orange-50/35 dark:bg-orange-950/20'
                        : d.status === 'abono_legal'
                        ? 'bg-cyan-50/35 dark:bg-cyan-950/20'
                        : d.status === 'banco_horas_integral'
                        ? 'bg-indigo-50/35 dark:bg-indigo-950/20'
                        : d.status === 'folga_aniversario'
                        ? 'bg-emerald-50/35 dark:bg-emerald-950/20'
                        : d.status === 'falta'
                        ? 'bg-rose-50/30 dark:bg-rose-950/20'
                        : d.status === 'dia ok/atraso'
                        ? 'bg-amber-50/30 dark:bg-amber-950/20'
                        : ''
                    }`}
                  >
                    {/* Dia */}
                    <td className="py-2 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-center gap-1.5 font-mono tabular-nums">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {d.dia.toString().padStart(2, '0')}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isWeekend
                              ? 'text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 font-bold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {weekdayName}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-3 border-r border-slate-100 dark:border-slate-800">
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d.dia, e.target.value as StatusType)}
                        className={`w-full h-8 px-2.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${getStatusBadgeClass(
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

                    {/* Ocorrência / Minutos */}
                    <td className="py-1.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      {d.status === 'abono' || d.status === 'abono_legal' ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className={`text-[10px] font-semibold ${
                                d.status === 'abono'
                                  ? 'text-orange-800 dark:text-orange-300'
                                  : 'text-cyan-800 dark:text-cyan-300'
                              }`}
                            >
                              Logou:
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={operator.jornadaMin}
                              value={workedMinAbono}
                              onChange={(e) =>
                                handleAbonoWorkedChange(
                                  d.dia,
                                  parseInt(e.target.value, 10) || 0,
                                  d.status as 'abono' | 'abono_legal'
                                )
                              }
                              title="Informe quantos minutos o colaborador trabalhou/logou no dia"
                              className={`w-16 text-center font-mono h-7 px-1.5 text-xs rounded border font-bold ${
                                d.status === 'abono'
                                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-950 dark:text-orange-100 border-orange-300 dark:border-orange-700'
                                  : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-100 border-cyan-300 dark:border-cyan-700'
                              }`}
                            />
                            <span className="text-[10px] text-slate-400 font-mono">m</span>
                            <div className="flex items-center gap-0.5 ml-0.5">
                              {[60, 120, 180, 240].map((mins) => (
                                <button
                                  key={mins}
                                  type="button"
                                  onClick={() =>
                                    handleAbonoWorkedChange(
                                      d.dia,
                                      Math.min(operator.jornadaMin, mins),
                                      d.status as 'abono' | 'abono_legal'
                                    )
                                  }
                                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                                    workedMinAbono === Math.min(operator.jornadaMin, mins)
                                      ? d.status === 'abono'
                                        ? 'bg-orange-600 text-white font-bold'
                                        : 'bg-cyan-700 text-white font-bold'
                                      : d.status === 'abono'
                                      ? 'bg-orange-100 dark:bg-orange-900/60 hover:bg-orange-200 text-orange-900 dark:text-orange-200'
                                      : 'bg-cyan-100 dark:bg-cyan-900/60 hover:bg-cyan-200 text-cyan-900 dark:text-cyan-200'
                                  }`}
                                  title={`Logou ${mins / 60}h (${mins} min)`}
                                >
                                  {mins / 60}h
                                </button>
                              ))}
                            </div>
                          </div>
                          {d.status === 'abono' ? (
                            <span className="text-[10px] font-mono font-semibold text-orange-700 dark:text-orange-300">
                              Faltantes: <strong>{validAbono} min</strong> ({formatMinutesToHours(validAbono)}) · gera ABS
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-semibold text-cyan-700 dark:text-cyan-300">
                              Saída Prog. BH: <strong>{validAbono} min</strong> ({formatMinutesToHours(validAbono)}) · 0 ABS
                            </span>
                          )}
                        </div>
                      ) : d.status === 'banco_horas_integral' ? (
                        <span className="inline-block px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                          BH Integral ({operator.jornadaMin}m · sem ABS)
                        </span>
                      ) : d.status === 'folga_aniversario' ? (
                        <span className="inline-block px-2.5 py-1 text-[11px] font-mono font-semibold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                          Folga Aniversário (sem ABS)
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max={operator.jornadaMin}
                            value={d.status === 'dia ok/atraso' ? d.atraso : 0}
                            disabled={d.status !== 'dia ok/atraso'}
                            onChange={(e) => handleAtrasoChange(d.dia, parseInt(e.target.value) || 0)}
                            className={`w-20 text-center font-mono h-7 px-2 text-xs rounded border transition-colors ${
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
                                className="px-1.5 py-0.5 text-[10px] font-mono bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 rounded cursor-pointer"
                                title="+15 minutos"
                              >
                                +15
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAtrasoChange(d.dia, d.atraso + 30)}
                                className="px-1.5 py-0.5 text-[10px] font-mono bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 rounded cursor-pointer"
                                title="+30 minutos"
                              >
                                +30
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* ABS Diário */}
                    <td className="py-2 px-4 text-right border-r border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                      {d.status === 'abono' ? (
                        <div>
                          <span className="text-orange-700 dark:text-orange-300 font-bold block">
                            {((dailyAbs || 0) * 100).toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-sans block">
                            {validAbono}m falt. · {workedMinAbono}m trab.
                          </span>
                        </div>
                      ) : d.status === 'abono_legal' ? (
                        dailyAbs === null ? (
                          <span className="text-cyan-700 dark:text-cyan-300 font-medium text-[11px]">
                            — (BH)
                          </span>
                        ) : (
                          <div>
                            <span className="text-cyan-700 dark:text-cyan-300 font-bold block">
                              0.00%
                            </span>
                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-sans block">
                              {validAbono}m BH · {workedMinAbono}m trab.
                            </span>
                          </div>
                        )
                      ) : d.status === 'banco_horas_integral' ? (
                        <span className="text-indigo-600 dark:text-indigo-300 font-normal" title="Banco de Horas Integral não gera ABS">
                          — (BH)
                        </span>
                      ) : d.status === 'folga_aniversario' ? (
                        <span className="text-emerald-600 dark:text-emerald-300 font-normal" title="Folga Aniversário não gera ABS">
                          — (aniv.)
                        </span>
                      ) : dailyAbs === null ? (
                        <span className="text-slate-400 font-normal" title="Folga não pontua e não distorce o cálculo">
                          — (folga)
                        </span>
                      ) : dailyAbs === 0 ? (
                        <span className="text-[#006772] dark:text-[#2dd4bf] font-semibold">
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
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'dia ok', 0)}
                          className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
                            d.status === 'dia ok'
                              ? 'bg-[#006772] text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-950/60'
                          }`}
                        >
                          OK
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'abono', 0)}
                          title="Abono por declaração médica/universidade (horas faltantes geram ABS)"
                          className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
                            d.status === 'abono'
                              ? 'bg-orange-600 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-950/60'
                          }`}
                        >
                          Decl.
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'abono_legal', 0)}
                          title="Abono Legal — Saída antecipada programada com Banco de Horas (não gera ABS)"
                          className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
                            d.status === 'abono_legal'
                              ? 'bg-cyan-700 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-100 dark:hover:bg-cyan-950/60'
                          }`}
                        >
                          Abono Legal
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'banco_horas_integral', 0)}
                          title="Banco de Horas Integral (não gera ABS)"
                          className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
                            d.status === 'banco_horas_integral'
                              ? 'bg-indigo-700 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60'
                          }`}
                        >
                          BH Int.
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'folga_aniversario', 0)}
                          title="Folga Aniversário (não gera ABS)"
                          className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
                            d.status === 'folga_aniversario'
                              ? 'bg-emerald-700 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                          }`}
                        >
                          Aniv.
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'folga', 0)}
                          className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
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
                          className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
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
                          className={`px-2 py-1 text-[10px] rounded transition-colors cursor-pointer ${
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

        {/* Consolidado Footer (Symmetrical 3-Column Strip) */}
        <div className="bg-[#00383f] text-white border-t border-[#002e33] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="p-5">
            <span className="text-[11px] font-semibold text-teal-200/80 block uppercase tracking-wider">
              Minutos Perdidos no Mês
            </span>
            <div className="font-display text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {operatorStats.minutosPerdidos.toLocaleString('pt-BR')} min
            </div>
            <span className="text-xs text-teal-200/75 mt-0.5 block font-mono">
              Equivalente a {formatMinutesToHours(operatorStats.minutosPerdidos)}
            </span>
          </div>

          <div className="p-5">
            <span className="text-[11px] font-semibold text-teal-200/80 block uppercase tracking-wider">
              Minutos Escalados no Mês
            </span>
            <div className="font-display text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {operatorStats.minutosEscalados.toLocaleString('pt-BR')} min
            </div>
            <span className="text-xs text-teal-200/75 mt-0.5 block">
              {operatorStats.diasTrabalhados + operatorStats.diasFalta + operatorStats.diasAtestado + operatorStats.diasSuspensao} dias ativos · {operatorStats.diasFolga} DSR
              {operatorStats.minutosAbonoLegal > 0 ? ` · −${operatorStats.minutosAbonoLegal}m BH Legal` : ''}
            </span>
          </div>

          <div className="p-5 bg-[#005059]">
            <span className="text-[11px] font-semibold text-teal-100 block uppercase tracking-wider">
              ABS Consolidado do Mês
            </span>
            <div className="font-display text-2xl font-extrabold font-mono tabular-nums text-white mt-1">
              {formatPercent(operatorStats.absMensal)}
            </div>
            <span className="text-xs text-teal-200/85 mt-0.5 block">
              {isOperatorWithinMeta ? 'Dentro da meta (≤ 3.00%)' : 'Acima da meta (> 3.00%)'}
            </span>
          </div>
        </div>

      </section>

    </div>
  );
};
