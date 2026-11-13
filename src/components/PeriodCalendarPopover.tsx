import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CalendarRange,
  Calendar as CalendarIcon,
  Check,
  X,
  RotateCcw,
  MousePointerClick
} from 'lucide-react';
import {
  formatMonthLabel,
  getDaysInMonth,
  getWeekdayIndex,
  isWeekendDate,
  parseMonthKey,
  WEEKDAYS_ABBR_REAL
} from '../utils/calendar';

interface PeriodCalendarPopoverProps {
  selectedMonthKey: string;
  selectedPeriodDays: number[] | null;
  onApplyPeriod: (days: number[] | null) => void;
  externalOpenTrigger?: number;
}

export function formatPeriodSummary(
  selectedPeriodDays: number[] | null,
  monthKey: string
): string {
  const { year, month } = parseMonthKey(monthKey);
  const totalDays = getDaysInMonth(year, month);
  if (!selectedPeriodDays || selectedPeriodDays.length === 0 || selectedPeriodDays.length === totalDays) {
    return 'Mês Inteiro';
  }

  const sorted = [...selectedPeriodDays].sort((a, b) => a - b);
  const mStr = String(month).padStart(2, '0');

  if (sorted.length === 1) {
    return `${String(sorted[0]).padStart(2, '0')}/${mStr} (1 dia)`;
  }

  // Check if contiguous range
  const isContiguous = sorted.every((val, idx) => idx === 0 || val === sorted[idx - 1] + 1);
  if (isContiguous) {
    const start = String(sorted[0]).padStart(2, '0');
    const end = String(sorted[sorted.length - 1]).padStart(2, '0');
    return `${start}/${mStr} a ${end}/${mStr} (${sorted.length}d)`;
  }

  return `${sorted.length} dias selec.`;
}

