import React, { useState, useMemo, useEffect } from 'react';
import {
  Operator,
  OperatorMonthlyData,
  DayRecord,
  StatusType
} from '../types/abs';
import {
  STATUS_OPTIONS,
  WEEKDAYS_ABBR
} from '../data/initialData';
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
  Users
} from 'lucide-react';

interface AbsOperatorViewProps {
  operators: Operator[];
  currentOperatorId: string;
  onSelectOperator: (id: string) => void;
  monthlyData: Record<string, OperatorMonthlyData>;
  onUpdateDays: (operatorId: string, dias: DayRecord[]) => void;
  onSave: () => void;
  onResetOperatorMonth: (operatorId: string) => void;
  onApply6x1Schedule: (operatorId: string) => void;
}

export const AbsOperatorView: React.FC<AbsOperatorViewProps> = ({
  operators,
  currentOperatorId,
  onSelectOperator,
  monthlyData,
  onUpdateDays,
  onSave,
  onResetOperatorMonth,
  onApply6x1Schedule
}) => {
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('todos');
  const [searchFilter, setSearchFilter] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Operators filtered by the supervisor filter
  const operatorsBySupervisor = useMemo(() => {
    if (selectedSupervisor === 'todos') return operators;
    return operators.filter(op => op.supervisor.toLowerCase() === selectedSupervisor.toLowerCase());
  }, [operators, selectedSupervisor]);

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
        // If switching from or to another status, adjust delay sensibly
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

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status: StatusType) => {
    switch (status) {
      case 'dia ok':
        return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
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

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-lg animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section: Operator Selection & Supervisor ABS Card (Grid mimicking Sheet Header) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Sheet 2 Header (Cells A1:D4) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Aba 2: Apontamento Dinâmico (ABS OPERADOR)
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                Controle de Apontamentos do Operador
              </h2>
            </div>

            {/* Quick Navigation Between Operators */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {currentFilteredIndex + 1} de {operatorsBySupervisor.length}
                {selectedSupervisor !== 'todos' ? ` (${selectedSupervisor})` : ''}
              </span>
              <button
                onClick={handlePrevOperator}
                title="Operador anterior"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextOperator}
                title="Próximo operador"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filtro por Supervisor - Seleciona supervisor para exibir apenas seus operadores abaixo */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
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
                    ? 'bg-emerald-800 text-white font-bold shadow-2xs'
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
                      ? 'bg-emerald-800 text-white font-bold shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {sup} ({supervisorCounts[sup] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Form fields mimicking cells A1:D4 */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Cell B1: Seleção do Operador (Filtrada por Supervisor) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  B1: Seleção do Operador
                </label>
                {selectedSupervisor !== 'todos' && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                    Equipe de {selectedSupervisor} ({operatorsBySupervisor.length})
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={operator?.id || ''}
                  onChange={(e) => onSelectOperator(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-bold text-sm rounded-lg border border-emerald-300 dark:border-emerald-700/60 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/40 transition-all cursor-pointer truncate"
                >
                  {operatorsBySupervisor.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nome} {selectedSupervisor === 'todos' ? `— ${op.supervisor}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cell B2: Supervisor (VLOOKUP) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                B2: Supervisor (PROCV)
              </label>
              <div className="h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-700 flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                <span className="truncate">{operator.supervisor}</span>
              </div>
            </div>

            {/* Cells B3 & B4: Horários Entrada e Saída */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  B3: Horário Entrada
                </label>
                <div className="h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                  {operator.entrada}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  B4: Horário Saída
                </label>
                <div className="h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                  {operator.saida}
                </div>
              </div>
            </div>

            {/* Cell D3: Jornada Prevista (Minutos) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                D3: Jornada Prevista (Minutos)
              </label>
              <div className="h-10 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-bold font-mono text-xs rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                <span>Padrão WFM Call Center</span>
                <span className="text-sm">{operator.jornadaMin} min (6h20)</span>
              </div>
            </div>

          </div>

          {/* Quick Toolbar for current operator */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onSave();
                  showToast(`Apontamentos de ${operator.nome} salvos na base com sucesso!`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg transition-colors shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Apontamentos</span>
              </button>

              <button
                onClick={() => {
                  onApply6x1Schedule(operator.id);
                  showToast('Escala 6x1 (4 folgas flexíveis em FDS) reaplicada aos 31 dias.');
                }}
                title="Aplica 4 folgas flexíveis em finais de semana (escala 6x1)"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Escala 6x1 (4 Folgas FDS)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (window.confirm(`Deseja limpar todos os apontamentos do mês de ${operator.nome}? Os dias escalados voltarão para 'dia ok' e atrasos para 0.`)) {
                    onResetOperatorMonth(operator.id);
                    showToast('Mês do operador reiniciado.');
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Limpar Mês</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Col: Coluna F (ABS SUPERVISOR - Dynamic Weighted Formula) */}
        <div className="bg-emerald-900 text-white rounded-xl p-5 shadow-sm flex flex-col justify-between border border-emerald-800/80">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-200">
                Coluna F: ABS SUPERVISOR
              </span>
              <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded font-mono">
                SUMIF Ponderado
              </span>
            </div>

            <h3 className="text-base font-bold text-white mt-1">
              {operator.supervisor}
            </h3>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Equipe de {supervisorStats?.totalOperadores || 0} operadores vinculados
            </p>

            <div className="mt-4 pt-4 border-t border-emerald-800/70">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-emerald-100">
                  {formatPercent(supervisorStats?.absPercent || 0)}
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-200">
                  Meta: ≤ 3.00%
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-emerald-300 font-medium">
                  Índice Consolidado da Supervisão
                </span>
                <span className={`text-[10px] font-bold ${
                  (supervisorStats?.absPercent || 0) <= 0.03
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }`}>
                  {(supervisorStats?.absPercent || 0) <= 0.03 ? '✓ Dentro da Meta (≤ 3%)' : '⚠ Acima de 3.00%'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-emerald-800/60 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-950/40 p-2 rounded-lg">
              <span className="text-[10px] text-emerald-300 block uppercase">Min. Perdidos</span>
              <span className="font-bold font-mono tabular-nums text-emerald-100">
                {(supervisorStats?.minutosPerdidos || 0).toLocaleString('pt-BR')} min
              </span>
              <span className="text-[10px] text-emerald-400 block">
                ≈ {formatMinutesToHours(supervisorStats?.minutosPerdidos || 0)}
              </span>
            </div>

            <div className="bg-emerald-950/40 p-2 rounded-lg">
              <span className="text-[10px] text-emerald-300 block uppercase">Min. Escalados</span>
              <span className="font-bold font-mono tabular-nums text-emerald-100">
                {(supervisorStats?.minutosEscalados || 0).toLocaleString('pt-BR')} min
              </span>
              <span className="text-[10px] text-emerald-400 block">
                ≈ {formatMinutesToHours(supervisorStats?.minutosEscalados || 0)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 31-Day Interactive Timesheet Table (matching Sheets B7:C37 and Col D) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        
        {/* Table Title and Quick Legend */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Tabela de Apontamento Mensal (31 Dias)
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Altere status ou minutos de atraso em tempo real
            </span>
          </div>

          {/* Micro legend */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Dia OK (0%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Atraso
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Falta (100%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Folga (Neutro)
            </span>
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-emerald-900 text-white font-bold text-[11px] tracking-wide">
              <tr>
                <th className="py-2.5 px-4 w-24 text-center border-r border-emerald-800">
                  dias (A)
                </th>
                <th className="py-2.5 px-4 w-48 text-center border-r border-emerald-800">
                  status (B)
                </th>
                <th className="py-2.5 px-4 w-44 text-center border-r border-emerald-800">
                  atraso em minutos (C)
                </th>
                <th className="py-2.5 px-4 w-36 text-center border-r border-emerald-800">
                  ABS diario (D)
                </th>
                <th className="py-2.5 px-4 text-center">
                  Ações Rápidas de Linha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {dias.map((d) => {
                const dayOfWeekIdx = (d.dia % 7);
                const weekdayName = WEEKDAYS_ABBR[dayOfWeekIdx];
                // Apenas finais de semana (Sábado e Domingo) em laranja
                const isWeekend = weekdayName === 'Dom' || weekdayName === 'Sáb';
                const dailyAbs = calculateDayAbs(d.status, d.atraso, operator.jornadaMin);

                return (
                  <tr
                    key={d.dia}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                      d.status === 'folga'
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
                              className="px-1 py-0.5 text-[10px] font-mono bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 rounded"
                              title="+15 minutos"
                            >
                              +15
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAtrasoChange(d.dia, d.atraso + 30)}
                              className="px-1 py-0.5 text-[10px] font-mono bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 rounded"
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
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
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
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                            d.status === 'dia ok'
                              ? 'bg-emerald-700 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60'
                          }`}
                        >
                          OK
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetRowQuick(d.dia, 'folga', 0)}
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
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
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
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
                          className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
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
        <div className="bg-emerald-950 text-white p-5 border-t border-emerald-900 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Row 39: Minutos Perdidos */}
          <div className="bg-emerald-900/60 p-3.5 rounded-lg border border-emerald-800/80">
            <span className="text-[11px] font-bold text-emerald-300 block uppercase tracking-wide">
              Linha 39: Minutos Perdidos (Mês)
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {operatorStats.minutosPerdidos.toLocaleString('pt-BR')} min
            </div>
            <span className="text-xs text-emerald-300/80 mt-0.5 block">
              Equivalente a {formatMinutesToHours(operatorStats.minutosPerdidos)}
            </span>
          </div>

          {/* Row 40: Minutos Escalados */}
          <div className="bg-emerald-900/60 p-3.5 rounded-lg border border-emerald-800/80">
            <span className="text-[11px] font-bold text-emerald-300 block uppercase tracking-wide">
              Linha 40: Minutos Escalados (Mês)
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {operatorStats.minutosEscalados.toLocaleString('pt-BR')} min
            </div>
            <span className="text-[11px] text-emerald-300/80 mt-0.5 block font-mono">
              = (COUNTIF(&lt;&gt;folga) - COUNTIF("")) * {operator.jornadaMin}
            </span>
            <span className="text-[11px] text-emerald-400 mt-0.5 block">
              {operatorStats.diasTrabalhados + operatorStats.diasFalta + operatorStats.diasAtestado + operatorStats.diasSuspensao} dias úteis ({operatorStats.diasFolga} folgas flexíveis deduzidas)
            </span>
          </div>

          {/* Row 38: ABS CONSOLIDADO (D39 / D40) */}
          <div className="bg-emerald-800 p-3.5 rounded-lg border border-emerald-600 text-center">
            <span className="text-[11px] font-bold text-emerald-200 block uppercase tracking-wide">
              Linha 38: ABS CONSOLIDADO (Mês)
            </span>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-white mt-1">
              {formatPercent(operatorStats.absMensal)}
            </div>
            <span className="text-[11px] text-emerald-200 mt-0.5 block">
              = Minutos Perdidos / Minutos Escalados
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
