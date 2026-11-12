import React from 'react';
import { Calendar, Users, Table, BarChart3, RotateCcw, Download, Moon, Sun, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  activeTab: 'abs-operador' | 'operadores' | 'base-apontamentos' | 'painel-wfm';
  setActiveTab: (tab: 'abs-operador' | 'operadores' | 'base-apontamentos' | 'painel-wfm') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onResetDefaults: () => void;
  onOpenExportImport: () => void;
  absGeral: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onResetDefaults,
  onOpenExportImport,
  absGeral
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Wordmark (Zone 1) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 dark:bg-emerald-700 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-sm">
              ABS
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
                Controle de Absenteísmo WFM
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                Call Center &amp; Engenharia de Dados
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Zone 2) */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
            <button
              onClick={() => setActiveTab('abs-operador')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'abs-operador'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>ABS Operador (31 Dias)</span>
            </button>

            <button
              onClick={() => setActiveTab('operadores')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'operadores'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Operadores (44)</span>
            </button>

            <button
              onClick={() => setActiveTab('base-apontamentos')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'base-apontamentos'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Base Apontamentos</span>
            </button>

            <button
              onClick={() => setActiveTab('painel-wfm')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'painel-wfm'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-sm'
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
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40">
              <span className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300">ABS Operação:</span>
              <span className="text-xs font-bold font-mono tabular-nums text-emerald-800 dark:text-emerald-400">
                {(absGeral * 100).toFixed(2)}%
              </span>
            </div>

            {/* Export / Import Button */}
            <button
              onClick={onOpenExportImport}
              title="Exportar ou Importar dados (CSV/Planilha)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exportar / Planilha</span>
            </button>

            {/* Reset Defaults Button */}
            <button
              onClick={onResetDefaults}
              title="Restaurar estrutura e dados padrão dos 44 operadores"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Restaurar</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => setActiveTab('abs-operador')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'abs-operador'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            ABS Operador
          </button>
          <button
            onClick={() => setActiveTab('operadores')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'operadores'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Operadores
          </button>
          <button
            onClick={() => setActiveTab('base-apontamentos')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'base-apontamentos'
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Base Matriz
          </button>
          <button
            onClick={() => setActiveTab('painel-wfm')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'painel-wfm'
                ? 'bg-emerald-800 text-white'
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