export const PeriodCalendarPopover: React.FC<PeriodCalendarPopoverProps> = ({
  selectedMonthKey,
  selectedPeriodDays,
  onApplyPeriod,
  externalOpenTrigger = 0
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const totalDays = getDaysInMonth(year, month);
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const firstWeekday = getWeekdayIndex(year, month, 1);

  const [isOpen, setIsOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'range' | 'multiple'>('range');
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [draftDays, setDraftDays] = useState<number[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync draft state when opening or when month changes
  useEffect(() => {
    if (isOpen) {
      if (selectedPeriodDays && selectedPeriodDays.length > 0) {
        setDraftDays([...selectedPeriodDays].sort((a, b) => a - b));
      } else {
        setDraftDays(Array.from({ length: totalDays }, (_, i) => i + 1));
      }
      setRangeStart(null);
    }
  }, [isOpen, selectedPeriodDays, totalDays]);

  useEffect(() => {
    if (externalOpenTrigger > 0) {
      setIsOpen(true);
    }
  }, [externalOpenTrigger]);

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isFiltered =
    selectedPeriodDays !== null &&
    selectedPeriodDays.length > 0 &&
    selectedPeriodDays.length < totalDays;

  const summaryLabel = useMemo(
    () => formatPeriodSummary(selectedPeriodDays, selectedMonthKey),
    [selectedPeriodDays, selectedMonthKey]
  );

  const handleDayClick = (dayNum: number) => {
    if (selectionMode === 'range') {
      if (rangeStart === null) {
        setRangeStart(dayNum);
        setDraftDays([dayNum]);
      } else {
        const minD = Math.min(rangeStart, dayNum);
        const maxD = Math.max(rangeStart, dayNum);
        const range = Array.from({ length: maxD - minD + 1 }, (_, i) => minD + i);
        setDraftDays(range);
        setRangeStart(null);
      }
    } else {
      setRangeStart(null);
      setDraftDays(prev => {
        if (prev.includes(dayNum)) {
          return prev.filter(d => d !== dayNum);
        }
        return [...prev, dayNum].sort((a, b) => a - b);
      });
    }
  };

  const handlePreset = (preset: 'all' | 'q1' | 'q2' | 'last7' | 'weekdays' | 'weekends') => {
    setRangeStart(null);
    const allDays = Array.from({ length: totalDays }, (_, i) => i + 1);
    switch (preset) {
      case 'all':
        setDraftDays(allDays);
        break;
      case 'q1':
        setDraftDays(allDays.filter(d => d <= 15));
        break;
      case 'q2':
        setDraftDays(allDays.filter(d => d >= 16));
        break;
      case 'last7':
        setDraftDays(allDays.filter(d => d > Math.max(0, totalDays - 7)));
        break;
      case 'weekdays':
        setDraftDays(allDays.filter(d => !isWeekendDate(year, month, d)));
        break;
      case 'weekends':
        setDraftDays(allDays.filter(d => isWeekendDate(year, month, d)));
        break;
    }
  };

  const handleApply = () => {
    if (draftDays.length === 0) return;
    if (draftDays.length === totalDays) {
      onApplyPeriod(null);
    } else {
      onApplyPeriod([...draftDays].sort((a, b) => a - b));
    }
    setIsOpen(false);
  };

  const handleResetAll = () => {
    onApplyPeriod(null);
    setIsOpen(false);
  };

  const draftPreviewText = useMemo(() => {
    if (draftDays.length === 0) return 'Nenhum dia selecionado';
    if (draftDays.length === totalDays) return `Mês inteiro selecionado (1 a ${totalDays})`;
    const sorted = [...draftDays].sort((a, b) => a - b);
    const isContiguous = sorted.every((val, idx) => idx === 0 || val === sorted[idx - 1] + 1);
    const mStr = String(month).padStart(2, '0');
    if (isContiguous) {
      return `De ${String(sorted[0]).padStart(2, '0')}/${mStr} até ${String(sorted[sorted.length - 1]).padStart(2, '0')}/${mStr} (${sorted.length} dias)`;
    }
    const listPreview = sorted
      .slice(0, 6)
      .map(d => String(d).padStart(2, '0'))
      .join(', ');
    return `${sorted.length} dia(s): ${listPreview}${sorted.length > 6 ? '...' : ''}`;
  }, [draftDays, totalDays, month]);

  const draftSet = useMemo(() => new Set(draftDays), [draftDays]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        title="Filtrar por período ou dias específicos no calendário"
        className={`h-8 flex items-center gap-1.5 px-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
          isFiltered
            ? 'bg-[#006772] text-white border-[#005059] shadow-xs'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <CalendarRange className={`w-3.5 h-3.5 ${isFiltered ? 'text-[#2dd4bf]' : 'text-[#006772] dark:text-[#2dd4bf]'}`} />
        <span className="hidden sm:inline opacity-80 font-semibold">Período:</span>
        <span className="font-mono">{summaryLabel}</span>
      </button>

      {isFiltered && (
        <button
          type="button"
          onClick={handleResetAll}
          title="Limpar filtro de período (voltar ao mês inteiro)"
          className="h-8 px-2 flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer"
        >
          <X className="w-3 h-3" />
          <span className="hidden md:inline">Limpar</span>
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 top-10 z-50 w-[330px] sm:w-[360px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf]" />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Filtrar por Período
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {monthLabel} ({totalDays} dias)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selection Mode Switcher */}
          <div className="mt-3 flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => {
                setSelectionMode('range');
                setRangeStart(null);
              }}
              className={`flex-1 py-1 px-2 rounded-md font-semibold transition-colors cursor-pointer ${
                selectionMode === 'range'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Intervalo (De → Até)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectionMode('multiple');
                setRangeStart(null);
              }}
              className={`flex-1 py-1 px-2 rounded-md font-semibold transition-colors cursor-pointer ${
                selectionMode === 'multiple'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Dias Específicos
            </button>
          </div>

          <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MousePointerClick className="w-3 h-3 text-[#006772] dark:text-[#2dd4bf] shrink-0" />
            <span>
              {selectionMode === 'range'
                ? rangeStart === null
                  ? 'Clique no dia inicial e depois no dia final do período.'
                  : `Início no dia ${String(rangeStart).padStart(2, '0')}. Agora clique no dia final.`
                : 'Clique nos dias individuais que deseja incluir ou remover.'}
            </span>
          </p>

          {/* Quick Presets */}
          <div className="mt-2.5 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => handlePreset('all')}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Mês Inteiro
            </button>
            <button
              type="button"
              onClick={() => handlePreset('q1')}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              1ª Quinzena (1–15)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('q2')}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              2ª Quinzena (16–{totalDays})
            </button>
            <button
              type="button"
              onClick={() => handlePreset('last7')}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Últimos 7d
            </button>
            <button
              type="button"
              onClick={() => handlePreset('weekdays')}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Seg–Sex
            </button>
            <button
              type="button"
              onClick={() => handlePreset('weekends')}
              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer"
            >
              FDS
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="mt-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS_ABBR_REAL.map((wd, idx) => (
                <div
                  key={wd}
                  className={`text-center text-[10px] font-bold py-0.5 ${
                    idx === 0 || idx === 6
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }, (_, idx) => (
                <div key={`empty-${idx}`} className="h-8" />
              ))}

              {Array.from({ length: totalDays }, (_, i) => i + 1).map(dayNum => {
                const isSelected = draftSet.has(dayNum);
                const isRangeAnchor = rangeStart === dayNum;
                const isWeekend = isWeekendDate(year, month, dayNum);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleDayClick(dayNum)}
                    className={`h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center border ${
                      isRangeAnchor
                        ? 'bg-[#d89627] text-white border-[#b37718] ring-2 ring-[#d89627]/40'
                        : isSelected
                        ? 'bg-[#006772] text-white border-[#005059] shadow-2xs'
                        : isWeekend
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/50 hover:bg-amber-100'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selection Preview */}
          <div className="mt-3 px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200">
            {draftPreviewText}
          </div>

          {/* Footer Actions */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Mês Inteiro</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={draftDays.length === 0}
                onClick={handleApply}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-[#006772] hover:bg-[#005059] disabled:opacity-40 rounded-lg shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar Período</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
