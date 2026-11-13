import React from 'react';
import { Calendar, Users, Table, BarChart3, RotateCcw, Download, Moon, Sun, Building2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'operacoes' | 'abs-operador' | 'operadores' | 'base-apontamentos' | 'painel-wfm';
  setActiveTab: (tab: 'operacoes' | 'abs-operador' | 'operadores' | 'base-apontamentos' | 'painel-wfm') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onResetDefaults: () => void;
  onOpenExportImport: () => void;
  absGeral: number;
  activeOperationName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onResetDefaults,
  onOpenExportImport,
  absGeral,
  activeOperationName = 'Operação CAERN'
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Wordmark with JSD Telecom Logo (replaces green square) */}
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
              <span>ABS Operador (31 Dias)</span>
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
              <span className="text-[11px] font-medium text-teal-900 dark:text-teal-300">ABS {activeOperationName.split(' ')[1] || 'Operação'}:</span>
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
            ABS Operador
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
    </header>
  );
};
