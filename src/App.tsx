/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Operator, OperatorMonthlyData, DayRecord, StatusType, Operation } from './types/abs';
import {
  loadStoredOperations,
  saveStoredOperations,
  loadStoredSelectedOperationId,
  saveStoredSelectedOperationId,
  loadStoredSelectedMonthKey,
  saveStoredSelectedMonthKey,
  loadStoredOperators,
  saveStoredOperators,
  loadStoredMonthlyDataByMonth,
  saveStoredMonthlyDataByMonth,
  loadStoredSelectedOperatorId,
  saveStoredSelectedOperatorId,
  resetToDefaults
} from './utils/storage';
import {
  generateMonthDays,
  generateMonthDatasetForOperators,
  normalizeOperatorMonthlyDays,
  parseMonthKey,
  WeekendFolgaMode
} from './utils/calendar';
import { calculateOperationSummary } from './utils/calculations';
import { Navbar } from './components/Navbar';
import { OperacoesView } from './components/OperacoesView';
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

  // Active navigation tab (including Operações JSD Telecom)
  const [activeTab, setActiveTab] = useState<
    'operacoes' | 'abs-operador' | 'operadores' | 'base-apontamentos' | 'painel-wfm'
  >('operacoes');

  // Operations state
  const [operations, setOperations] = useState<Operation[]>(() => loadStoredOperations());
  const [selectedOperationId, setSelectedOperationId] = useState<string>(() =>
    loadStoredSelectedOperationId()
  );

  // Active Month/Year Key (2025-01 through 2030-12)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() =>
    loadStoredSelectedMonthKey()
  );

  // Core application data (Operators & multi-month records up to 2030)
  const [operators, setOperators] = useState<Operator[]>(() => loadStoredOperators());
  const [monthlyDataByMonth, setMonthlyDataByMonth] = useState<
    Record<string, Record<string, OperatorMonthlyData>>
  >(() => loadStoredMonthlyDataByMonth(operators));
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(() =>
    loadStoredSelectedOperatorId()
  );

  // Derived monthlyData for the currently selected month, guaranteed normalized to exact daysInMonth (28/29/30/31)
  const monthlyData = useMemo(() => {
    const { year, month } = parseMonthKey(selectedMonthKey);
    const rawMonth = monthlyDataByMonth[selectedMonthKey] || {};
    const resolved: Record<string, OperatorMonthlyData> = {};

    operators.forEach((op, idx) => {
      resolved[op.id] = normalizeOperatorMonthlyDays(rawMonth[op.id], op.id, year, month, idx);
    });

    return resolved;
  }, [monthlyDataByMonth, selectedMonthKey, operators]);

  // Switch active Month/Year and lazily persist initial calendar dataset if first visit to that month
  const handleSelectMonthKey = (newMonthKey: string) => {
    setSelectedMonthKey(newMonthKey);
    saveStoredSelectedMonthKey(newMonthKey);

    if (!monthlyDataByMonth[newMonthKey]) {
      const { year, month } = parseMonthKey(newMonthKey);
      const generated = generateMonthDatasetForOperators(operators, year, month, false);
      setMonthlyDataByMonth(prev => {
        const updated = {
          ...prev,
          [newMonthKey]: generated
        };
        saveStoredMonthlyDataByMonth(updated);
        return updated;
      });
    }
  };

  // Active operation entity
  const activeOperation = useMemo(() => {
    return operations.find(o => o.id === selectedOperationId) || operations[0];
  }, [operations, selectedOperationId]);

  // Operators scoped to the currently selected operation
  const activeOperationOperators = useMemo(() => {
    const activeId = activeOperation?.id || 'caern';
    return operators.filter(op => (op.operacaoId || 'caern') === activeId);
  }, [operators, activeOperation]);

  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddOperatorModalOpen, setIsAddOperatorModalOpen] = useState(false);

  // Dynamic unique supervisors list for the active operation
  const currentSupervisors = useMemo(() => {
    const set = new Set<string>();
    if (activeOperation?.supervisores) {
      activeOperation.supervisores.forEach(s => set.add(s));
    }
    activeOperationOperators.forEach(op => {
      if (op.supervisor) set.add(op.supervisor);
    });
    return Array.from(set);
  }, [activeOperation, activeOperationOperators]);

  // Handler to add a new operator assigned to a supervisor
  const handleAddOperator = (newOperator: Operator, newMonthlyData: OperatorMonthlyData) => {
    setOperators(prev => {
      const updated = [...prev, newOperator];
      saveStoredOperators(updated);
      return updated;
    });
    setMonthlyDataByMonth(prev => {
      const monthMap = prev[selectedMonthKey] ? { ...prev[selectedMonthKey] } : { ...monthlyData };
      monthMap[newOperator.id] = newMonthlyData;
      const updated = {
        ...prev,
        [selectedMonthKey]: monthMap
      };
      saveStoredMonthlyDataByMonth(updated);
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

  // Update days for an operator in the active month
  const handleUpdateDays = (operatorId: string, dias: DayRecord[]) => {
    setMonthlyDataByMonth(prev => {
      const currentMonthMap = prev[selectedMonthKey] ? { ...prev[selectedMonthKey] } : { ...monthlyData };
      currentMonthMap[operatorId] = {
        operatorId,
        dias
      };
      const updated = {
        ...prev,
        [selectedMonthKey]: currentMonthMap
      };
      saveStoredMonthlyDataByMonth(updated);
      return updated;
    });
  };

  // Explicit save action
  const handleSaveCurrent = () => {
    const nextByMonth = {
      ...monthlyDataByMonth,
      [selectedMonthKey]: monthlyData
    };
    setMonthlyDataByMonth(nextByMonth);
    saveStoredMonthlyDataByMonth(nextByMonth);
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

  // Reapply 6x1 weekend folga schedule using exact real calendar dates for selectedMonthKey
  const handleApply6x1Schedule = (operatorId: string, mode: WeekendFolgaMode = 'auto') => {
    const opIdx = operators.findIndex(o => o.id === operatorId);
    if (opIdx === -1) return;

    const { year, month } = parseMonthKey(selectedMonthKey);
    const dias = generateMonthDays(year, month, opIdx, mode);
    handleUpdateDays(operatorId, dias);
  };

  // Operation management handlers
  const handleSelectOperation = (id: string) => {
    setSelectedOperationId(id);
    saveStoredSelectedOperationId(id);
    const firstOp = operators.find(op => (op.operacaoId || 'caern') === id);
    if (firstOp) {
      setSelectedOperatorId(firstOp.id);
      saveStoredSelectedOperatorId(firstOp.id);
    }
  };

  const handleAddOperation = (opData: Omit<Operation, 'id'>) => {
    const newOp: Operation = {
      ...opData,
      id: `op-${Date.now()}`
    };
    setOperations(prev => {
      const updated = [...prev, newOp];
      saveStoredOperations(updated);
      return updated;
    });
    setSelectedOperationId(newOp.id);
    saveStoredSelectedOperationId(newOp.id);
  };

  const handleUpdateOperation = (updatedOp: Operation) => {
    setOperations(prev => {
      const updated = prev.map(o => (o.id === updatedOp.id ? updatedOp : o));
      saveStoredOperations(updated);
      return updated;
    });
  };

  const handleAddSupervisorToOperation = (operationId: string, supervisorName: string) => {
    setOperations(prev => {
      const updated = prev.map(o => {
        if (o.id === operationId) {
          const list = o.supervisores ? [...o.supervisores] : [];
          if (!list.includes(supervisorName)) {
            list.push(supervisorName);
          }
          return { ...o, supervisores: list };
        }
        return o;
      });
      saveStoredOperations(updated);
      return updated;
    });
  };

  const handleAddOperatorToOperation = (opData: Omit<Operator, 'id'>) => {
    const newId = `op-${Date.now()}`;
    const newOperator: Operator = {
      ...opData,
      id: newId
    };
    const { year, month } = parseMonthKey(selectedMonthKey);
    const newDias = generateMonthDays(year, month, operators.length, 'auto');
    handleAddOperator(newOperator, { operatorId: newId, dias: newDias });
  };

  // Restore factory initial 44 operators and dataset
  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar a estrutura inicial com os 44 operadores originais da Operação CAERN? Todas as edições manuais serão redefinidas para o padrão inicial.'
      )
    ) {
      const reset = resetToDefaults();
      setOperations(reset.operations);
      setOperators(reset.operators);
      setSelectedMonthKey(reset.selectedMonthKey);
      setMonthlyDataByMonth(reset.monthlyDataByMonth);
      setSelectedOperationId(reset.operations[0].id);
      setSelectedOperatorId(reset.operators[0].id);
    }
  };

  // Handle external JSON import
  const handleImportData = (
    newOperators: Operator[],
    newMonthlyData: Record<string, OperatorMonthlyData>
  ) => {
    setOperators(newOperators);
    saveStoredOperators(newOperators);
    setMonthlyDataByMonth(prev => {
      const updated = {
        ...prev,
        [selectedMonthKey]: newMonthlyData
      };
      saveStoredMonthlyDataByMonth(updated);
      return updated;
    });
    if (newOperators.length > 0) {
      setSelectedOperatorId(newOperators[0].id);
    }
  };

  // Global operation calculation for the navbar
  const globalSummary = useMemo(() => {
    return calculateOperationSummary(activeOperationOperators, monthlyData, currentSupervisors);
  }, [activeOperationOperators, monthlyData, currentSupervisors]);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Navigation & Global Calendar Bar (2025 - 2030) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        onResetDefaults={handleResetDefaults}
        onOpenExportImport={() => setIsExportModalOpen(true)}
        absGeral={globalSummary.absGeral}
        activeOperationName={activeOperation?.nome}
        selectedMonthKey={selectedMonthKey}
        onSelectMonthKey={handleSelectMonthKey}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'operacoes' && (
          <OperacoesView
            operations={operations}
            selectedOperationId={selectedOperationId}
            onSelectOperation={handleSelectOperation}
            onAddOperation={handleAddOperation}
            onUpdateOperation={handleUpdateOperation}
            operators={operators}
            monthlyData={monthlyData}
            onAddSupervisorToOperation={handleAddSupervisorToOperation}
            onAddOperatorToOperation={handleAddOperatorToOperation}
            onSelectOperatorForAudit={handleSelectOperatorForAudit}
          />
        )}
        
        {activeTab === 'abs-operador' && (
          <AbsOperatorView
            operators={activeOperationOperators}
            currentOperatorId={selectedOperatorId}
            onSelectOperator={handleSelectOperator}
            monthlyData={monthlyData}
            onUpdateDays={handleUpdateDays}
            onSave={handleSaveCurrent}
            onResetOperatorMonth={handleResetOperatorMonth}
            onApply6x1Schedule={handleApply6x1Schedule}
            selectedMonthKey={selectedMonthKey}
          />
        )}

        {activeTab === 'operadores' && (
          <OperatorsListView
            operators={activeOperationOperators}
            monthlyData={monthlyData}
            onSelectOperatorForAudit={handleSelectOperatorForAudit}
            onAddOperator={() => setIsAddOperatorModalOpen(true)}
          />
        )}

        {activeTab === 'base-apontamentos' && (
          <BaseApontamentosView
            operators={activeOperationOperators}
            monthlyData={monthlyData}
            onUpdateDays={handleUpdateDays}
            onSelectOperatorForAudit={handleSelectOperatorForAudit}
            selectedMonthKey={selectedMonthKey}
          />
        )}

        {activeTab === 'painel-wfm' && (
          <WfmDashboardView
            operators={activeOperationOperators}
            monthlyData={monthlyData}
            onSelectOperatorForAudit={handleSelectOperatorForAudit}
            selectedMonthKey={selectedMonthKey}
          />
        )}

      </main>

      {/* Add Operator Modal */}
      <AddOperatorModal
        isOpen={isAddOperatorModalOpen}
        onClose={() => setIsAddOperatorModalOpen(false)}
        onAddOperator={handleAddOperator}
        existingSupervisors={currentSupervisors}
        activeOperationId={activeOperation?.id}
        selectedMonthKey={selectedMonthKey}
      />

      {/* Export & Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        operators={activeOperationOperators}
        monthlyData={monthlyData}
        onImportData={handleImportData}
        selectedMonthKey={selectedMonthKey}
      />

      {/* Quiet Corporate Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            JSD Telecom · Sistema Automatizado de Controle de Absenteísmo (ABS) em Minutos · WFM
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Calendário Real 2025–2030 · Regra CLT 36h / 380 min diários
          </span>
        </div>
      </footer>

    </div>
  );
}
