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
}

export const WfmDashboardView: React.FC<WfmDashboardViewProps> = ({
  operators,
  monthlyData,
  onSelectOperatorForAudit,
  selectedMonthKey
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const totalDays = getDaysInMonth(year, month);
  const monthLabel = formatMonthLabel(selectedMonthKey);

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

  // Daily loss curve (sum of lost minutes for day 1..totalDays across entire operation)
  const dailyLossCurve = useMemo(() => {
    const days = Array.from({ length: totalDays }, (_, i) => ({
      dia: i + 1,
      weekday: getWeekdayAbbr(year, month, i + 1),
      isWeekend: isWeekendDate(year, month, i + 1),
      minutosPerdidos: 0,
      ocorrencias: 0
    }));

    operators.forEach(op => {
      const opData = monthlyData[op.id];
      if (opData) {
        opData.dias.forEach(d => {
          if (d.dia >= 1 && d.dia <= totalDays) {
            if (d.status === 'falta' || d.status === 'atestado' || d.status === 'suspensão') {
              days[d.dia - 1].minutosPerdidos += op.jornadaMin;
              days[d.dia - 1].ocorrencias += 1;
            } else if (d.status === 'dia ok/atraso') {
              days[d.dia - 1].minutosPerdidos += Math.max(0, Math.min(op.jornadaMin, d.atraso || 0));
              days[d.dia - 1].ocorrencias += 1;
            } else if (d.status === 'abono') {
              const missingMin = Math.max(0, Math.min(op.jornadaMin, Number(d.abonoMin) || 0));
              if (missingMin > 0) {
                days[d.dia - 1].minutosPerdidos += missingMin;
                days[d.dia - 1].ocorrencias += 1;
              }
            }
          }
        });
      }
    });

    const maxLoss = Math.max(...days.map(d => d.minutosPerdidos), 1);
    return { days, maxLoss };
  }, [operators, monthlyData, totalDays, year, month]);

  // Supervisor sorted ranking
  const sortedSupervisors = useMemo(() => {
    return [...summary.supervisores].sort((a, b) => a.absPercent - b.absPercent);
  }, [summary.supervisores]);

  const targetWfmAbs = 0.03; // 3.00% meta solicitada de ABS WFM
  const isTargetMet = summary.absGeral <= targetWfmAbs;

  return (
    <div className="space-y-6">
      
      {/* Executive Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#006772] dark:text-[#2dd4bf]">
              Painel de Gestão WFM (Workforce Management)
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Consolidação Executiva &amp; Desempenho de Absenteísmo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Indicadores ponderados em minutos para análise de capacidade operacional, turnos e liderança.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs">
              <span className="text-[#006772] dark:text-teal-300 font-medium">Meta WFM: </span>
              <span className="font-bold font-mono text-[#005059] dark:text-teal-100">&le; 3.00%</span>
            </div>
          </div>
        </div>

        {/* 4 Primary KPI Strips */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: ABS Geral */}
          <div className="bg-gradient-to-br from-[#006772] via-[#005059] to-[#00383f] text-white rounded-xl p-4 shadow-sm border border-[#004e57] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wide">
                ABS Geral da Operação
              </span>
              <Activity className="w-4 h-4 text-teal-200" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-extrabold font-mono tabular-nums">
                {formatPercent(summary.absGeral)}
              </div>
              <span className="text-[11px] text-teal-200 block mt-0.5">
                {isTargetMet ? 'Dentro da meta de 3.00%' : 'Acima da tolerância WFM (3.00%)'}
              </span>
            </div>
            <div className="text-[10px] text-teal-300/80 border-t border-white/15 pt-2 font-mono">
              Fórmula: Total Perdido / Total Escalado
            </div>
          </div>

          {/* KPI 2: Minutos Perdidos */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Minutos Perdidos (Mês)
              </span>
              <Clock className="w-4 h-4 text-rose-500" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                {summary.totalMinutosPerdidos.toLocaleString('pt-BR')} min
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
                ≈ {formatMinutesToHours(summary.totalMinutosPerdidos)} de improdutividade
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2 flex items-center justify-between">
              <span>Atrasos: {summary.totalMinutosAtraso} min</span>
              <span>Faltas: {summary.totalFaltas}</span>
            </div>
          </div>

          {/* KPI 3: Minutos Escalados */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Minutos Escalados (Mês)
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                {summary.totalMinutosEscalados.toLocaleString('pt-BR')} min
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
                ≈ {formatMinutesToHours(summary.totalMinutosEscalados)} de escala ativa
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2 font-mono">
              Base: 380 min / operador / dia útil
            </div>
          </div>

          {/* KPI 4: Efetivo Ativo */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Efetivo Total
              </span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                {summary.totalOperadores} Operadores
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 block mt-0.5">
                Distribuídos em 3 equipes
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
              Regime 6x1 CLT (36h semanais)
            </div>
          </div>

        </div>
      </div>

      {/* Second Row: Supervisor Comparison Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Desempenho por Supervisão (Coluna F Dinâmica)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparativo das 3 equipes com ponderação real de minutos escalados e perdidos.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {supervisorsList.length} Supervisores
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedSupervisors.map((sup, idx) => {
            const isBest = idx === 0;
            return (
              <div
                key={sup.supervisor}
                className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      {isBest ? 'Líder de Aderência' : `Ranking #${idx + 1}`}
                    </span>
                    {isBest && (
                      <span className="text-[10px] bg-teal-100 text-[#006772] dark:bg-teal-950/60 dark:text-teal-300 font-bold px-2 py-0.5 rounded">
                        Menor ABS
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {sup.supervisor}
                  </h4>
                  <span className="text-xs text-slate-500 block">
                    {sup.totalOperadores} colaboradores vinculados
                  </span>

                  <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                        ABS da Equipe
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-[#006772] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        Meta: ≤ 3.00%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-[#006772] dark:text-[#2dd4bf] tabular-nums mt-1">
                      {formatPercent(sup.absPercent)}
                    </div>
                    <span className={`text-[10px] font-bold block mt-1 ${
                      sup.absPercent <= targetWfmAbs ? 'text-[#006772] dark:text-[#2dd4bf]' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {sup.absPercent <= targetWfmAbs ? '✓ Dentro da Meta (≤ 3%)' : '⚠ Acima da Meta (> 3%)'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Perdidos</span>
                    <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                      {sup.minutosPerdidos.toLocaleString('pt-BR')} min
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ≈ {formatMinutesToHours(sup.minutosPerdidos)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Escalados</span>
                    <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                      {sup.minutosEscalados.toLocaleString('pt-BR')} min
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ≈ {formatMinutesToHours(sup.minutosEscalados)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Third Row: Daily Loss Chart & Top 5 Outliers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Daily Loss Curve (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Curva Diária de Minutos Perdidos ({monthLabel} · Dias 1 a {totalDays})
              </h3>
              <p className="text-xs text-slate-500">
                Identifique os dias de maior impacto operacional e ausências concentradas.
              </p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          <div className="mt-6 flex items-end justify-between gap-1 h-44 pt-4 px-2">
            {dailyLossCurve.days.map((item) => {
              const heightPercent = Math.max(
                4,
                Math.round((item.minutosPerdidos / dailyLossCurve.maxLoss) * 100)
              );
              const hasLoss = item.minutosPerdidos > 0;

              return (
                <div
                  key={item.dia}
                  className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                >
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded whitespace-nowrap z-30 shadow-md">
                    Dia {item.dia} ({item.weekday}): {item.minutosPerdidos} min ({item.ocorrencias} ocorrências)
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[14px] rounded-t transition-all ${
                      hasLoss
                        ? item.minutosPerdidos > 380
                          ? 'bg-rose-500 hover:bg-rose-600'
                          : 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-teal-200 dark:bg-teal-950/60'
                    }`}
                  />

                  {/* Day label */}
                  <span className={`text-[9px] font-mono ${
                    item.isWeekend ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {item.dia}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-center text-[10px] text-slate-400 font-medium">
            Dias de {monthLabel} (1 a {totalDays}) · Números em laranja indicam Sábado/Domingo
          </div>
        </div>

        {/* Top 5 Critical ABS Outliers (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Top 5 Absenteísmo (Pareto)
                </h3>
                <p className="text-xs text-slate-500">
                  Colaboradores com maior impacto no mês.
                </p>
              </div>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {topAbsOperators.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Nenhum operador com faltas ou atrasos registrados.
                </div>
              ) : (
                topAbsOperators.map((op, idx) => (
                  <div
                    key={op.id}
                    className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded px-1 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate block">
                          {op.nome}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {op.supervisor.split(' ')[0]} · {op.stats.minutosPerdidos} min perdidos
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400 block">
                        {formatPercent(op.stats.absMensal)}
                      </span>
                      <button
                        onClick={() => onSelectOperatorForAudit(op.id)}
                        className="text-[10px] text-[#006772] dark:text-[#2dd4bf] hover:underline font-bold cursor-pointer"
                      >
                        Auditar &rarr;
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span>Faltas: {summary.totalFaltas} d</span>
            <span>Atestados: {summary.totalAtestados} d</span>
            <span>Atrasos: {summary.totalMinutosAtraso} min</span>
            <span>Decl. (ABS): {summary.totalDiasAbono} d ({summary.totalMinutosAbonados}m)</span>
            <span>BH / Aniv.: {summary.totalDiasAbonoLegal + summary.totalBancoHorasIntegral + summary.totalFolgaAniversario} d</span>
          </div>
        </div>

      </div>

    </div>
  );
};
