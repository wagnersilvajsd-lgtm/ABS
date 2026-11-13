import React, { useState, useEffect, useMemo } from 'react';
import {
  Operator,
  OperatorMonthlyData,
  DayRecord,
  StatusType,
  Operation,
  OperatorHistoryEvent,
  TransferRequest
} from './types/abs';
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
  loadStoredOperatorHistory,
  saveStoredOperatorHistory,
  loadStoredTransfers,
  saveStoredTransfers,
  loadStoredActiveSupervisorView,
  saveStoredActiveSupervisorView,
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
import { OperatorProfileModal } from './components/OperatorProfileModal';
import { TransferOperatorModal } from './components/TransferOperatorModal';
import { TransferInboxModal } from './components/TransferInboxModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { EditOperatorModal } from './components/EditOperatorModal';
import { EditSupervisorModal } from './components/EditSupervisorModal';
import { BellRing, CheckCircle2, X, RotateCcw } from 'lucide-react';

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

  // Operator Profile History & Supervisor Transfers
  const [operatorHistory, setOperatorHistory] = useState<Record<string, OperatorHistoryEvent[]>>(
    () => loadStoredOperatorHistory()
  );
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>(() =>
    loadStoredTransfers()
  );
  const [activeSupervisorView, setActiveSupervisorView] = useState<string>(() =>
    loadStoredActiveSupervisorView()
  );

  // Modal & Toast states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddOperatorModalOpen, setIsAddOperatorModalOpen] = useState(false);
  const [profileOperatorId, setProfileOperatorId] = useState<string | null>(null);
  const [transferOperator, setTransferOperator] = useState<Operator | null>(null);
  const [deleteOperator, setDeleteOperator] = useState<Operator | null>(null);
  const [editOperator, setEditOperator] = useState<Operator | null>(null);
  const [editSupervisorTarget, setEditSupervisorTarget] = useState<{
    name: string;
    linkedCount: number;
  } | null>(null);
  const [isTransferInboxOpen, setIsTransferInboxOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [actionToast, setActionToast] = useState<{
    message: string;
    targetSupervisor?: string;
  } | null>(null);

  const showActionToast = (message: string, targetSupervisor?: string) => {
    setActionToast({ message, targetSupervisor });
  };

  useEffect(() => {
    if (!actionToast) return;
    const timer = setTimeout(() => setActionToast(null), 7000);
    return () => clearTimeout(timer);
  }, [actionToast]);

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

  // History event counts per operator
  const operatorHistoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(operatorHistory).forEach(opId => {
      counts[opId] = (operatorHistory[opId] || []).length;
    });
    return counts;
  }, [operatorHistory]);

  // Pending transfers filtered by active supervisor view (or all pending if gestor)
  const visiblePendingTransfers = useMemo(() => {
    const pending = transferRequests.filter(t => t.status === 'pendente');
    if (activeSupervisorView === 'gestor') {
      return pending;
    }
    return pending.filter(
      t => t.toSupervisor.toLowerCase().trim() === activeSupervisorView.toLowerCase().trim()
    );
  }, [transferRequests, activeSupervisorView]);

  // Auto-open informative pop-up when the receiving supervisor enters their session view
  useEffect(() => {
    if (activeSupervisorView !== 'gestor') {
      const incoming = transferRequests.filter(
        t =>
          t.status === 'pendente' &&
          t.toSupervisor.toLowerCase().trim() === activeSupervisorView.toLowerCase().trim()
      );
      if (incoming.length > 0) {
        setIsTransferInboxOpen(true);
      }
    }
  }, [activeSupervisorView, transferRequests]);

  const handleChangeSupervisorView = (sup: string) => {
    setActiveSupervisorView(sup);
    saveStoredActiveSupervisorView(sup);
  };

  // Profile operator object
  const profileOperator = useMemo(() => {
    if (!profileOperatorId) return null;
    return operators.find(o => o.id === profileOperatorId) || null;
  }, [profileOperatorId, operators]);

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

  // Delete operator permanently (operators list, monthly data, history, pending transfers)
  const handleConfirmDeleteOperator = (operatorId: string) => {
    const deletedOp = operators.find(o => o.id === operatorId);

    const remainingOperators = operators.filter(o => o.id !== operatorId);
    setOperators(remainingOperators);
    saveStoredOperators(remainingOperators);

    setMonthlyDataByMonth(prev => {
      const next: Record<string, Record<string, OperatorMonthlyData>> = {};
      Object.keys(prev).forEach(mKey => {
        const monthClone = { ...prev[mKey] };
        delete monthClone[operatorId];
        next[mKey] = monthClone;
      });
      saveStoredMonthlyDataByMonth(next);
      return next;
    });

    setOperatorHistory(prev => {
      const next = { ...prev };
      delete next[operatorId];
      saveStoredOperatorHistory(next);
      return next;
    });

    setTransferRequests(prev => {
      const next = prev.filter(t => t.operatorId !== operatorId);
      saveStoredTransfers(next);
      return next;
    });

    if (profileOperatorId === operatorId) {
      setProfileOperatorId(null);
    }

    if (selectedOperatorId === operatorId) {
      const activeId = activeOperation?.id || 'caern';
      const fallback = remainingOperators.find(o => (o.operacaoId || 'caern') === activeId) || remainingOperators[0];
      const nextId = fallback?.id || '';
      setSelectedOperatorId(nextId);
      saveStoredSelectedOperatorId(nextId);
    }

    if (deletedOp) {
      showActionToast(`Operador ${deletedOp.nome} excluído da operação.`);
    }
  };

  // Edit operator name & contract schedule
  const handleSaveEditedOperator = (updated: {
    id: string;
    nome: string;
    entrada: string;
    saida: string;
    jornadaMin: number;
  }) => {
    setOperators(prev => {
      const next = prev.map(op =>
        op.id === updated.id
          ? {
              ...op,
              nome: updated.nome,
              entrada: updated.entrada,
              saida: updated.saida,
              jornadaMin: updated.jornadaMin
            }
          : op
      );
      saveStoredOperators(next);
      return next;
    });

    setTransferRequests(prev => {
      const next = prev.map(t =>
        t.operatorId === updated.id ? { ...t, operatorName: updated.nome } : t
      );
      saveStoredTransfers(next);
      return next;
    });

    showActionToast(`Cadastro de ${updated.nome} atualizado com sucesso.`);
  };

  // Rename supervisor across active operation, linked operators, pending transfers, and active view
  const handleRenameSupervisor = (oldName: string, newName: string) => {
    const oldLower = oldName.toLowerCase().trim();
    if (!newName.trim() || oldLower === newName.toLowerCase().trim()) return;

    const activeId = activeOperation?.id || 'caern';

    setOperations(prev => {
      const next = prev.map(op => {
        if (op.id !== activeId) return op;
        const currentList = op.supervisores || [];
        const updatedList = Array.from(
          new Set(
            currentList.map(s => (s.toLowerCase().trim() === oldLower ? newName : s))
          )
        );
        if (!updatedList.some(s => s.toLowerCase().trim() === newName.toLowerCase().trim())) {
          updatedList.push(newName);
        }
        return { ...op, supervisores: updatedList };
      });
      saveStoredOperations(next);
      return next;
    });

    setOperators(prev => {
      const next = prev.map(op => {
        if ((op.operacaoId || 'caern') === activeId && op.supervisor.toLowerCase().trim() === oldLower) {
          return { ...op, supervisor: newName };
        }
        return op;
      });
      saveStoredOperators(next);
      return next;
    });

    setTransferRequests(prev => {
      const next = prev.map(t => {
        if (t.operacaoId !== activeId) return t;
        return {
          ...t,
          fromSupervisor: t.fromSupervisor.toLowerCase().trim() === oldLower ? newName : t.fromSupervisor,
          toSupervisor: t.toSupervisor.toLowerCase().trim() === oldLower ? newName : t.toSupervisor
        };
      });
      saveStoredTransfers(next);
      return next;
    });

    if (activeSupervisorView.toLowerCase().trim() === oldLower) {
      setActiveSupervisorView(newName);
      saveStoredActiveSupervisorView(newName);
    }

    showActionToast(`Supervisor renomeado de ${oldName} para ${newName}.`);
  };

  // Pedagogical & History events handlers
  const handleAddHistoryEvent = (eventData: Omit<OperatorHistoryEvent, 'id'>) => {
    const newEvent: OperatorHistoryEvent = {
      ...eventData,
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    setOperatorHistory(prev => {
      const list = prev[eventData.operatorId] ? [...prev[eventData.operatorId]] : [];
      list.unshift(newEvent);
      const next = {
        ...prev,
        [eventData.operatorId]: list
      };
      saveStoredOperatorHistory(next);
      return next;
    });
    showActionToast('Registro salvo no histórico do perfil do colaborador.');
  };

  const handleDeleteHistoryEvent = (operatorId: string, eventId: string) => {
    setOperatorHistory(prev => {
      const list = (prev[operatorId] || []).filter(ev => ev.id !== eventId);
      const next = {
        ...prev,
        [operatorId]: list
      };
      saveStoredOperatorHistory(next);
      return next;
    });
  };

  // Transfer submission handler (supervisor -> supervisor with schedule & timestamp)
  const handleSubmitTransfer = (payload: {
    operator: Operator;
    toSupervisor: string;
    toEntrada: string;
    toSaida: string;
    toJornadaMin: number;
    reason: string;
  }) => {
    const { operator: op, toSupervisor, toEntrada, toSaida, toJornadaMin, reason } = payload;
    const nowIso = new Date().toISOString();

    const newTransfer: TransferRequest = {
      id: `transf-${Date.now()}`,
      operatorId: op.id,
      operatorName: op.nome,
      operacaoId: op.operacaoId || activeOperation?.id || 'caern',
      fromSupervisor: op.supervisor,
      toSupervisor,
      fromEntrada: op.entrada,
      fromSaida: op.saida,
      fromJornadaMin: op.jornadaMin,
      toEntrada,
      toSaida,
      toJornadaMin,
      requestedAt: nowIso,
      requestedBy: activeSupervisorView === 'gestor' ? op.supervisor : activeSupervisorView,
      reason,
      status: 'pendente'
    };

    setTransferRequests(prev => {
      const next = [newTransfer, ...prev];
      saveStoredTransfers(next);
      return next;
    });

    // Log request in operator's profile history
    handleAddHistoryEvent({
      operatorId: op.id,
      category: 'transferencia',
      reason: 'Solicitação de Transferência entre Supervisores',
      description: `Transferência solicitada de ${op.supervisor} para ${toSupervisor}. Motivo: ${reason}`,
      appliedBy: activeSupervisorView === 'gestor' ? op.supervisor : activeSupervisorView,
      dateTime: nowIso,
      fromSupervisor: op.supervisor,
      toSupervisor,
      fromSchedule: `${op.entrada} - ${op.saida}`,
      toSchedule: `${toEntrada} - ${toSaida}`,
      transferStatus: 'pendente'
    });

    showActionToast(
      `Transferência de ${op.nome} enviada para ${toSupervisor}!`,
      toSupervisor
    );
  };

  // Accept incoming transfer
  const handleAcceptTransfer = (transferId: string, responseNote: string) => {
    const req = transferRequests.find(t => t.id === transferId);
    if (!req) return;

    const nowIso = new Date().toISOString();

    // Update transfer status
    setTransferRequests(prev => {
      const next = prev.map(t =>
        t.id === transferId
          ? {
              ...t,
              status: 'aceita' as const,
              respondedAt: nowIso,
              responseNote
            }
          : t
      );
      saveStoredTransfers(next);
      return next;
    });

    // Update operator supervisor & schedule
    setOperators(prev => {
      const next = prev.map(op =>
        op.id === req.operatorId
          ? {
              ...op,
              supervisor: req.toSupervisor,
              entrada: req.toEntrada,
              saida: req.toSaida,
              jornadaMin: req.toJornadaMin
            }
          : op
      );
      saveStoredOperators(next);
      return next;
    });

    // Ensure destination supervisor is registered in the operation's supervisors list
    setOperations(prev => {
      const next = prev.map(o => {
        if (o.id === req.operacaoId) {
          const sups = o.supervisores ? [...o.supervisores] : [];
          if (!sups.some(s => s.toLowerCase() === req.toSupervisor.toLowerCase())) {
            sups.push(req.toSupervisor);
          }
          return { ...o, supervisores: sups };
        }
        return o;
      });
      saveStoredOperations(next);
      return next;
    });

    // Record acceptance in operator history
    handleAddHistoryEvent({
      operatorId: req.operatorId,
      category: 'transferencia',
      reason: 'Transferência Aceita pelo Supervisor Destino',
      description: `Transferência aceita por ${req.toSupervisor}.${responseNote ? ` Observação: ${responseNote}` : ''}`,
      appliedBy: req.toSupervisor,
      dateTime: nowIso,
      fromSupervisor: req.fromSupervisor,
      toSupervisor: req.toSupervisor,
      fromSchedule: `${req.fromEntrada} - ${req.fromSaida}`,
      toSchedule: `${req.toEntrada} - ${req.toSaida}`,
      transferStatus: 'aceita'
    });

    showActionToast(`Transferência de ${req.operatorName} aceita! Novo supervisor: ${req.toSupervisor}.`);
  };

  // Reject incoming transfer
  const handleRejectTransfer = (transferId: string, responseNote: string) => {
    const req = transferRequests.find(t => t.id === transferId);
    if (!req) return;

    const nowIso = new Date().toISOString();

    setTransferRequests(prev => {
      const next = prev.map(t =>
        t.id === transferId
          ? {
              ...t,
              status: 'recusada' as const,
              respondedAt: nowIso,
              responseNote
            }
          : t
      );
      saveStoredTransfers(next);
      return next;
    });

    // Record rejection in operator history
    handleAddHistoryEvent({
      operatorId: req.operatorId,
      category: 'transferencia',
      reason: 'Transferência Recusada pelo Supervisor Destino',
      description: `Transferência para ${req.toSupervisor} foi recusada. Colaborador mantido com ${req.fromSupervisor}.${responseNote ? ` Motivo da recusa: ${responseNote}` : ''}`,
      appliedBy: req.toSupervisor,
      dateTime: nowIso,
      fromSupervisor: req.fromSupervisor,
      toSupervisor: req.toSupervisor,
      fromSchedule: `${req.fromEntrada} - ${req.fromSaida}`,
      toSchedule: `${req.toEntrada} - ${req.toSaida}`,
      transferStatus: 'recusada'
    });

    showActionToast(`Transferência de ${req.operatorName} foi recusada.`);
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
      atraso: 0,
      abonoMin: undefined
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
    showActionToast(`Operação ${updatedOp.nome} atualizada com sucesso.`);
  };

  const handleDeleteOperation = (operationId: string) => {
    if (operations.length <= 1) return;
    const targetOp = operations.find(o => o.id === operationId);
    const remainingOps = operations.filter(o => o.id !== operationId);

    setOperations(remainingOps);
    saveStoredOperations(remainingOps);

    // Collect operator IDs linked to deleted operation
    const removedOperatorIds = new Set(
      operators
        .filter(op => (op.operacaoId || 'caern') === operationId)
        .map(op => op.id)
    );

    const remainingOperators = operators.filter(op => !removedOperatorIds.has(op.id));
    setOperators(remainingOperators);
    saveStoredOperators(remainingOperators);

    if (removedOperatorIds.size > 0) {
      setMonthlyDataByMonth(prev => {
        const next: Record<string, Record<string, OperatorMonthlyData>> = {};
        Object.keys(prev).forEach(mKey => {
          const monthClone = { ...prev[mKey] };
          removedOperatorIds.forEach(opId => delete monthClone[opId]);
          next[mKey] = monthClone;
        });
        saveStoredMonthlyDataByMonth(next);
        return next;
      });

      setOperatorHistory(prev => {
        const next = { ...prev };
        removedOperatorIds.forEach(opId => delete next[opId]);
        saveStoredOperatorHistory(next);
        return next;
      });
    }

    setTransferRequests(prev => {
      const next = prev.filter(
        t => t.operacaoId !== operationId && !removedOperatorIds.has(t.operatorId)
      );
      saveStoredTransfers(next);
      return next;
    });

    const nextActiveOpId = remainingOps[0]?.id || '';
    setSelectedOperationId(nextActiveOpId);
    saveStoredSelectedOperationId(nextActiveOpId);

    const nextFirstOp = remainingOperators.find(
      op => (op.operacaoId || 'caern') === nextActiveOpId
    );
    const nextOpId = nextFirstOp?.id || '';
    setSelectedOperatorId(nextOpId);
    saveStoredSelectedOperatorId(nextOpId);

    if (profileOperatorId && removedOperatorIds.has(profileOperatorId)) {
      setProfileOperatorId(null);
    }

    if (targetOp) {
      showActionToast(`Operação ${targetOp.nome} excluída com sucesso.`);
    }
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
  const handleConfirmResetDefaults = () => {
    const reset = resetToDefaults();
    setOperations(reset.operations);
    setOperators(reset.operators);
    setSelectedMonthKey(reset.selectedMonthKey);
    setMonthlyDataByMonth(reset.monthlyDataByMonth);
    setOperatorHistory(reset.operatorHistory);
    setTransferRequests(reset.transfers);
    setActiveSupervisorView('gestor');
    setSelectedOperationId(reset.operations[0].id);
    setSelectedOperatorId(reset.operators[0].id);
    setIsResetConfirmOpen(false);
    showActionToast('Base restaurada para os 44 operadores originais da CAERN.');
  };

  // Handle external JSON import
  const handleImportData = (
    newOperators: Operator[],
    newMonthlyData: Record<string, OperatorMonthlyData>,
    importedHistory?: Record<string, OperatorHistoryEvent[]>,
    importedTransfers?: TransferRequest[]
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
    if (importedHistory) {
      setOperatorHistory(importedHistory);
      saveStoredOperatorHistory(importedHistory);
    }
    if (importedTransfers) {
      setTransferRequests(importedTransfers);
      saveStoredTransfers(importedTransfers);
    }
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
        onResetDefaults={() => setIsResetConfirmOpen(true)}
        onOpenExportImport={() => setIsExportModalOpen(true)}
        absGeral={globalSummary.absGeral}
        activeOperationName={activeOperation?.nome}
        selectedMonthKey={selectedMonthKey}
        onSelectMonthKey={handleSelectMonthKey}
        supervisorsList={currentSupervisors}
        activeSupervisorView={activeSupervisorView}
        onChangeSupervisorView={handleChangeSupervisorView}
        pendingTransfersCount={visiblePendingTransfers.length}
        onOpenTransferInbox={() => setIsTransferInboxOpen(true)}
      />

      {/* Action / Transfer Toast */}
      {actionToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-[#006772] flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#2dd4bf] shrink-0" />
          <div className="flex-1 text-xs">
            <p className="font-semibold">{actionToast.message}</p>
            {actionToast.targetSupervisor && (
              <button
                type="button"
                onClick={() => {
                  const sup = actionToast.targetSupervisor!;
                  setActiveSupervisorView(sup);
                  saveStoredActiveSupervisorView(sup);
                  setIsTransferInboxOpen(true);
                  setActionToast(null);
                }}
                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#d89627] hover:bg-[#b37718] text-white text-[11px] font-bold cursor-pointer"
              >
                <BellRing className="w-3 h-3" />
                <span>Simular Visão de {actionToast.targetSupervisor} (Abrir Pop-up)</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'operacoes' && (
          <OperacoesView
            operations={operations}
            selectedOperationId={selectedOperationId}
            onSelectOperation={handleSelectOperation}
            onAddOperation={handleAddOperation}
            onUpdateOperation={handleUpdateOperation}
            onDeleteOperation={handleDeleteOperation}
            operators={operators}
            monthlyData={monthlyData}
            onAddSupervisorToOperation={handleAddSupervisorToOperation}
            onAddOperatorToOperation={handleAddOperatorToOperation}
            onSelectOperatorForAudit={handleSelectOperatorForAudit}
            onOpenProfile={(op) => setProfileOperatorId(op.id)}
            onOpenTransfer={(op) => setTransferOperator(op)}
            onOpenDelete={(op) => setDeleteOperator(op)}
            onOpenEditOperator={(op) => setEditOperator(op)}
            onOpenEditSupervisor={(name, linkedCount) => setEditSupervisorTarget({ name, linkedCount })}
            operatorHistoryCounts={operatorHistoryCounts}
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
            onOpenProfile={(op) => setProfileOperatorId(op.id)}
            onOpenTransfer={(op) => setTransferOperator(op)}
            onOpenEditOperator={(op) => setEditOperator(op)}
            onOpenEditSupervisor={(name, linkedCount) => setEditSupervisorTarget({ name, linkedCount })}
            operatorHistoryCount={operatorHistoryCounts[selectedOperatorId] || 0}
          />
        )}

        {activeTab === 'operadores' && (
          <OperatorsListView
            operators={activeOperationOperators}
            monthlyData={monthlyData}
            onSelectOperatorForAudit={handleSelectOperatorForAudit}
            onAddOperator={() => setIsAddOperatorModalOpen(true)}
            onOpenProfile={(op) => setProfileOperatorId(op.id)}
            onOpenTransfer={(op) => setTransferOperator(op)}
            onOpenDelete={(op) => setDeleteOperator(op)}
            onOpenEditOperator={(op) => setEditOperator(op)}
            onOpenEditSupervisor={(name, linkedCount) => setEditSupervisorTarget({ name, linkedCount })}
            operatorHistoryCounts={operatorHistoryCounts}
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

      {/* Operator Profile & Pedagogical Scale Modal */}
      <OperatorProfileModal
        isOpen={Boolean(profileOperator)}
        onClose={() => setProfileOperatorId(null)}
        operator={profileOperator}
        operationName={activeOperation?.nome || 'Operação CAERN'}
        historyEvents={profileOperator ? operatorHistory[profileOperator.id] || [] : []}
        onAddHistoryEvent={handleAddHistoryEvent}
        onDeleteHistoryEvent={handleDeleteHistoryEvent}
        onOpenTransfer={(op) => setTransferOperator(op)}
        onOpenDelete={(op) => setDeleteOperator(op)}
        onOpenEditOperator={(op) => setEditOperator(op)}
      />

      {/* Edit Operator Name & Schedule Modal */}
      <EditOperatorModal
        isOpen={Boolean(editOperator)}
        onClose={() => setEditOperator(null)}
        operator={editOperator}
        onSaveOperator={handleSaveEditedOperator}
      />

      {/* Edit Supervisor Name Modal */}
      <EditSupervisorModal
        isOpen={Boolean(editSupervisorTarget)}
        onClose={() => setEditSupervisorTarget(null)}
        supervisorName={editSupervisorTarget?.name || null}
        linkedOperatorsCount={editSupervisorTarget?.linkedCount || 0}
        onRenameSupervisor={handleRenameSupervisor}
      />

      {/* Supervisor-to-Supervisor Transfer Request Modal */}
      <TransferOperatorModal
        isOpen={Boolean(transferOperator)}
        onClose={() => setTransferOperator(null)}
        operator={transferOperator}
        availableSupervisors={currentSupervisors}
        onSubmitTransfer={handleSubmitTransfer}
      />

      {/* Receiving Supervisor Pop-up (Accept / Reject Transfer) */}
      <TransferInboxModal
        isOpen={isTransferInboxOpen}
        onClose={() => setIsTransferInboxOpen(false)}
        pendingTransfers={visiblePendingTransfers}
        activeSupervisorView={activeSupervisorView}
        onAcceptTransfer={handleAcceptTransfer}
        onRejectTransfer={handleRejectTransfer}
      />

      {/* Delete Operator Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteOperator)}
        onClose={() => setDeleteOperator(null)}
        operator={deleteOperator}
        onConfirmDelete={handleConfirmDeleteOperator}
      />

      {/* Reset Defaults Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Restaurar Dados Padrão
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tem certeza que deseja restaurar a estrutura inicial com os 44 operadores originais da Operação CAERN? Todas as edições manuais, transferências e históricos serão redefinidos.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetDefaults}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Confirmar Restauração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export & Import Modal */}
      <ExportImportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        operators={activeOperationOperators}
        monthlyData={monthlyData}
        onImportData={handleImportData}
        selectedMonthKey={selectedMonthKey}
        operatorHistory={operatorHistory}
        transferRequests={transferRequests}
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
