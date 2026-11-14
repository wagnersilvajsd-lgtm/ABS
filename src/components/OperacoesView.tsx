import React, { useEffect, useState, useMemo } from 'react';
import { Operation, Operator, OperatorMonthlyData, StatusType, DayRecord } from '../types/abs';
import {
  calculateOperatorStats,
  calculateSupervisorStats,
  formatMinutesToHours,
  formatPercent,
  getOperationMetaForMonth
} from '../utils/calculations';
import {
  MONTH_NAMES_PT,
  formatMonthKey,
  formatMonthLabel,
  getDefaultMonthKey,
  parseMonthKey
} from '../utils/calendar';
import {
  Building2,
  Plus,
  Users,
  UserCheck,
  ShieldAlert,
  Target,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Search,
  Briefcase,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  UserPlus,
  FolderPlus,
  Sparkles,
  Layers,
  ClipboardList,
  ArrowRightLeft,
  Trash2,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  FileSpreadsheet,
  SlidersHorizontal,
  CalendarDays,
  RotateCcw,
  Check
} from 'lucide-react';

interface OperacoesViewProps {
  operations: Operation[];
  selectedOperationId: string;
  selectedMonthKey?: string;
  onSelectOperation: (id: string) => void;
  onAddOperation: (op: Omit<Operation, 'id'>) => void;
  onUpdateOperation: (op: Operation) => void;
  onDeleteOperation: (operationId: string) => void;
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  onAddSupervisorToOperation: (operationId: string, supervisorName: string) => void;
  onAddOperatorToOperation: (opData: Omit<Operator, 'id'>) => void;
  onSelectOperatorForAudit: (operatorId: string) => void;
  onOpenProfile: (operator: Operator) => void;
  onOpenTransfer: (operator: Operator) => void;
  onOpenDelete: (operator: Operator) => void;
  onOpenEditOperator: (operator: Operator) => void;
  onOpenEditSupervisor: (supervisorName: string, linkedCount: number) => void;
  operatorHistoryCounts?: Record<string, number>;
  onOpenBulkImport?: () => void;
}

