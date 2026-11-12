/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Operator, OperatorMonthlyData, DayRecord, StatusType } from './types/abs';
import {
  loadStoredOperators,
  saveStoredOperators,
  loadStoredMonthlyData,
  saveStoredMonthlyData,
  loadStoredSelectedOperatorId,
  saveStoredSelectedOperatorId,
  resetToDefaults
} from './utils/storage';
import { calculateOperationSummary } from './utils/calculations';
import { SUPERVISORES_LIST } from './data/initialData';
import { Navbar } from './components/Navbar';
import { AbsOperatorView } from './components/AbsOperatorView';
import { OperatorsListView } from './components/OperatorsListView';
import { BaseApontamentosView } from './components/BaseApontamentosView';
import { WfmDashboardView } from './components/WfmDashboardView';
import { ExportImportModal } from './components/ExportImportModal';
import { AddOperatorModal } from './components/AddOperatorModal';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('abs_theme_dark') === 'true' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  // Sync dark class on root html
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('abs_theme_dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('abs_theme_dark', 'false');
    }
  }, [isDark]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'abs-operador' | 'operadores' | 'base-apontamentos' | 'painel-wfm'
  >('abs-operador');

  // Core application data (Operators & 31-day records)
  const [operators, setOperators] = useState<Operator[]>(() => loadStoredOperators());
  const [monthlyData, setMonthlyData] = useState<Record<string, OperatorMonthlyData>>(() =>
    loadStoredMonthlyData(operators)
  );
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(() =>
    loadStoredSelectedOperatorId()
  );

  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddOperatorModalOpen, setIsAddOperatorModalOpen] = useState(false);

  // Dynamic unique supervisors list
  const currentSupervisors = useMemo(() => {
    const set = new Set<string>();
    operators.forEach(op => {
      if (op.supervisor) set.add(op.supervisor);
    });
    return Array.from(set);
  }, [operators]);

  // Handler to add a new operator assigned to a supervisor
  const handleAddOperator = (newOperator: Operator, newMonthlyData: OperatorMonthlyData) => {
    setOperators(prev => {
      const updated = [...prev, newOperator];
      saveStoredOperators(updated);
      return updated;
    });
    setMonthlyData(prev => {
      const updated = {
        ...prev,
        [newOperator.id]: newMonthlyData
      };
      saveStoredMonthlyData(updated);
      return updated;
    });
    setSelectedOperatorId(newOperator.id);
  };

  // Select an operator and persist choice
  const handleSelectOperator = (id: string) => {
    setSelectedOperatorId(id);
    saveStoredSelectedOperatorId(id);
  };

  // Jump from another tab directly to audit an operator
  const handleSelectOperatorForAudit = (id: string) => {
    handleSelectOperator(id);
    setActiveTab('abs-operador');
  };

  // Update days for an operator (Acts like the Google Sheets onEdit trigger!)
  const handleUpdateDays = (operatorId: string, dias: DayRecord[]) => {
    setMonthlyData(prev => {
      const updated = {
        ...prev,
        [operatorId]: {
          operatorId,
          dias
        }
      };
      saveStoredMonthlyData(updated);
      return updated;
    });
  };

  // Explicit save action
  const handleSaveCurrent = () => {
    saveStoredMonthlyData(monthlyData);
    saveStoredOperators(operators);
  };

  // Reset current operator's month (clears absences and delays while preserving/setting folgas)
  const handleResetOperatorMonth = (operatorId: string) => {
    const op = operators.find(o => o.id === operatorId);
    if (!op) return;

    const opData = monthlyData[operatorId] || { operatorId, dias: [] };
    const dias: DayRecord[] = opData.dias.map(d => ({
      ...d,
      status: d.status === 'folga' ? ('folga' as StatusType) : ('dia ok' as StatusType),
      atraso: 0
    }));

    handleUpdateDays(operatorId, dias);
  };

  // Reapply standard 6x1 schedule with 4 flexible weekend folgas
  const handleApply6x1Schedule = (operatorId: string) => {
    const opIdx = operators.findIndex(o => o.id === operatorId);
    if (opIdx === -1) return;

    // Escala 6x1 com 4 folgas flexíveis em finais de semana (Domingos [7, 14, 21, 28] ou Sábados [6, 13, 20, 27])
    const fdsFolgas = (opIdx % 2 === 0) ? [7, 14, 21, 28] : [6, 13, 20, 27];

    const dias: DayRecord[] = Array.from({ length: 31 }, (_, i) => {
      const dayNum = i + 1;
      const isFolga = fdsFolgas.indexOf(dayNum) !== -1;

      return {
        dia: dayNum,
        status: isFolga ? ('folga' as StatusType) : ('dia ok' as StatusType),
        atraso: 0
      };
    });

    handleUpdateDays(operatorId, dias);
  };

  // Restore factory initial 44 operators and dataset
  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar a estrutura inicial com os 44 operadores originais? Todas as edições manuais serão redefinidas para o padrão inicial.'
      )
    ) {
      const reset = resetToDefaults();
      setOperators(reset.operators);
      setMonthlyData(reset.monthlyData);
      setSelectedOperatorId(reset.operators[0].id);
    }
  };

  // Handle external JSON import
  const handleImportData = (
    newOperators: Operator[],
    newMonthlyData: Record<string, OperatorMonthlyData>
  ) => {
    setOperators(newOperators);
    setMonthlyData(newMonthlyData);
    saveStoredOperators(newOperators);
    saveStoredMonthlyData(newMonthlyData);
    if (newOperators.length > 0) {
      setSelectedOperatorId(newOperators[0].id);
    }
  };

  // Global operation calculation for the navbar
  const globalSummary = useMemo(() => {
    return calculateOperationSummary(operators, monthlyData, currentSupervisors);
  }, [operators, monthlyData, currentSupervisors]);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        onResetDefaults={handleResetDefaults}
        onOpenExportImport={() => setIsExportModalOpen(true)}
        absGeral={globalSummary.absGeral}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'abs-operador' && (
          <AbsOperatorView
            operators={operators}
            currentOperatorId={selectedOperatorId}
            onSelectOperator={handleSelectOperator}
            monthlyData={monthlyData}
            onUpdateDays={handleUpdateDays}
            onSave={handleSaveCurrent}
            onResetOperatorMonth={handleResetOperatorMonth}
            onApply6x1Schedule={handleApply6x1Schedule}
          />
        )}

        {activeTab === 'operadores' && (
          <OperatorsListView
            operators={operators}
            monthlyData={monthlyData}
            onSelectOperatorForAudit={handleSelectOperatorForAudit}
            onAddOperator={() => setIsAddOperatorModalOpen(true)}
          />
        )}

        {activeTab === 'base-apontamentos' && (
          <BaseApontamentosView
            operators={operators}
            monthlyData={monthlyData}
            onUpdateDays={handleUpdateDays}
            onSelectOperatorForAudit={handleSelectOperatorForAudit}
          />
        )}

        {activeTab === 'painel-wfm' && (
          <WfmDashboardView
            operators={operators}
            monthlyData={monthlyData}
            onSelectOperatorForAudit={handleSelectOperatorForAudit}
          />
        )}

      </main>

      {/* Add Operator Modal */}
      <AddOperatorModal
        isOpen={isAddOperatorModalOpen}
        onClose={() => setIsAddOperatorModalOpen(false)}
        onAddOperator={handleAddOperator}
        existingSupervisors={currentSupervisors}
      />

      {/* Export & Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        operators={operators}
        monthlyData={monthlyData}
        onImportData={handleImportData}
      />

      {/* Quiet Corporate Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Sistema Automatizado de Controle de Absenteísmo (ABS) em Minutos · WFM &amp; Engenharia de Dados
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Regra CLT 36h / 380 min diários · 100% Otimizado em Lote
          </span>
        </div>
      </footer>

    </div>
  );
}
