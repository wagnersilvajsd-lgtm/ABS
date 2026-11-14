import React, { useMemo, useState } from 'react';
import { MonthlyAbsPoint } from '../utils/history';
import { formatMinutesToHours, formatPercent } from '../utils/calculations';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface AbsTrendChartProps {
  title: string;
  subtitle: string;
  points3M: MonthlyAbsPoint[];
  points6M: MonthlyAbsPoint[];
  metaAbs?: number;
  selectedMonthKey: string;
  onSelectMonthKey?: (monthKey: string) => void;
  headerRight?: React.ReactNode;
}

export const AbsTrendChart: React.FC<AbsTrendChartProps> = ({
  title,
  subtitle,
  points3M,
  points6M,
  metaAbs = 0.03,
  selectedMonthKey,
  onSelectMonthKey,
  headerRight
}) => {
  const [range, setRange] = useState<'3m' | '6m'>('6m');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const points = range === '3m' ? points3M : points6M;

  const { maxAbs, deltaPp, deltaStatus } = useMemo(() => {
    const highest = Math.max(metaAbs * 1.6, ...points.map((p) => p.absPercent), 0.04);
    const current = points[points.length - 1];
    const previous = points.length >= 2 ? points[points.length - 2] : null;

    if (!current || !previous || !previous.hasSavedData) {
      return { maxAbs: highest, deltaPp: null as number | null, deltaStatus: 'neutral' as const };
    }

    const diff = (current.absPercent - previous.absPercent) * 100;
    return {
      maxAbs: highest,
      deltaPp: diff,
      deltaStatus: Math.abs(diff) < 0.01 ? ('neutral' as const) : diff < 0 ? ('improved' as const) : ('worsened' as const)
    };
  }, [points, metaAbs]);

  const metaLineBottomPct = Math.min(92, Math.max(8, (metaAbs / maxAbs) * 100));

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {headerRight}

          {deltaPp !== null && (
            <div
              className={`h-8 px-2.5 rounded-lg border text-xs font-mono tabular-nums font-semibold flex items-center gap-1 ${
                deltaStatus === 'improved'
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-[#006772] dark:text-[#2dd4bf] border-teal-200 dark:border-teal-800'
                  : deltaStatus === 'worsened'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {deltaStatus === 'improved' ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : deltaStatus === 'worsened' ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              <span>
                {deltaPp > 0 ? '+' : ''}
                {deltaPp.toFixed(2)} p.p. vs mês ant.
              </span>
            </div>
          )}

          {/* 3M / 6M Segmented Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setRange('3m')}
              className={`h-7 px-3 rounded-md font-semibold transition-colors cursor-pointer ${
                range === '3m'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              3 Meses
            </button>
            <button
              type="button"
              onClick={() => setRange('6m')}
              className={`h-7 px-3 rounded-md font-semibold transition-colors cursor-pointer ${
                range === '6m'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              6 Meses
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="mt-6 relative h-52 pt-6 px-2">
        {/* Horizontal Meta Benchmark Line */}
        <div
          style={{ bottom: `calc(${metaLineBottomPct}% * 0.72 + 2.25rem)` }}
          className="absolute left-0 right-0 border-t border-dashed border-[#d89627]/80 pointer-events-none z-10 flex justify-end"
        >
          <span className="-mt-5 text-[10px] font-mono tabular-nums font-bold text-[#b87b18] dark:text-[#f0ad35] bg-white/90 dark:bg-slate-900/90 px-1.5 rounded">
            Meta {(metaAbs * 100).toFixed(1)}%
          </span>
        </div>

        <div className="h-full flex items-end justify-between gap-3">
          {points.map((pt, idx) => {
            const barHeightPct = pt.hasSavedData
              ? Math.max(6, Math.min(100, Math.round((pt.absPercent / maxAbs) * 100)))
              : 6;
            const isAboveMeta = pt.absPercent > metaAbs;
            const isActiveMonth = pt.monthKey === selectedMonthKey;
            const isHovered = hoveredIdx === idx;

            return (
              <button
                key={pt.monthKey}
                type="button"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectMonthKey && onSelectMonthKey(pt.monthKey)}
                disabled={!onSelectMonthKey}
                title={`${pt.fullLabel}: ${formatPercent(pt.absPercent)}`}
                className={`flex-1 h-full flex flex-col items-center justify-end gap-1.5 relative group ${
                  onSelectMonthKey ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-1 z-30 bg-slate-900 text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                    <div className="font-bold text-teal-300">{pt.fullLabel}</div>
                    {pt.hasSavedData ? (
                      <>
                        <div>ABS: {formatPercent(pt.absPercent)}</div>
                        <div>
                          Perd: {pt.minutosPerdidos.toLocaleString('pt-BR')}m (
                          {formatMinutesToHours(pt.minutosPerdidos)})
                        </div>
                        <div>Ocorrências: {pt.ocorrencias}</div>
                      </>
                    ) : (
                      <div className="text-slate-300">Sem apontamentos registrados neste mês</div>
                    )}
                  </div>
                )}

                {/* Value label above bar */}
                <span
                  className={`text-[11px] font-mono tabular-nums font-bold ${
                    !pt.hasSavedData
                      ? 'text-slate-400 dark:text-slate-500 font-normal'
                      : isAboveMeta
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-[#006772] dark:text-[#2dd4bf]'
                  }`}
                >
                  {pt.hasSavedData ? formatPercent(pt.absPercent) : '—'}
                </span>

                {/* Vertical Bar Track */}
                <div className="w-full max-w-[54px] h-[72%] flex items-end justify-center">
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full rounded-t-lg transition-colors animate-bar-up ${
                      !pt.hasSavedData
                        ? 'bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700'
                        : isAboveMeta
                        ? 'bg-rose-500 hover:bg-rose-600'
                        : isActiveMonth
                        ? 'bg-[#005059] dark:bg-[#2dd4bf]'
                        : 'bg-[#006772]/80 hover:bg-[#006772] dark:bg-[#2dd4bf]/75 dark:hover:bg-[#2dd4bf]'
                    }`}
                  />
                </div>

                {/* Month Label */}
                <span
                  className={`text-[11px] font-mono tabular-nums whitespace-nowrap ${
                    isActiveMonth
                      ? 'font-bold text-[#006772] dark:text-[#2dd4bf] underline underline-offset-4'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {pt.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          Meses com traço ("—") ainda não possuem apontamentos abertos no calendário.
        </span>
        {onSelectMonthKey && (
          <span>Clique em qualquer mês no gráfico para abrir aquela competência.</span>
        )}
      </div>
    </section>
  );
};