export const OperacoesView: React.FC<OperacoesViewProps> = ({
  operations,
  selectedOperationId,
  selectedMonthKey,
  onSelectOperation,
  onAddOperation,
  onUpdateOperation,
  onDeleteOperation,
  operators,
  monthlyData,
  onAddSupervisorToOperation,
  onAddOperatorToOperation,
  onSelectOperatorForAudit,
  onOpenProfile,
  onOpenTransfer,
  onOpenDelete,
  onOpenEditOperator,
  onOpenEditSupervisor,
  operatorHistoryCounts = {},
  onOpenBulkImport
}) => {
  const activeMonthKey = selectedMonthKey || getDefaultMonthKey();
  const activeMonthLabel = formatMonthLabel(activeMonthKey);
  const { year: activeYear } = parseMonthKey(activeMonthKey);
  // Modal states
  const [isAddOpModalOpen, setIsAddOpModalOpen] = useState(false);
  const [isEditOpModalOpen, setIsEditOpModalOpen] = useState(false);
  const [isDeleteOpConfirmOpen, setIsDeleteOpConfirmOpen] = useState(false);
  const [isAddSupModalOpen, setIsAddSupModalOpen] = useState(false);
  const [isAddOperatorModalOpen, setIsAddOperatorModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Filter & search states
  const [selectedSupFilter, setSelectedSupFilter] = useState<string>('todos');
  const [opSearchTerm, setOpSearchTerm] = useState('');

  // Form states for New Operation
  const [newOpName, setNewOpName] = useState('');
  const [newOpClient, setNewOpClient] = useState('');
  const [newOpLogoUrl, setNewOpLogoUrl] = useState('');
  const [newOpMetaAbs, setNewOpMetaAbs] = useState('3.0');
  const [newOpJornada, setNewOpJornada] = useState('380');
  const [newOpDesc, setNewOpDesc] = useState('');

  // Form states for Edit Operation
  const [editOpName, setEditOpName] = useState('');
  const [editOpClient, setEditOpClient] = useState('');
  const [editOpLogoUrl, setEditOpLogoUrl] = useState('');
  const [editOpMetaAbs, setEditOpMetaAbs] = useState('3.0');
  const [editOpDesc, setEditOpDesc] = useState('');

  // Form states for New Supervisor
  const [newSupName, setNewSupName] = useState('');

  // Form states for New Operator in Operation
  const [newOpOperatorName, setNewOpOperatorName] = useState('');
  const [newOpOperatorSup, setNewOpOperatorSup] = useState('');
  const [isNewOpOperatorCustomSup, setIsNewOpOperatorCustomSup] = useState(false);
  const [newOpOperatorCustomSup, setNewOpOperatorCustomSup] = useState('');
  const [newOpOperatorEntrada, setNewOpOperatorEntrada] = useState('08:00:00');
  const [newOpOperatorSaida, setNewOpOperatorSaida] = useState('14:20:00');
  const [newOpOperatorJornada, setNewOpOperatorJornada] = useState('380');

  // Currently active operation
  const activeOp = useMemo(() => {
    return operations.find(o => o.id === selectedOperationId) || operations[0];
  }, [operations, selectedOperationId]);

  const activeMetaLimit = getOperationMetaForMonth(activeOp, activeMonthKey);
  const hasCustomMonthMeta =
    typeof activeOp?.monthlyMetas?.[activeMonthKey] === 'number';

  // Monthly absenteeism target settings state
  const [defaultMetaInput, setDefaultMetaInput] = useState('3.0');
  const [monthMetaInput, setMonthMetaInput] = useState('3.0');
  const [showAnnualMetaGrid, setShowAnnualMetaGrid] = useState(false);
  const [metaSavedFlash, setMetaSavedFlash] = useState(false);

  useEffect(() => {
    if (!activeOp) return;
    const defaultPct = ((activeOp.metaAbs || 0.03) * 100).toFixed(1);
    const monthPct = (getOperationMetaForMonth(activeOp, activeMonthKey) * 100).toFixed(1);
    setDefaultMetaInput(defaultPct);
    setMonthMetaInput(monthPct);
  }, [activeOp, activeMonthKey]);

  const handleSaveMonthlyGoalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOp) return;
    const parsedDefault = Math.max(0.1, Math.min(50, parseFloat(defaultMetaInput) || 3.0));
    const parsedMonth = Math.max(0.1, Math.min(50, parseFloat(monthMetaInput) || parsedDefault));
    const nextMonthlyMetas = { ...(activeOp.monthlyMetas || {}) };

    if (Math.abs(parsedMonth - parsedDefault) < 0.001) {
      delete nextMonthlyMetas[activeMonthKey];
    } else {
      nextMonthlyMetas[activeMonthKey] = parsedMonth / 100;
    }

    onUpdateOperation({
      ...activeOp,
      metaAbs: parsedDefault / 100,
      monthlyMetas: nextMonthlyMetas
    });
    setMetaSavedFlash(true);
    setTimeout(() => setMetaSavedFlash(false), 2200);
  };

  const handleResetActiveMonthMeta = () => {
    if (!activeOp) return;
    const nextMonthlyMetas = { ...(activeOp.monthlyMetas || {}) };
    delete nextMonthlyMetas[activeMonthKey];
    onUpdateOperation({
      ...activeOp,
      monthlyMetas: nextMonthlyMetas
    });
    setMonthMetaInput(((activeOp.metaAbs || 0.03) * 100).toFixed(1));
  };

  const handleSetYearMonthMeta = (monthKey: string, rawPct: string) => {
    if (!activeOp) return;
    const nextMonthlyMetas = { ...(activeOp.monthlyMetas || {}) };
    const trimmed = rawPct.trim();
    if (!trimmed) {
      delete nextMonthlyMetas[monthKey];
    } else {
      const val = parseFloat(trimmed);
      if (isNaN(val)) return;
      const clamped = Math.max(0.1, Math.min(50, val));
      if (Math.abs(clamped - (activeOp.metaAbs || 0.03) * 100) < 0.001) {
        delete nextMonthlyMetas[monthKey];
      } else {
        nextMonthlyMetas[monthKey] = clamped / 100;
      }
    }
    onUpdateOperation({
      ...activeOp,
      monthlyMetas: nextMonthlyMetas
    });
  };

  // Operators associated with active operation
  const opOperators = useMemo(() => {
    if (!activeOp) return [];
    return operators.filter(o => (o.operacaoId || 'caern') === activeOp.id);
  }, [operators, activeOp]);

  // Consolidated supervisors for active operation
  const activeSupervisors = useMemo(() => {
    const list = new Set<string>();
    // From operation definition
    if (activeOp && activeOp.supervisores) {
      activeOp.supervisores.forEach(s => list.add(s));
    }
    // From actual operators in this operation
    opOperators.forEach(o => {
      if (o.supervisor) list.add(o.supervisor);
    });
    return Array.from(list);
  }, [activeOp, opOperators]);

  // Consolidated operation calculations
  const opStats = useMemo(() => {
    let perdidos = 0;
    let escalados = 0;
    opOperators.forEach(op => {
      const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
      const st = calculateOperatorStats(data.dias, op.jornadaMin || activeOp?.jornadaPadraoMin || 380);
      perdidos += st.minutosPerdidos;
      escalados += st.minutosEscalados;
    });
    const absPercent = escalados > 0 ? perdidos / escalados : 0;
    return {
      totalOperadores: opOperators.length,
      minutosPerdidos: perdidos,
      minutosEscalados: escalados,
      absPercent
    };
  }, [opOperators, monthlyData, activeOp]);

  // Supervisor stats for active operation
  const supervisorStatsList = useMemo(() => {
    return activeSupervisors.map(sup => {
      return calculateSupervisorStats(sup, opOperators, monthlyData);
    });
  }, [activeSupervisors, opOperators, monthlyData]);

  // Filtered operators list
  const filteredOperators = useMemo(() => {
    let list = opOperators;
    if (selectedSupFilter !== 'todos') {
      list = list.filter(o => o.supervisor.toLowerCase() === selectedSupFilter.toLowerCase());
    }
    if (opSearchTerm.trim()) {
      const term = opSearchTerm.toLowerCase();
      list = list.filter(o => o.nome.toLowerCase().includes(term) || o.entrada.includes(term));
    }
    return list;
  }, [opOperators, selectedSupFilter, opSearchTerm]);

  // Upload and optimize logo image file for localStorage persistence
  const handleLogoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'new' | 'edit'
  ) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Selecione um arquivo de imagem válido (PNG, JPG, WEBP ou SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      // SVG or already compact image can be stored directly
      if (file.type === 'image/svg+xml' || result.length <= 160000) {
        if (target === 'new') setNewOpLogoUrl(result);
        else setEditOpLogoUrl(result);
        return;
      }

      // Resize large raster images cleanly to max 256x256 while preserving aspect ratio & transparency
      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL('image/png', 0.9);
          if (target === 'new') setNewOpLogoUrl(optimized);
          else setEditOpLogoUrl(optimized);
        } else {
          if (target === 'new') setNewOpLogoUrl(result);
          else setEditOpLogoUrl(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Open edit modal prefilled
  const handleOpenEdit = () => {
    if (!activeOp) return;
    setUploadError(null);
    setEditOpName(activeOp.nome);
    setEditOpClient(activeOp.cliente);
    setEditOpLogoUrl(activeOp.logoUrl || '');
    setEditOpMetaAbs(((activeOp.metaAbs || 0.03) * 100).toFixed(1));
    setEditOpDesc(activeOp.descricao || '');
    setIsEditOpModalOpen(true);
  };

  // Submit edit operation
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOp) return;
    const updated: Operation = {
      ...activeOp,
      nome: editOpName.trim() || activeOp.nome,
      cliente: editOpClient.trim() || activeOp.cliente,
      logoUrl: editOpLogoUrl.trim() || '/assets/aistudio/image_def6497f.png',
      metaAbs: (parseFloat(editOpMetaAbs) || 3.0) / 100,
      descricao: editOpDesc.trim()
    };
    onUpdateOperation(updated);
    setIsEditOpModalOpen(false);
  };

  // Submit new operation
  const handleCreateOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) return;
    onAddOperation({
      nome: newOpName.trim(),
      cliente: newOpClient.trim() || 'JSD Telecom',
      logoUrl: newOpLogoUrl.trim() || '/assets/aistudio/image_def6497f.png',
      metaAbs: (parseFloat(newOpMetaAbs) || 3.0) / 100,
      jornadaPadraoMin: parseInt(newOpJornada) || 380,
      descricao: newOpDesc.trim() || 'Central Operacional e Atendimento',
      supervisores: []
    });
    setNewOpName('');
    setNewOpClient('');
    setNewOpLogoUrl('');
    setNewOpDesc('');
    setIsAddOpModalOpen(false);
  };

  // Submit new supervisor to active operation
  const handleCreateSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim() || !activeOp) return;
    onAddSupervisorToOperation(activeOp.id, newSupName.trim().toUpperCase());
    setNewSupName('');
    setIsAddSupModalOpen(false);
  };

  // Open Add Operator modal pre-configured for current operation
  const handleOpenAddOperatorModal = () => {
    setNewOpOperatorName('');
    setNewOpOperatorSup(activeSupervisors[0] || '');
    setNewOpOperatorCustomSup('');
    setIsNewOpOperatorCustomSup(activeSupervisors.length === 0);
    setNewOpOperatorJornada(String(activeOp?.jornadaPadraoMin || 380));
    setIsAddOperatorModalOpen(true);
  };

  // Submit new operator
  const handleCreateOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpOperatorName.trim() || !activeOp) return;
    const rawSupervisor =
      isNewOpOperatorCustomSup || activeSupervisors.length === 0
        ? newOpOperatorCustomSup.trim()
        : newOpOperatorSup.trim();
    const chosenSupervisor = (rawSupervisor || activeSupervisors[0] || 'SUPERVISÃO GERAL').toUpperCase();
    onAddOperatorToOperation({
      nome: newOpOperatorName.trim().toUpperCase(),
      supervisor: chosenSupervisor,
      entrada: newOpOperatorEntrada.trim(),
      saida: newOpOperatorSaida.trim(),
      jornadaMin: parseInt(newOpOperatorJornada) || activeOp.jornadaPadraoMin || 380,
      offDayOfWeek: 1,
      operacaoId: activeOp.id
    });
    setNewOpOperatorName('');
    setNewOpOperatorCustomSup('');
    setIsAddOperatorModalOpen(false);
  };

  return (
    <div className="space-y-6">

      {/* Operation Header & Switcher */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-slate-200/70 dark:border-slate-800">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 dark:border-slate-700 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
              {activeOp?.logoUrl ? (
                <img
                  src={activeOp.logoUrl}
                  alt={activeOp.nome || 'Operação'}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
                />
              ) : (
                <Building2 className="w-6 h-6 text-[#006772]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">{activeOp?.cliente || 'JSD Telecom'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Meta {hasCustomMonthMeta ? activeMonthLabel : 'ABS'} ≤ {(activeMetaLimit * 100).toFixed(1)}%
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Jornada {activeOp?.jornadaPadraoMin || 380} min</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 truncate">
                {activeOp?.nome || 'Operação CAERN'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {activeOp?.descricao || 'Operação oficial de atendimento ao cliente com controle automatizado de ausências e escalas.'}
              </p>
            </div>
          </div>

          {/* Streamlined Action Toolbar (Operação & Liderança) */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleOpenEdit}
              className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              disabled={operations.length <= 1}
              onClick={() => setIsDeleteOpConfirmOpen(true)}
              title={
                operations.length <= 1
                  ? 'É necessário manter pelo menos 1 operação cadastrada'
                  : `Excluir ${activeOp?.nome}`
              }
              className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddSupModalOpen(true)}
              className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Novo Supervisor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadError(null);
                setIsAddOpModalOpen(true);
              }}
              className="h-9 px-4 flex items-center gap-1.5 text-xs font-semibold text-white bg-[#d89627] hover:bg-[#b87b18] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Operação</span>
            </button>
          </div>
        </div>

        {/* Operation Switcher */}
        <div className="pt-4 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
            Operações cadastradas:
          </span>
          {operations.map(op => {
            const isSelected = op.id === selectedOperationId;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => {
                  setSelectedSupFilter('todos');
                  setOpSearchTerm('');
                  onSelectOperation(op.id);
                }}
                className={`h-9 flex items-center gap-2 px-3.5 rounded-lg text-xs font-semibold btn-press whitespace-nowrap shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#006772] text-white border-[#006772]'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {op.logoUrl && (
                  <img
                    src={op.logoUrl}
                    alt={op.nome}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 object-contain rounded bg-white p-0.5 shrink-0"
                  />
                )}
                <span>{op.nome}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Symmetrical 4-Column KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* KPI 1: ABS da Operação */}
        {(() => {
          const isOpOver = opStats.totalOperadores > 0 && opStats.absPercent > activeMetaLimit;
          const isOpWarn =
            opStats.totalOperadores > 0 &&
            !isOpOver &&
            opStats.absPercent >= activeMetaLimit * 0.85;
          const diffPp = (opStats.absPercent - activeMetaLimit) * 100;
          return (
            <div
              className={`h-full text-white rounded-xl p-5 border flex flex-col justify-between transition-colors ${
                isOpOver
                  ? 'bg-rose-700 border-rose-900'
                  : isOpWarn
                  ? 'bg-amber-700 border-amber-900'
                  : 'bg-[#005059] border-[#003e45]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white/90">
                  ABS da Operação
                </span>
                {isOpOver ? (
                  <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0" />
                ) : (
                  <Target className="w-4 h-4 text-teal-200 shrink-0" />
                )}
              </div>
              <div className="my-4">
                <div className="text-3xl font-bold font-mono tabular-nums tracking-tight">
                  {formatPercent(opStats.absPercent)}
                </div>
                <p
                  className={`text-xs font-medium mt-1 ${
                    isOpOver
                      ? 'text-rose-100'
                      : isOpWarn
                      ? 'text-amber-100'
                      : 'text-teal-200'
                  }`}
                >
                  {opStats.totalOperadores === 0
                    ? 'Aguardando cadastro'
                    : isOpOver
                    ? `Limite excedido (+${diffPp.toFixed(2)} p.p.)`
                    : isOpWarn
                    ? `Próximo ao limite (${diffPp.toFixed(2)} p.p.)`
                    : `Dentro da meta (${diffPp.toFixed(2)} p.p.)`}
                </p>
              </div>
              <div className="pt-3 border-t border-white/15 text-xs font-mono tabular-nums text-white/85 flex items-center justify-between">
                <span>Meta ≤ {(activeMetaLimit * 100).toFixed(1)}%</span>
                <span>{opStats.minutosPerdidos.toLocaleString('pt-BR')} min perd.</span>
              </div>
            </div>
          );
        })()}

        {/* KPI 2: Colaboradores */}
        <div className="h-full bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Colaboradores Ativos
            </span>
            <Users className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf] shrink-0" />
          </div>
          <div className="my-4">
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {opStats.totalOperadores}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              Vinculados a {activeOp?.nome}
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Jornada padrão: {activeOp?.jornadaPadraoMin || 380} min/dia
          </div>
        </div>

        {/* KPI 3: Supervisores */}
        <div className="h-full bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Equipes de Supervisão
            </span>
            <UserCheck className="w-4 h-4 text-[#d89627] shrink-0" />
          </div>
          <div className="my-4">
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {activeSupervisors.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lideranças ativas na operação
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 truncate">
            {activeSupervisors.length > 0
              ? activeSupervisors.map(s => s.split(' ')[0]).join(' · ')
              : 'Nenhuma liderança cadastrada'}
          </div>
        </div>

        {/* KPI 4: Minutos Escalados */}
        <div className="h-full bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Minutos Escalados
            </span>
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="my-4">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {opStats.minutosEscalados.toLocaleString('pt-BR')} min
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
              ≈ {formatMinutesToHours(opStats.minutosEscalados)} de carga prevista
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Escala 6x1 CLT (36h semanais)
          </div>
        </div>
      </section>

      {/* Operation Settings: Monthly Absenteeism Targets (%) */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0 mt-0.5">
              <SlidersHorizontal className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Configurações da Operação · Metas Mensais de Absenteísmo (%)
                </h2>
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                    hasCustomMonthMeta
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {activeMonthLabel}: {(activeMetaLimit * 100).toFixed(1)}% ({hasCustomMonthMeta ? 'Meta do mês' : 'Padrão'})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Defina o limite padrão e metas específicas por mês. O painel WFM alerta automaticamente em vermelho quando a operação ou um supervisor ultrapassar a meta.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAnnualMetaGrid((prev) => !prev)}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf]" />
            <span>{showAnnualMetaGrid ? `Recolher Grade ${activeYear}` : `Configurar 12 Meses (${activeYear})`}</span>
            {showAnnualMetaGrid ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        <form onSubmit={handleSaveMonthlyGoalSettings} className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-3">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1 uppercase tracking-wide">
              Meta Padrão da Operação (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={defaultMetaInput}
                onChange={(e) => setDefaultMetaInput(e.target.value)}
                className="w-full h-10 pl-3 pr-8 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">%</span>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                Meta de {activeMonthLabel} (%)
              </label>
              {hasCustomMonthMeta && (
                <button
                  type="button"
                  onClick={handleResetActiveMonthMeta}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#006772] dark:text-slate-400 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Usar padrão</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={monthMetaInput}
                onChange={(e) => setMonthMetaInput(e.target.value)}
                className="w-full h-10 pl-3 pr-8 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">%</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['2.0', '2.5', '3.0', '3.5', '4.0', '5.0'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMonthMetaInput(preset)}
                  className={`h-8 px-2.5 text-[11px] font-mono font-semibold rounded-md border transition-colors cursor-pointer ${
                    parseFloat(monthMetaInput).toFixed(1) === preset
                      ? 'bg-[#006772] text-white border-[#006772]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="h-10 px-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg btn-press whitespace-nowrap cursor-pointer"
            >
              {metaSavedFlash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-200" />
                  <span>Meta Salva</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Salvar Metas</span>
                </>
              )}
            </button>
          </div>
        </form>

        {showAnnualMetaGrid && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Metas Mensais Específicas para {activeYear} (deixe em branco ou igual ao padrão para herdar {((activeOp?.metaAbs || 0.03) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {MONTH_NAMES_PT.map((mName, idx) => {
                const mk = formatMonthKey(activeYear, idx + 1);
                const customVal = activeOp?.monthlyMetas?.[mk];
                const isCustom = typeof customVal === 'number';
                const isCurrent = mk === activeMonthKey;
                return (
                  <div
                    key={mk}
                    className={`p-2.5 rounded-lg border ${
                      isCurrent
                        ? 'border-[#006772] dark:border-[#2dd4bf] bg-teal-50/40 dark:bg-teal-950/20'
                        : isCustom
                        ? 'border-amber-200 dark:border-amber-800/70 bg-amber-50/30 dark:bg-amber-950/15'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        {mName.slice(0, 3)}/{String(activeYear).slice(-2)}
                      </span>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleSetYearMonthMeta(mk, '')}
                          title="Voltar para meta padrão"
                          className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="50"
                        placeholder={((activeOp?.metaAbs || 0.03) * 100).toFixed(1)}
                        value={isCustom ? (customVal * 100).toFixed(1) : ''}
                        onChange={(e) => handleSetYearMonthMeta(mk, e.target.value)}
                        className="w-full h-8 pl-2 pr-6 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-[#006772]"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Symmetrical Supervisors Grid */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Supervisores da {activeOp?.nome}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeSupervisors.length} liderança(s) ativa(s) · Comparativo de absenteísmo ponderado por equipe
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddSupModalOpen(true)}
            className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Supervisor</span>
          </button>
        </div>

        {supervisorStatsList.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Operação em aberto · Nenhum supervisor cadastrado ainda em <strong>{activeOp?.nome}</strong>.
            </p>
            <button
              type="button"
              onClick={() => setIsAddSupModalOpen(true)}
              className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50/80 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Adicionar Primeiro Supervisor</span>
            </button>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {supervisorStatsList.map((sup) => {
              const metaLimit = activeMetaLimit;
              const isExceeded = sup.totalOperadores > 0 && sup.absPercent > metaLimit;
              const isWarning = sup.totalOperadores > 0 && !isExceeded && sup.absPercent >= metaLimit * 0.85;
              const barPct = Math.min(100, (sup.absPercent / (metaLimit * 2)) * 100);
              return (
                <div
                  key={sup.supervisor}
                  className={`h-full p-5 rounded-xl border border-t-[3px] flex flex-col justify-between hover-lift transition-colors ${
                    isExceeded
                      ? 'border-rose-200 dark:border-rose-900/60 border-t-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                      : isWarning
                      ? 'border-amber-200 dark:border-amber-900/60 border-t-amber-500 bg-amber-50/40 dark:bg-amber-950/15'
                      : 'border-slate-200 dark:border-slate-800 border-t-[#006772] dark:border-t-[#2dd4bf] bg-slate-50/60 dark:bg-slate-800/30'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {sup.supervisor}
                          </h3>
                          {isExceeded && (
                            <span
                              title={`Supervisor acima da meta de ${formatPercent(metaLimit)}`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shrink-0"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Alerta
                            </span>
                          )}
                          {isWarning && (
                            <span
                              title={`Supervisor próximo ao limite de ${formatPercent(metaLimit)}`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider shrink-0"
                            >
                              Atenção
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                          {sup.totalOperadores} colaborador(es)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenEditSupervisor(sup.supervisor, sup.totalOperadores)}
                        title="Editar nome deste supervisor"
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#006772] dark:hover:text-[#2dd4bf] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between gap-2">
                      <span
                        className={`text-2xl font-bold font-mono tabular-nums ${
                          isExceeded
                            ? 'text-rose-600 dark:text-rose-400'
                            : isWarning
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatPercent(sup.absPercent)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          isExceeded
                            ? 'text-rose-600 dark:text-rose-400'
                            : isWarning
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[#006772] dark:text-[#2dd4bf]'
                        }`}
                      >
                        {isExceeded
                          ? `Acima (+${((sup.absPercent - metaLimit) * 100).toFixed(2)} p.p.)`
                          : isWarning
                          ? 'Próximo ao limite'
                          : 'Dentro da meta'}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${barPct}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isExceeded
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-[#006772] dark:bg-[#2dd4bf]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Min. Perdidos</span>
                      <span className="font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                        {sup.minutosPerdidos.toLocaleString('pt-BR')} min
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 dark:text-slate-400 block">Min. Escalados</span>
                      <span className="font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {sup.minutosEscalados.toLocaleString('pt-BR')} min
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Operators List for Active Operation */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200/70 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Colaboradores da Operação
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              {filteredOperators.length} de {opOperators.length} operador(es) exibido(s)
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={opSearchTerm}
                onChange={(e) => setOpSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou horário..."
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
              />
            </div>

            <select
              value={selectedSupFilter}
              onChange={(e) => setSelectedSupFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
            >
              <option value="todos">Todos os Supervisores</option>
              {activeSupervisors.map(sup => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>

            {onOpenBulkImport && (
              <button
                type="button"
                onClick={onOpenBulkImport}
                className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Importar Planilha</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAddOperatorModal}
              className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Operador</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#005059] text-white font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Supervisor</th>
                <th className="py-3 px-3 text-center">Entrada</th>
                <th className="py-3 px-3 text-center">Saída</th>
                <th className="py-3 px-3 text-center">Jornada</th>
                <th className="py-3 px-4 text-right">Perdidos</th>
                <th className="py-3 px-4 text-right">Escalados</th>
                <th className="py-3 px-4 text-right bg-[#003e45]">ABS</th>
                <th className="py-3 px-4 text-center w-48">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 px-4 text-center text-slate-500 dark:text-slate-400">
                    {opOperators.length === 0 ? (
                      <div className="space-y-3">
                        <p>
                          Nenhum colaborador cadastrado ainda em <strong>{activeOp?.nome}</strong>.
                        </p>
                        <div className="flex items-center justify-center gap-2.5 flex-wrap">
                          <button
                            type="button"
                            onClick={handleOpenAddOperatorModal}
                            className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg transition-colors cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Adicionar Primeiro Operador</span>
                          </button>
                          {onOpenBulkImport && (
                            <button
                              type="button"
                              onClick={onOpenBulkImport}
                              className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Importar em Lote (Excel / CSV)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      'Nenhum colaborador encontrado nesta operação com os filtros aplicados.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op, idx) => {
                  const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
                  const st = calculateOperatorStats(data.dias, op.jornadaMin || activeOp?.jornadaPadraoMin || 380);
                  const isHigh = st.absMensal > activeMetaLimit;
                  const historyCount = operatorHistoryCounts[op.id] || 0;

                  return (
                    <tr
                      key={op.id}
                      className="h-11 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-center font-mono tabular-nums text-[11px] text-slate-400">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenProfile(op)}
                            title="Abrir perfil, histórico e escala pedagógica"
                            className="truncate text-left hover:text-[#006772] dark:hover:text-[#2dd4bf] hover:underline cursor-pointer"
                          >
                            {op.nome}
                          </button>
                          {historyCount > 0 && (
                            <span
                              title={`${historyCount} registro(s) no histórico`}
                              className="text-[11px] font-mono tabular-nums font-semibold text-amber-700 dark:text-amber-300 shrink-0"
                            >
                              ({historyCount})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        {op.supervisor}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {op.entrada}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {op.saida}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-[#006772] dark:text-[#2dd4bf] font-medium">
                        {op.jornadaMin}m
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        <span className={st.minutosPerdidos > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400'}>
                          {st.minutosPerdidos.toLocaleString('pt-BR')}m
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {st.minutosEscalados.toLocaleString('pt-BR')}m
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={
                          st.absMensal === 0
                            ? 'text-[#006772] dark:text-[#2dd4bf]'
                            : isHigh
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-[#d89627] dark:text-amber-400'
                        }>
                          {formatPercent(st.absMensal)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenEditOperator(op)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Editar nome e horário do operador"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenProfile(op)}
                            className="w-7 h-7 flex items-center justify-center text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition-colors cursor-pointer"
                            title="Perfil, Histórico e Escala Pedagógica"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenTransfer(op)}
                            className="w-7 h-7 flex items-center justify-center text-[#006772] dark:text-[#2dd4bf] hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-md transition-colors cursor-pointer"
                            title="Transferir operador para outro supervisor"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectOperatorForAudit(op.id)}
                            className="h-7 px-2.5 text-[11px] font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                            title="Abrir folha mensal deste operador"
                          >
                            <span>Apontar</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDelete(op)}
                            className="w-7 h-7 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                            title="Excluir operador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Criar Nova Operação */}
      {isAddOpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#006772]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cadastrar Nova Operação
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOperation} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Nome da Operação:
                </label>
                <input
                  type="text"
                  required
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  placeholder="Ex: Operação Neoenergia / Operação SAC"
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Cliente / Contratante:
                </label>
                <input
                  type="text"
                  value={newOpClient}
                  onChange={(e) => setNewOpClient(e.target.value)}
                  placeholder="Ex: Grupo Neoenergia"
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                    Meta ABS (%):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="20"
                    value={newOpMetaAbs}
                    onChange={(e) => setNewOpMetaAbs(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Padrão 3.0%</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                    Jornada Diária (min):
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="600"
                    value={newOpJornada}
                    onChange={(e) => setNewOpJornada(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">380 min (6h20)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wide">
                  Imagem / Logo da Operação:
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {newOpLogoUrl ? (
                        <img
                          src={newOpLogoUrl}
                          alt="Prévia da logo"
                          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Fazer Upload da Imagem</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoFileChange(e, 'new')}
                          className="hidden"
                        />
                      </label>
                      {newOpLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setNewOpLogoUrl('')}
                          className="px-2.5 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newOpLogoUrl}
                    onChange={(e) => setNewOpLogoUrl(e.target.value)}
                    placeholder="Ou cole a URL/caminho da imagem (ex: /assets/aistudio/image_def6497f.png)"
                    className="w-full h-9 px-3 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                  {uploadError && (
                    <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Descrição Operacional:
                </label>
                <textarea
                  rows={2}
                  value={newOpDesc}
                  onChange={(e) => setNewOpDesc(e.target.value)}
                  placeholder="Informações e objetivos desta operação..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Operação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Operação */}
      {isEditOpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#006772]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Editar Operação: {activeOp?.nome}
                </h3>
              </div>
              <button
                onClick={() => setIsEditOpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Nome da Operação:
                </label>
                <input
                  type="text"
                  required
                  value={editOpName}
                  onChange={(e) => setEditOpName(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Cliente:
                </label>
                <input
                  type="text"
                  value={editOpClient}
                  onChange={(e) => setEditOpClient(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Meta ABS (%):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20"
                  value={editOpMetaAbs}
                  onChange={(e) => setEditOpMetaAbs(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wide">
                  Imagem / Logo da Operação:
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      {editOpLogoUrl ? (
                        <img
                          src={editOpLogoUrl}
                          alt="Logo da operação"
                          referrerPolicy="no-referrer"
                          className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-[#006772]" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Fazer Upload da Imagem</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoFileChange(e, 'edit')}
                          className="hidden"
                        />
                      </label>
                      {editOpLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditOpLogoUrl('')}
                          className="px-2.5 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                        >
                          Usar Padrão
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editOpLogoUrl}
                    onChange={(e) => setEditOpLogoUrl(e.target.value)}
                    placeholder="Ou cole a URL/caminho da imagem..."
                    className="w-full h-9 px-3 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                  {uploadError && (
                    <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Descrição:
                </label>
                <textarea
                  rows={2}
                  value={editOpDesc}
                  onChange={(e) => setEditOpDesc(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={operations.length <= 1}
                  onClick={() => {
                    setIsEditOpModalOpen(false);
                    setIsDeleteOpConfirmOpen(true);
                  }}
                  title={
                    operations.length <= 1
                      ? 'Não é possível excluir a única operação restante'
                      : 'Excluir esta operação'
                  }
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Operação</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Operação */}
      {isDeleteOpConfirmOpen && activeOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 animate-backdrop-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-100 dark:border-rose-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  Confirmar Exclusão da Operação
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteOpConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Você está prestes a excluir permanentemente esta operação, junto com seus supervisores, operadores vinculados e histórico de apontamentos:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-white p-1 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center overflow-hidden">
                  {activeOp.logoUrl ? (
                    <img
                      src={activeOp.logoUrl}
                      alt={activeOp.nome}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-md"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-[#006772]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {activeOp.nome}
                  </div>
                  <div className="text-xs text-slate-500">
                    {opOperators.length} operador(es) · {activeSupervisors.length} supervisor(es)
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteOperation(activeOp.id);
                    setIsDeleteOpConfirmOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar Exclusão</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Supervisor */}
      {isAddSupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#006772]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Adicionar Supervisor à {activeOp?.nome}
                </h3>
              </div>
              <button
                onClick={() => setIsAddSupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupervisor} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Nome Completo do Supervisor:
                </label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder="Ex: FERNANDA ALVES PEREIRA"
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSupModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Supervisor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Operador na Operação */}
      {isAddOperatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#006772]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Adicionar Operador na {activeOp?.nome}
                </h3>
              </div>
              <button
                onClick={() => setIsAddOperatorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOperator} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Nome Completo do Operador:
                </label>
                <input
                  type="text"
                  required
                  value={newOpOperatorName}
                  onChange={(e) => setNewOpOperatorName(e.target.value)}
                  placeholder="Ex: CARLOS EDUARDO DA SILVA"
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 uppercase"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Supervisor Responsável:
                  </label>
                  {activeSupervisors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsNewOpOperatorCustomSup(!isNewOpOperatorCustomSup)}
                      className="text-[11px] text-[#006772] dark:text-[#2dd4bf] hover:underline font-medium cursor-pointer"
                    >
                      {isNewOpOperatorCustomSup ? 'Selecionar da Lista' : '+ Novo Supervisor'}
                    </button>
                  )}
                </div>
                {isNewOpOperatorCustomSup || activeSupervisors.length === 0 ? (
                  <input
                    type="text"
                    required
                    value={newOpOperatorCustomSup}
                    onChange={(e) => setNewOpOperatorCustomSup(e.target.value)}
                    placeholder="Digite o nome do supervisor (Ex: FERNANDA ALVES PEREIRA)"
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 uppercase"
                  />
                ) : (
                  <select
                    value={newOpOperatorSup}
                    onChange={(e) => setNewOpOperatorSup(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 cursor-pointer"
                  >
                    {activeSupervisors.map(sup => (
                      <option key={sup} value={sup}>
                        {sup}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                    Horário Entrada:
                  </label>
                  <input
                    type="text"
                    required
                    value={newOpOperatorEntrada}
                    onChange={(e) => setNewOpOperatorEntrada(e.target.value)}
                    placeholder="08:00:00"
                    className="w-full h-10 px-3 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                    Horário Saída:
                  </label>
                  <input
                    type="text"
                    required
                    value={newOpOperatorSaida}
                    onChange={(e) => setNewOpOperatorSaida(e.target.value)}
                    placeholder="14:20:00"
                    className="w-full h-10 px-3 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Jornada Diária (Minutos):
                </label>
                <input
                  type="number"
                  min="60"
                  max="600"
                  value={newOpOperatorJornada}
                  onChange={(e) => setNewOpOperatorJornada(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOperatorModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cadastrar Operador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
