import React from 'react';
import {
  Calendar,
  Users,
  Table,
  BarChart3,
  RotateCcw,
  Download,
  Moon,
  Sun,
  Building2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  BellRing,
  UserCheck
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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onResetDefaults,
  onOpenExportImport,
  absGeral,
  activeOperationName = 'Operação CAERN',
  selectedMonthKey,
  onSelectMonthKey,
  selectedPeriodDays = null,
  onApplyPeriod,
  periodOpenTrigger = 0,
  supervisorsList = [],
  activeSupervisorView = 'gestor',
  onChangeSupervisorView,
  pendingTransfersCount = 0,
  onOpenTransferInbox
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const { totalDays, saturdays, sundays, completeWeekendsCount } = getMonthWeekends(year, month);
  const prevMonthKey = getPrevMonthKey(selectedMonthKey);
  const nextMonthKey = getNextMonthKey(selectedMonthKey);
  const defaultMonthKey = getDefaultMonthKey();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Wordmark with JSD Telecom Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/assets/aistudio/image_def6497f.png"
              alt="JSD Telecom"
              className="w-10 h-10 object-contain rounded-xl bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-sm"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-[#006772] dark:text-[#2dd4bf] tracking-tight whitespace-nowrap">
                  JSD Telecom
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-[#d89627] dark:text-[#f0ad35] border border-amber-300 dark:border-amber-700 font-mono">
                  WFM
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                <span>Controle de ABS</span>
                <span>·</span>
                <span className="text-[#006772] dark:text-[#2dd4bf] font-bold">
                  {activeOperationName}
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Zone 2) */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
            <button
              onClick={() => setActiveTab('operacoes')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'operacoes'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#d89627]" />
              <span>Operações</span>
            </button>

            <button
              onClick={() => setActiveTab('abs-operador')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'abs-operador'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>ABS Operador ({totalDays}d)</span>
            </button>

            <button
              onClick={() => setActiveTab('operadores')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'operadores'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Operadores</span>
            </button>

            <button
              onClick={() => setActiveTab('base-apontamentos')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'base-apontamentos'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Base Apontamentos</span>
            </button>

            <button
              onClick={() => setActiveTab('painel-wfm')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'painel-wfm'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Painel WFM</span>
            </button>
          </nav>

          {/* Quick Metrics & Actions (Zone 3) */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Quick ABS Badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/40">
              <span className="text-[11px] font-medium text-teal-900 dark:text-teal-300">
                ABS {activeOperationName.split(' ')[1] || 'Operação'}:
              </span>
              <span className="text-xs font-bold font-mono tabular-nums text-[#006772] dark:text-[#2dd4bf]">
                {(absGeral * 100).toFixed(2)}%
              </span>
            </div>

            {/* Export / Import Button */}
            <button
              onClick={onOpenExportImport}
              title="Exportar ou Importar dados (CSV/Planilha)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exportar / Planilha</span>
            </button>

            {/* Reset Defaults Button */}
            <button
              onClick={onResetDefaults}
              title="Restaurar estrutura e dados padrão dos 44 operadores da CAERN"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Restaurar</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => setActiveTab('operacoes')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'operacoes'
                ? 'bg-[#006772] text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Operações
          </button>
          <button
            onClick={() => setActiveTab('abs-operador')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'abs-operador'
                ? 'bg-[#006772] text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            ABS ({totalDays}d)
          </button>
          <button
            onClick={() => setActiveTab('operadores')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'operadores'
                ? 'bg-[#006772] text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Operadores
          </button>
          <button
            onClick={() => setActiveTab('base-apontamentos')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'base-apontamentos'
                ? 'bg-[#006772] text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Base Matriz
          </button>
          <button
            onClick={() => setActiveTab('painel-wfm')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'painel-wfm'
                ? 'bg-[#006772] text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Painel WFM
          </button>
        </div>

      </div>

      {/* Persistent Global Calendar Bar (2025 - 2030) */}
      <div className="bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#006772] dark:text-[#2dd4bf]">
              <CalendarDays className="w-4 h-4 text-[#d89627]" />
              <span className="uppercase tracking-wider text-[11px]">Competência:</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!prevMonthKey}
                onClick={() => prevMonthKey && onSelectMonthKey(prevMonthKey)}
                title="Mês anterior"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <select
                value={month}
                onChange={(e) => onSelectMonthKey(formatMonthKey(year, parseInt(e.target.value, 10)))}
                aria-label="Selecionar mês"
                className="h-8 px-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 cursor-pointer"
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
                className="h-8 px-2.5 text-xs font-bold font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[#006772] dark:text-[#2dd4bf] focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 cursor-pointer"
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
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {selectedMonthKey !== defaultMonthKey && (
                <button
                  type="button"
                  onClick={() => onSelectMonthKey(defaultMonthKey)}
                  className="ml-1 px-2 py-1 text-[11px] font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 rounded-md hover:bg-teal-100 cursor-pointer"
                >
                  Mês Atual
                </button>
              )}
            </div>

            {onApplyPeriod && (
              <div className="pl-1 sm:pl-2 sm:border-l border-slate-200 dark:border-slate-700">
                <PeriodCalendarPopover
                  selectedMonthKey={selectedMonthKey}
                  selectedPeriodDays={selectedPeriodDays}
                  onApplyPeriod={onApplyPeriod}
                  externalOpenTrigger={periodOpenTrigger}
                />
              </div>
            )}
          </div>

          {/* Supervisor Session Switcher, Transfer Inbox & Calendar Info */}
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            {onChangeSupervisorView && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                <UserCheck className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf] shrink-0" />
                <span className="text-[10px] font-bold uppercase text-slate-400 hidden sm:inline">
                  Visão:
                </span>
                <select
                  value={activeSupervisorView}
                  onChange={(e) => onChangeSupervisorView(e.target.value)}
                  aria-label="Selecionar visão de supervisor"
                  className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer max-w-[170px] truncate"
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  pendingTransfersCount > 0
                    ? 'bg-[#d89627] text-white border-[#b37718] shadow-sm animate-pulse'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BellRing className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Transferências</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    pendingTransfersCount > 0
                      ? 'bg-white text-[#b37718]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {pendingTransfersCount}
                </span>
              </button>
            )}

            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold font-mono">
              {totalDays} dias{month === 2 && totalDays === 29 ? ' (Bissexto)' : ''}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-semibold font-mono">
              {saturdays.length} Sáb · {sundays.length} Dom ({completeWeekendsCount} FDS completos)
            </span>
          </div>

        </div>
      </div>
    </header>
  );
};
