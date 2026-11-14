import React from 'react';
import { Operation } from '../types/abs';
import {
  RotateCcw,
  Download,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BellRing,
  UserCheck,
  LayoutGrid
} from 'lucide-react';
import {
  AVAILABLE_YEARS,
  MONTH_NAMES_PT,
  formatMonthKey,
  getDefaultMonthKey,
  getMonthWeekends,
  getNextMonthKey,
  getPrevMonthKey,
  parseMonthKey
} from '../utils/calendar';
import { PeriodCalendarPopover } from './PeriodCalendarPopover';

interface NavbarProps {
  activeTab: 'operacoes' | 'abs-operador' | 'operadores' | 'base-apontamentos' | 'painel-wfm';
  setActiveTab: (tab: 'operacoes' | 'abs-operador' | 'operadores' | 'base-apontamentos' | 'painel-wfm') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onResetDefaults: () => void;
  onOpenExportImport: () => void;
  absGeral: number;
  activeOperationName?: string;
  operations?: Operation[];
  selectedOperationId?: string;
  onSelectOperation?: (id: string) => void;
  selectedMonthKey: string;
  onSelectMonthKey: (monthKey: string) => void;
  selectedPeriodDays?: number[] | null;
  onApplyPeriod?: (days: number[] | null) => void;
  periodOpenTrigger?: number;
  supervisorsList?: string[];
  activeSupervisorView?: string;
  onChangeSupervisorView?: (sup: string) => void;
  pendingTransfersCount?: number;
  onOpenTransferInbox?: () => void;
  onGoHome?: () => void;
}

