import React, { useState, useMemo } from 'react';
import { Operation, Operator, OperatorMonthlyData, StatusType, DayRecord } from '../types/abs';
import { calculateOperatorStats, calculateSupervisorStats, formatMinutesToHours, formatPercent } from '../utils/calculations';
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
  Clock,
  UserPlus,
  FolderPlus,
  Sparkles,
  Layers
} from 'lucide-react';

interface OperacoesViewProps {
  operations: Operation[];
  selectedOperationId: string;
  onSelectOperation: (id: string) => void;
  onAddOperation: (op: Omit<Operation, 'id'>) => void;
  onUpdateOperation: (op: Operation) => void;
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  onAddSupervisorToOperation: (operationId: string, supervisorName: string) => void;
  onAddOperatorToOperation: (opData: Omit<Operator, 'id'>) => void;
  onSelectOperatorForAudit: (operatorId: string) => void;
}

export const OperacoesView: React.FC<OperacoesViewProps> = ({
  operations,
  selectedOperationId,
  onSelectOperation,
  onAddOperation,
  onUpdateOperation,
  operators,
  monthlyData,
  onAddSupervisorToOperation,
  onAddOperatorToOperation,
  onSelectOperatorForAudit
}) => {
  // Modal states
  const [isAddOpModalOpen, setIsAddOpModalOpen] = useState(false);
  const [isEditOpModalOpen, setIsEditOpModalOpen] = useState(false);
  const [isAddSupModalOpen, setIsAddSupModalOpen] = useState(false);
  const [isAddOperatorModalOpen, setIsAddOperatorModalOpen] = useState(false);

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
  const [newOpOperatorEntrada, setNewOpOperatorEntrada] = useState('08:00:00');
  const [newOpOperatorSaida, setNewOpOperatorSaida] = useState('14:20:00');
  const [newOpOperatorJornada, setNewOpOperatorJornada] = useState('380');

  // Currently active operation
  const activeOp = useMemo(() => {
    return operations.find(o => o.id === selectedOperationId) || operations[0];
  }, [operations, selectedOperationId]);

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

  // Open edit modal prefilled
  const handleOpenEdit = () => {
    if (!activeOp) return;
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
      logoUrl: editOpLogoUrl.trim() || activeOp.logoUrl,
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

  // Submit new operator
  const handleCreateOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpOperatorName.trim() || !activeOp) return;
    const chosenSupervisor = newOpOperatorSup || activeSupervisors[0] || 'SUPERVISÃO GERAL';
    onAddOperatorToOperation({
      nome: newOpOperatorName.trim().toUpperCase(),
      supervisor: chosenSupervisor,
      entrada: newOpOperatorEntrada.trim(),
      saida: newOpOperatorSaida.trim(),
      jornadaMin: parseInt(newOpOperatorJornada) || 380,
      offDayOfWeek: 1,
      operacaoId: activeOp.id
    });
    setNewOpOperatorName('');
    setIsAddOperatorModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with JSD Branding & Operation Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 p-1.5 shadow-sm shrink-0 flex items-center justify-center">
              <img
                src={activeOp?.logoUrl || '/assets/aistudio/image_def6497f.png'}
                alt={activeOp?.nome || 'Operação'}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#006772] dark:text-[#2dd4bf] font-mono">
                  GESTÃO DE OPERAÇÕES · JSD TELECOM
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-[#d89627] border border-amber-300 dark:border-amber-700 font-mono">
                  Meta ABS: ≤ {((activeOp?.metaAbs || 0.03) * 100).toFixed(1)}%
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                {activeOp?.nome || 'Operação CAERN'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {activeOp?.descricao || 'Operação oficial de atendimento ao cliente com controle automatizado de ausências e escalas.'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar Operação</span>
            </button>

            <button
              onClick={() => setIsAddSupModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#006772] dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 rounded-xl transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#006772]" />
              <span>+ Adicionar Supervisor</span>
            </button>

            <button
              onClick={() => {
                setNewOpOperatorSup(activeSupervisors[0] || '');
                setIsAddOperatorModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Adicionar Operador</span>
            </button>

            <button
              onClick={() => setIsAddOpModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#d89627] hover:bg-[#b37718] rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Operação</span>
            </button>
          </div>

        </div>

        {/* Operation Selector Tabs */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide shrink-0 mr-2 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#006772]" />
            Operações:
          </span>
          {operations.map(op => {
            const isSelected = op.id === selectedOperationId;
            return (
              <button
                key={op.id}
                onClick={() => onSelectOperation(op.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#006772] text-white border-[#006772] shadow-sm font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {op.logoUrl && (
                  <img
                    src={op.logoUrl}
                    alt={op.nome}
                    className="w-5 h-5 object-contain rounded bg-white p-0.5"
                  />
                )}
                <span>{op.nome}</span>
                {isSelected && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-teal-100">
                    Ativa
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Core Metrics Cards for Active Operation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: ABS Consolidado da Operação */}
        <div className="bg-gradient-to-br from-[#006772] via-[#005059] to-[#00383f] text-white rounded-2xl p-5 shadow-sm border border-[#004e57] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
              ABS da Operação
            </span>
            <Target className="w-4 h-4 text-teal-200" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-mono tabular-nums tracking-tight">
              {formatPercent(opStats.absPercent)}
            </div>
            <span className={`text-[11px] font-semibold mt-1 block ${
              opStats.absPercent <= (activeOp?.metaAbs || 0.03) ? 'text-teal-200' : 'text-[#d89627]'
            }`}>
              {opStats.absPercent <= (activeOp?.metaAbs || 0.03)
                ? '✓ Dentro da Meta Contratual'
                : '⚠ Acima do Teto de Tolerância'}
            </span>
          </div>
          <div className="pt-3 border-t border-white/15 text-[11px] font-mono text-teal-300/90 flex justify-between">
            <span>Meta: ≤ {((activeOp?.metaAbs || 0.03) * 100).toFixed(1)}%</span>
            <span>Perdidos: {opStats.minutosPerdidos}m</span>
          </div>
        </div>

        {/* KPI 2: Total de Colaboradores */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Colaboradores
            </span>
            <Users className="w-4 h-4 text-[#006772]" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {opStats.totalOperadores}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Operadores vinculados a {activeOp?.nome}
            </span>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
            Jornada diária padrão: {activeOp?.jornadaPadraoMin || 380} min
          </div>
        </div>

        {/* KPI 3: Supervisores Ativos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Supervisores
            </span>
            <UserCheck className="w-4 h-4 text-[#d89627]" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {activeSupervisors.length}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Lideranças ativas na operação
            </span>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            {activeSupervisors.slice(0, 2).map(s => s.split(' ')[0]).join(', ')}
            {activeSupervisors.length > 2 ? ` +${activeSupervisors.length - 2}` : ''}
          </div>
        </div>

        {/* KPI 4: Minutos Escalados Mês */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Minutos Escalados
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
              {opStats.minutosEscalados.toLocaleString('pt-BR')} min
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              ≈ {formatMinutesToHours(opStats.minutosEscalados)} de escala ativa
            </span>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
            Escala contratual 6x1 (folgas FDS flexíveis por mês)
          </div>
        </div>

      </div>

      {/* Supervisors Grid in Active Operation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#006772] dark:text-[#2dd4bf]">
                EQUIPES DE SUPERVISÃO
              </span>
              <span className="text-[10px] bg-teal-50 dark:bg-teal-950/60 text-[#006772] dark:text-teal-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {activeSupervisors.length} lideranças
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Supervisores da {activeOp?.nome}
            </h3>
          </div>

          <button
            onClick={() => setIsAddSupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#006772] dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Supervisor</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supervisorStatsList.map((sup) => {
            const isWithinMeta = sup.absPercent <= (activeOp?.metaAbs || 0.03);
            return (
              <div
                key={sup.supervisor}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-[#006772]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Supervisão
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isWithinMeta
                        ? 'bg-teal-100 text-[#006772] dark:bg-teal-950/80 dark:text-teal-300'
                        : 'bg-amber-100 text-[#d89627] dark:bg-amber-950/80'
                    }`}>
                      {isWithinMeta ? '✓ Na Meta' : '⚠ Acima'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {sup.supervisor}
                  </h4>
                  <span className="text-xs text-slate-500 block">
                    {sup.totalOperadores} colaboradores vinculados
                  </span>

                  <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        ABS da Supervisão
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Meta ≤ {((activeOp?.metaAbs || 0.03) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-[#006772] dark:text-[#2dd4bf] tabular-nums mt-0.5">
                      {formatPercent(sup.absPercent)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Perdidos</span>
                    <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                      {sup.minutosPerdidos.toLocaleString('pt-BR')} min
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Escalados</span>
                    <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                      {sup.minutosEscalados.toLocaleString('pt-BR')} min
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operators List for Active Operation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {/* Controls Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#006772] dark:text-[#2dd4bf]">
                COLABORADORES DA OPERAÇÃO
              </span>
              <span className="text-[10px] bg-teal-50 dark:bg-teal-950/60 text-[#006772] dark:text-teal-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {filteredOperators.length} listados
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Escala e Apontamento Individual
            </h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={opSearchTerm}
                onChange={(e) => setOpSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou horário..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
              />
            </div>

            {/* Filter by Supervisor */}
            <select
              value={selectedSupFilter}
              onChange={(e) => setSelectedSupFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
            >
              <option value="todos">Todos os Supervisores</option>
              {activeSupervisors.map(sup => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setNewOpOperatorSup(activeSupervisors[0] || '');
                setIsAddOperatorModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Operador</span>
            </button>
          </div>
        </div>

        {/* Operators Table */}
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#005059] text-white font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Supervisor</th>
                <th className="py-3 px-3 text-center">Entrada</th>
                <th className="py-3 px-3 text-center">Saída</th>
                <th className="py-3 px-3 text-center">Jornada</th>
                <th className="py-3 px-4 text-right">Min. Perdidos</th>
                <th className="py-3 px-4 text-right">Min. Escalados</th>
                <th className="py-3 px-4 text-center bg-[#00383f]">ABS Mensal</th>
                <th className="py-3 px-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Nenhum colaborador encontrado nesta operação com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op, idx) => {
                  const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
                  const st = calculateOperatorStats(data.dias, op.jornadaMin || activeOp?.jornadaPadraoMin || 380);
                  const isHigh = st.absMensal > (activeOp?.metaAbs || 0.03);

                  return (
                    <tr
                      key={op.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono w-5">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="truncate">{op.nome}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                        {op.supervisor}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {op.entrada}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {op.saida}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[#006772] dark:text-[#2dd4bf] font-medium">
                        {op.jornadaMin}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        <span className={st.minutosPerdidos > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                          {st.minutosPerdidos.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {st.minutosEscalados.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold tabular-nums">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                          st.absMensal === 0
                            ? 'text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/40 font-bold'
                            : isHigh
                            ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 font-extrabold'
                            : 'text-[#d89627] dark:text-[#f0ad35] bg-amber-50 dark:bg-amber-950/40 font-bold'
                        }`}>
                          {formatPercent(st.absMensal)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onSelectOperatorForAudit(op.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          title="Abrir folha mensal deste operador"
                        >
                          <span>Apontar</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal: Criar Nova Operação */}
      {isAddOpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  URL da Logo (ou Caminho da Imagem):
                </label>
                <input
                  type="text"
                  value={newOpLogoUrl}
                  onChange={(e) => setNewOpLogoUrl(e.target.value)}
                  placeholder="Ex: /assets/aistudio/image_def6497f.png"
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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
                    value={editOpMetaAbs}
                    onChange={(e) => setEditOpMetaAbs(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                    URL da Logo:
                  </label>
                  <input
                    type="text"
                    value={editOpLogoUrl}
                    onChange={(e) => setEditOpLogoUrl(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                  />
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Supervisor */}
      {isAddSupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wide">
                  Supervisor Responsável:
                </label>
                <select
                  value={newOpOperatorSup}
                  onChange={(e) => setNewOpOperatorSup(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30 cursor-pointer"
                >
                  {activeSupervisors.length === 0 ? (
                    <option value="SUPERVISÃO GERAL">SUPERVISÃO GERAL</option>
                  ) : (
                    activeSupervisors.map(sup => (
                      <option key={sup} value={sup}>
                        {sup}
                      </option>
                    ))
                  )}
                </select>
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
