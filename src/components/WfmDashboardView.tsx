import React, { useMemo } from 'react';
import { Operator, OperatorMonthlyData } from '../types/abs';
import { formatMonthLabel, getDaysInMonth, getWeekdayAbbr, isWeekendDate, parseMonthKey } from '../utils/calendar';
import {
  calculateOperationSummary,
  calculateOperatorStats,
  formatMinutesToHours,
  formatPercent
} from '../utils/calculations';
import {
  TrendingDown,
  Clock,
  Users,
  Award,
  AlertCircle,
  FileText,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface WfmDashboardViewProps {
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  onSelectOperatorForAudit: (operatorId: string) => void;
  selectedMonthKey: string;
  selectedPeriodDays?: number[] | null;
}

export const WfmDashboardView: React.FC<WfmDashboardViewProps> = ({
  operators,
  monthlyData,
  onSelectOperatorForAudit,
  selectedMonthKey,
  selectedPeriodDays = null
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const totalDays = getDaysInMonth(year, month);
  const monthLabel = formatMonthLabel(selectedMonthKey);

  const displayedDayNumbers = useMemo(() => {
    if (selectedPeriodDays && selectedPeriodDays.length > 0) {
      return selectedPeriodDays.filter(d => d >= 1 && d <= totalDays);
    }
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [selectedPeriodDays, totalDays]);

  const supervisorsList = useMemo(() => {
    const set = new Set<string>();
    operators.forEach(op => {
      if (op.supervisor) set.add(op.supervisor);
    });
    return Array.from(set);
  }, [operators]);

  // Global calculation summary
  const summary = useMemo(() => {
    return calculateOperationSummary(operators, monthlyData, supervisorsList);
  }, [operators, monthlyData, supervisorsList]);

  // Operator ranking (Top 5 highest ABS)
  const topAbsOperators = useMemo(() => {
    const list = operators.map(op => {
      const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
      const stats = calculateOperatorStats(data.dias, op.jornadaMin);
      return {
        ...op,
        stats
      };
    });
    return list
      .filter(o => o.stats.minutosPerdidos > 0)
      .sort((a, b) => b.stats.absMensal - a.stats.absMensal)
      .slice(0, 5);
  }, [operators, monthlyData]);

  // Daily loss curve (sum of lost minutes across displayedDayNumbers)
  const dailyLossCurve = useMemo(() => {
    const dayIndexMap = new Map<number, number>();
    const days = displayedDayNumbers.map((diaNum, idx) => {
      dayIndexMap.set(diaNum, idx);
      return {
        dia: diaNum,
        weekday: getWeekdayAbbr(year, month, diaNum),
        isWeekend: isWeekendDate(year, month, diaNum),
        minutosPerdidos: 0,
        ocorrencias: 0
      };
    });

    operators.forEach(op => {
      const opData = monthlyData[op.id];
      if (opData) {
        opData.dias.forEach(d => {
          const targetIdx = dayIndexMap.get(d.dia);
          if (targetIdx !== undefined) {
            if (d.status === 'falta' || d.status === 'atestado' || d.status === 'suspensão') {
              days[targetIdx].minutosPerdidos += op.jornadaMin;
              days[targetIdx].ocorrencias += 1;
            } else if (d.status === 'dia ok/atraso') {
              days[targetIdx].minutosPerdidos += Math.max(0, Math.min(op.jornadaMin, d.atraso || 0));
              days[targetIdx].ocorrencias += 1;
            } else if (d.status === 'abono') {
              const missingMin = Math.max(0, Math.min(op.jornadaMin, Number(d.abonoMin) || 0));
              if (missingMin > 0) {
                days[targetIdx].minutosPerdidos += missingMin;
                days[targetIdx].ocorrencias += 1;
              }
            }
          }
        });
      }
    });

    const maxLoss = Math.max(...days.map(d => d.minutosPerdidos), 1);
    return { days, maxLoss };
  }, [operators, monthlyData, displayedDayNumbers, year, month]);

  // Supervisor sorted ranking
  const sortedSupervisors = useMemo(() => {
    return [...summary.supervisores].sort((a, b) => a.absPercent - b.absPercent);
  }, [summary.supervisores]);

  const targetWfmAbs = 0.03; // 3.00% meta solicitada de ABS WFM
  const isTargetMet = summary.absGeral <= targetWfmAbs;

  return (
    <div className="space-y-6">

      {/* Executive Summary Header + Symmetrical 4-Column KPI Strip */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Painel Executivo WFM
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Consolidado ponderado em minutos ({monthLabel}) · Capacidade operacional, lideranças e desvios críticos
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-slate-500 dark:text-slate-400">Meta operacional:</span>
            <span className="font-mono tabular-nums font-bold text-[#006772] dark:text-[#2dd4bf]">
              ABS &le; 3.00%
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* KPI 1: ABS Geral */}
          <div className="h-full bg-[#005059] text-white rounded-xl p-5 border border-[#003e45] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-teal-100">
                ABS Geral
              </span>
              <Activity className="w-4 h-4 text-teal-200 shrink-0" />
            </div>
            <div className="my-4">
              <div className="text-3xl font-bold font-mono tabular-nums">
                {formatPercent(summary.absGeral)}
              </div>
              <p className={`text-xs mt-1 ${isTargetMet ? 'text-teal-200' : 'text-amber-300'}`}>
                {isTargetMet ? 'Dentro da meta de 3.00%' : 'Acima da meta de 3.00%'}
              </p>
            </div>
            <div className="text-xs text-teal-200/90 border-t border-white/15 pt-3 font-mono tabular-nums">
              Perdido / Escalado
            </div>
          </div>

          {/* KPI 2: Minutos Perdidos */}
          <div className="h-full bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Minutos Perdidos
              </span>
              <Clock className="w-4 h-4 text-rose-500 shrink-0" />
            </div>
            <div className="my-4">
              <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                {summary.totalMinutosPerdidos.toLocaleString('pt-BR')} min
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                ≈ {formatMinutesToHours(summary.totalMinutosPerdidos)} de ausência
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-700/80 pt-3 flex items-center justify-between font-mono tabular-nums">
              <span>Atrasos: {summary.totalMinutosAtraso}m</span>
              <span>Faltas: {summary.totalFaltas}</span>
            </div>
          </div>

          {/* KPI 3: Minutos Escalados */}
          <div className="h-full bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Minutos Escalados
              </span>
              <ShieldCheck className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf] shrink-0" />
            </div>
            <div className="my-4">
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {summary.totalMinutosEscalados.toLocaleString('pt-BR')} min
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                ≈ {formatMinutesToHours(summary.totalMinutosEscalados)} de carga ativa
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-700/80 pt-3 font-mono tabular-nums">
              Base: 380 min/dia útil
            </div>
          </div>

          {/* KPI 4: Efetivo Total */}
          <div className="h-full bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Efetivo Total
              </span>
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <div className="my-4">
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {summary.totalOperadores} operadores
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Em {supervisorsList.length} equipe(s) de supervisão
              </p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-700/80 pt-3">
              Regime 6x1 CLT (36h semanais)
            </div>
          </div>
        </div>
      </section>

      {/* Supervisor Comparison Grid */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Desempenho por Supervisão
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparativo ordenado do menor para o maior índice de absenteísmo
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {supervisorsList.length} supervisão(ões)
          </span>
        </div>

        {sortedSupervisors.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhum supervisor ou colaborador cadastrado nesta operação ainda. Cadastre equipes na aba <strong>Operações</strong> para visualizar os indicadores por supervisão.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {sortedSupervisors.map((sup, idx) => {
            const isBest = idx === 0;
            const withinMeta = sup.absPercent <= targetWfmAbs;
            const barPct = Math.min(100, (sup.absPercent / (targetWfmAbs * 2)) * 100);
            return (
              <div
                key={sup.supervisor}
                className="h-full bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover-lift"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      #{idx + 1} · {sup.totalOperadores} colaboradores
                    </span>
                    {isBest && (
                      <span className="font-semibold text-[#006772] dark:text-[#2dd4bf]">
                        Menor ABS
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5 truncate">
                    {sup.supervisor}
                  </h3>

                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {formatPercent(sup.absPercent)}
                    </span>
                    <span className={`text-xs font-semibold ${
                      withinMeta ? 'text-[#006772] dark:text-[#2dd4bf]' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {withinMeta ? 'Dentro da meta' : 'Acima da meta'}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${barPct}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        withinMeta ? 'bg-[#006772] dark:bg-[#2dd4bf]' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Min. Perdidos</span>
                    <span className="font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                      {sup.minutosPerdidos.toLocaleString('pt-BR')} min
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums block">
                      ≈ {formatMinutesToHours(sup.minutosPerdidos)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 dark:text-slate-400 block">Min. Escalados</span>
                    <span className="font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {sup.minutosEscalados.toLocaleString('pt-BR')} min
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums block">
                      ≈ {formatMinutesToHours(sup.minutosEscalados)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </section>

      {/* Third Row: Balanced Daily Loss Curve (2 Cols) + Top 5 Outliers (1 Col) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Daily Loss Curve */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Curva Diária de Minutos Perdidos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {monthLabel} · {displayedDayNumbers.length < totalDays ? `${displayedDayNumbers.length} dias selecionados` : `Dias 1 a ${totalDays}`} · Passe o cursor para detalhes
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-rose-500" /> &gt; 380m</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> ≤ 380m</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-teal-300 dark:bg-teal-900" /> 0m</span>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-1 h-48 pt-6 px-1">
            {dailyLossCurve.days.map((item) => {
              const heightPercent = Math.max(
                4,
                Math.round((item.minutosPerdidos / dailyLossCurve.maxLoss) * 100)
              );
              const hasLoss = item.minutosPerdidos > 0;

              return (
                <div
                  key={item.dia}
                  className="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end"
                >
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded whitespace-nowrap z-30 shadow-md transition-opacity">
                    Dia {item.dia} ({item.weekday}): {item.minutosPerdidos} min ({item.ocorrencias} ocorr.)
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[14px] rounded-t transition-colors animate-bar-up ${
                      hasLoss
                        ? item.minutosPerdidos > 380
                          ? 'bg-rose-500 hover:bg-rose-600'
                          : 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-teal-200 dark:bg-teal-900/60'
                    }`}
                  />

                  <span className={`text-[9px] font-mono tabular-nums ${
                    item.isWeekend ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {item.dia}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Números em laranja indicam Sábado e Domingo</span>
            <span className="font-mono tabular-nums">Pico diário: {dailyLossCurve.maxLoss > 1 ? `${dailyLossCurve.maxLoss} min` : '0 min'}</span>
          </div>
        </div>

        {/* Top 5 Critical ABS Outliers */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Top 5 Maior Impacto
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Colaboradores com maior ABS no recorte
                </p>
              </div>
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {topAbsOperators.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Nenhum operador com faltas ou atrasos registrados neste período.
                </div>
              ) : (
                topAbsOperators.map((op, idx) => (
                  <div
                    key={op.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono tabular-nums text-slate-400 w-5 shrink-0">
                          0{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate block">
                          {op.nome}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block pl-7 font-mono tabular-nums">
                        {op.supervisor.split(' ')[0]} · {op.stats.minutosPerdidos} min perdidos
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 block">
                        {formatPercent(op.stats.absMensal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectOperatorForAudit(op.id)}
                        className="text-[11px] text-[#006772] dark:text-[#2dd4bf] hover:underline font-semibold cursor-pointer"
                      >
                        Auditar →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-wrap gap-2 font-mono tabular-nums">
            <span>Faltas: {summary.totalFaltas}d</span>
            <span>Atest.: {summary.totalAtestados}d</span>
            <span>Decl. ABS: {summary.totalDiasAbono}d</span>
            <span>BH/Aniv.: {summary.totalDiasAbonoLegal + summary.totalBancoHorasIntegral + summary.totalFolgaAniversario}d</span>
          </div>
        </div>
      </section>

    </div>
  );
};