const NAV_ITEMS: Array<{
  id: NavbarProps['activeTab'];
  label: string;
}> = [
  { id: 'operacoes', label: 'Operações' },
  { id: 'abs-operador', label: 'ABS Operador' },
  { id: 'operadores', label: 'Operadores' },
  { id: 'base-apontamentos', label: 'Base Matriz' },
  { id: 'painel-wfm', label: 'Painel WFM' }
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onResetDefaults,
  onOpenExportImport,
  absGeral,
  activeOperationName = 'Operação CAERN',
  operations,
  selectedOperationId,
  onSelectOperation,
  selectedMonthKey,
  onSelectMonthKey,
  selectedPeriodDays = null,
  onApplyPeriod,
  periodOpenTrigger = 0,
  supervisorsList = [],
  activeSupervisorView = 'gestor',
  onChangeSupervisorView,
  pendingTransfersCount = 0,
  onOpenTransferInbox,
  onGoHome
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const { totalDays, saturdays, sundays, completeWeekendsCount } = getMonthWeekends(year, month);
  const prevMonthKey = getPrevMonthKey(selectedMonthKey);
  const nextMonthKey = getNextMonthKey(selectedMonthKey);
  const defaultMonthKey = getDefaultMonthKey();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Primary Top Bar: Strictly 3 Symmetrical Zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Clean Single-Line Brand Wordmark */}
          <button
            type="button"
            onClick={() => (onGoHome ? onGoHome() : setActiveTab('operacoes'))}
            title="Voltar para a tela inicial de seleção de operações"
            className="flex items-center gap-2.5 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#006772] rounded-lg"
          >
            <img
              src="/assets/aistudio/image_def6497f.png"
              alt="JSD Telecom"
              className="w-8 h-8 object-contain rounded-lg bg-white p-0.5 border border-slate-200 dark:border-slate-700"
            />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
              JSD Telecom
            </span>
          </button>

          {/* Zone 2: Clean Typographic Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 h-full">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative h-full flex items-center text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'border-[#006772] dark:border-[#2dd4bf] text-[#006772] dark:text-[#2dd4bf]'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action + Compact Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onResetDefaults}
              title="Restaurar dados padrão"
              className="h-9 px-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Restaurar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              aria-label="Alternar tema"
              className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg btn-press shrink-0 cursor-pointer"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenExportImport}
              className="h-9 px-4 flex items-center gap-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg btn-press whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Dados</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-100 dark:border-slate-800">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#006772] text-white'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Symmetrical Workspace Control Strip */}
      <div className="bg-slate-50/90 dark:bg-slate-950/70 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Left Side: Competência + Período */}
          <div
            className="flex items-center gap-2 flex-wrap"
            title={`${totalDays} dias${month === 2 && totalDays === 29 ? ' (bissexto)' : ''} · ${saturdays.length} sáb / ${sundays.length} dom (${completeWeekendsCount} FDS)`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <CalendarDays className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf]" />
              <span className="hidden sm:inline whitespace-nowrap">Mês:</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!prevMonthKey}
                onClick={() => prevMonthKey && onSelectMonthKey(prevMonthKey)}
                title="Mês anterior"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <select
                value={month}
                onChange={(e) => onSelectMonthKey(formatMonthKey(year, parseInt(e.target.value, 10)))}
                aria-label="Selecionar mês"
                className="h-8 px-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 cursor-pointer"
              >
                {MONTH_NAMES_PT.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => onSelectMonthKey(formatMonthKey(parseInt(e.target.value, 10), month))}
                aria-label="Selecionar ano"
                className="h-8 px-2 text-xs font-semibold font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[#006772] dark:text-[#2dd4bf] focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 cursor-pointer"
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!nextMonthKey}
                onClick={() => nextMonthKey && onSelectMonthKey(nextMonthKey)}
                title="Próximo mês"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {selectedMonthKey !== defaultMonthKey && (
                <button
                  type="button"
                  onClick={() => onSelectMonthKey(defaultMonthKey)}
                  className="h-8 px-2 text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-100 cursor-pointer whitespace-nowrap"
                >
                  Hoje
                </button>
              )}
            </div>

            {onApplyPeriod && (
              <div className="sm:pl-2 sm:border-l border-slate-200 dark:border-slate-800">
                <PeriodCalendarPopover
                  selectedMonthKey={selectedMonthKey}
                  selectedPeriodDays={selectedPeriodDays}
                  onApplyPeriod={onApplyPeriod}
                  externalOpenTrigger={periodOpenTrigger}
                />
              </div>
            )}
          </div>

          {/* Right Side: Portal Home + Quick Operation Switcher + Visão + Transferências */}
          <div className="flex items-center gap-2 flex-wrap">
            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                title="Voltar ao Portal de Operações"
                className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Portal</span>
              </button>
            )}

            {operations && operations.length > 0 && onSelectOperation && selectedOperationId ? (
              <div className="flex items-center gap-2 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5">
                <select
                  value={selectedOperationId}
                  onChange={(e) => onSelectOperation(e.target.value)}
                  aria-label="Trocar operação ativa"
                  className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer max-w-[140px] truncate"
                >
                  {operations.map(op => (
                    <option key={op.id} value={op.id}>
                      {op.nome}
                    </option>
                  ))}
                </select>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">|</span>
                <span className="font-mono text-xs font-bold tabular-nums text-[#006772] dark:text-[#2dd4bf] whitespace-nowrap">
                  {(absGeral * 100).toFixed(2)}%
                </span>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pr-2 border-r border-slate-200 dark:border-slate-800">
                <span className="font-medium truncate max-w-[150px]">{activeOperationName}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="font-mono font-bold tabular-nums text-[#006772] dark:text-[#2dd4bf]">
                  ABS {(absGeral * 100).toFixed(2)}%
                </span>
              </div>
            )}

            {onChangeSupervisorView && (
              <div className="flex items-center gap-1.5 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5">
                <UserCheck className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf] shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Visão:
                </span>
                <select
                  value={activeSupervisorView}
                  onChange={(e) => onChangeSupervisorView(e.target.value)}
                  aria-label="Selecionar visão de supervisor"
                  className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer max-w-[165px] truncate"
                >
                  <option value="gestor">Gestor Geral WFM</option>
                  {supervisorsList.map(sup => (
                    <option key={sup} value={sup}>
                      Sup: {sup}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onOpenTransferInbox && (
              <button
                type="button"
                onClick={onOpenTransferInbox}
                title={
                  pendingTransfersCount > 0
                    ? `${pendingTransfersCount} transferência(s) pendente(s) para análise`
                    : 'Caixa de transferências entre supervisores'
                }
                className={`h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  pendingTransfersCount > 0
                    ? 'bg-[#d89627] text-white border-[#b87b18]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BellRing className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Transferências</span>
                <span className="font-mono tabular-nums font-bold">
                  ({pendingTransfersCount})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
