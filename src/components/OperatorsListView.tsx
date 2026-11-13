import React, { useState, useMemo } from 'react';
import { Operator, OperatorMonthlyData } from '../types/abs';
import { SUPERVISORES_LIST } from '../data/initialData';
import {
  calculateOperatorStats,
  formatMinutesToHours,
  formatPercent
} from '../utils/calculations';
import {
  Search,
  ArrowUpDown,
  ExternalLink,
  Users,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserPlus,
  ClipboardList,
  ArrowRightLeft,
  Trash2,
  Edit2,
  Eraser
} from 'lucide-react';

interface OperatorsListViewProps {
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  onSelectOperatorForAudit: (operatorId: string) => void;
  onAddOperator: () => void;
  onOpenProfile: (operator: Operator) => void;
  onOpenTransfer: (operator: Operator) => void;
  onOpenDelete: (operator: Operator) => void;
  onOpenEditOperator: (operator: Operator) => void;
  onOpenEditSupervisor?: (supervisorName: string, linkedCount: number) => void;
  onClearMonthAbs?: () => void;
  operatorHistoryCounts?: Record<string, number>;
}

type SortField = 'nome' | 'supervisor' | 'entrada' | 'minutosPerdidos' | 'minutosEscalados' | 'absMensal';

export const OperatorsListView: React.FC<OperatorsListViewProps> = ({
  operators,
  monthlyData,
  onSelectOperatorForAudit,
  onAddOperator,
  onOpenProfile,
  onOpenTransfer,
  onOpenDelete,
  onOpenEditOperator,
  onOpenEditSupervisor,
  onClearMonthAbs,
  operatorHistoryCounts = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('todos');
  const [absFilter, setAbsFilter] = useState<'todos' | 'zero' | 'baixo' | 'critico'>('todos');
  const [sortField, setSortField] = useState<SortField>('absMensal');
  const [sortAsc, setSortAsc] = useState(false);

  // Dynamic unique supervisor list based on current operators
  const supervisorsList = useMemo(() => {
    const set = new Set<string>();
    operators.forEach(op => {
      if (op.supervisor) set.add(op.supervisor);
    });
    return Array.from(set);
  }, [operators]);

  // Calculate live stats for each operator
  const operatorsWithStats = useMemo(() => {
    return operators.map(op => {
      const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
      const stats = calculateOperatorStats(data.dias, op.jornadaMin);
      return {
        ...op,
        stats
      };
    });
  }, [operators, monthlyData]);

  // Filtering
  const filteredOperators = useMemo(() => {
    return operatorsWithStats.filter(op => {
      const matchSearch =
        op.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.supervisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.entrada.includes(searchTerm);

      const matchSupervisor =
        selectedSupervisor === 'todos' ||
        op.supervisor.toLowerCase() === selectedSupervisor.toLowerCase();

      let matchAbs = true;
      if (absFilter === 'zero') {
        matchAbs = op.stats.absMensal === 0;
      } else if (absFilter === 'baixo') {
        matchAbs = op.stats.absMensal > 0 && op.stats.absMensal <= 0.03;
      } else if (absFilter === 'critico') {
        matchAbs = op.stats.absMensal > 0.03;
      }

      return matchSearch && matchSupervisor && matchAbs;
    });
  }, [operatorsWithStats, searchTerm, selectedSupervisor, absFilter]);

  // Sorting
  const sortedOperators = useMemo(() => {
    return [...filteredOperators].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortField) {
        case 'nome':
          valA = a.nome;
          valB = b.nome;
          break;
        case 'supervisor':
          valA = a.supervisor;
          valB = b.supervisor;
          break;
        case 'entrada':
          valA = a.entrada;
          valB = b.entrada;
          break;
        case 'minutosPerdidos':
          valA = a.stats.minutosPerdidos;
          valB = b.stats.minutosPerdidos;
          break;
        case 'minutosEscalados':
          valA = a.stats.minutosEscalados;
          valB = b.stats.minutosEscalados;
          break;
        case 'absMensal':
        default:
          valA = a.stats.absMensal;
          valB = b.stats.absMensal;
          break;
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredOperators, sortField, sortAsc]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'nome' || field === 'supervisor' || field === 'entrada');
    }
  };

  // Aggregate stats of displayed operators
  const aggregateStats = useMemo(() => {
    let perdidos = 0;
    let escalados = 0;
    sortedOperators.forEach(o => {
      perdidos += o.stats.minutosPerdidos;
      escalados += o.stats.minutosEscalados;
    });
    const avgAbs = escalados > 0 ? perdidos / escalados : 0;
    return {
      totalCount: sortedOperators.length,
      perdidos,
      escalados,
      avgAbs
    };
  }, [sortedOperators]);

  return (
    <div className="space-y-6">

      {/* Header & Filter Bar */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Cadastro e Escalas de Operadores
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {operators.length} colaborador(es) cadastrado(s) · Cálculo consolidado de minutos escalados, perdidos e ABS individual
            </p>
          </div>

          <div className="flex items-center gap-5 flex-wrap shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Exibidos</span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {aggregateStats.totalCount} / {operators.length}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">ABS Médio</span>
              <span className="text-base font-bold font-mono tabular-nums text-[#006772] dark:text-[#2dd4bf]">
                {formatPercent(aggregateStats.avgAbs)}
              </span>
            </div>

            {onClearMonthAbs && (
              <button
                type="button"
                onClick={onClearMonthAbs}
                title="Limpar todas as ocorrências e zerar o ABS de todos os operadores neste mês"
                className="h-9 px-3.5 flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 rounded-lg btn-press whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Zerar ABS do Mês</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAddOperator}
              className="h-9 px-4 flex items-center gap-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg btn-press whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Adicionar Operador</span>
            </button>
          </div>
        </div>

        {/* Symmetrical Filter Row */}
        <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar operador, supervisor ou horário..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedSupervisor('todos')}
              className={`h-7 px-3 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedSupervisor === 'todos'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            {supervisorsList.map((sup) => (
              <button
                key={sup}
                type="button"
                onClick={() => setSelectedSupervisor(sup)}
                className={`h-7 px-3 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedSupervisor.toLowerCase() === sup.toLowerCase()
                    ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {sup.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>

          <select
            value={absFilter}
            onChange={(e) => setAbsFilter(e.target.value as any)}
            aria-label="Filtrar por faixa de ABS"
            className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
          >
            <option value="todos">Todos os índices de ABS</option>
            <option value="zero">0.00% (Sem faltas ou atrasos)</option>
            <option value="baixo">≤ 3.00% (Dentro da meta)</option>
            <option value="critico">&gt; 3.00% (Acima da meta)</option>
          </select>
        </div>
      </section>

      {/* Main Table */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#005059] text-white font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th
                  onClick={() => handleToggleSort('nome')}
                  className="py-3 px-4 cursor-pointer hover:bg-[#003e45] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Operador</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('supervisor')}
                  className="py-3 px-4 cursor-pointer hover:bg-[#003e45] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Supervisor</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('entrada')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-[#003e45] transition-colors select-none w-24"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Entrada</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-24">
                  Saída
                </th>
                <th className="py-3 px-3 text-center w-24">
                  Jornada
                </th>
                <th
                  onClick={() => handleToggleSort('minutosPerdidos')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-[#003e45] transition-colors select-none w-28"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Perdidos</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('minutosEscalados')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-[#003e45] transition-colors select-none w-28"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Escalados</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('absMensal')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-[#003036] transition-colors select-none w-28 bg-[#003e45]"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>ABS</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-100" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center w-48">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {sortedOperators.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-500 dark:text-slate-400">
                    Nenhum operador encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                sortedOperators.map((op, idx) => {
                  const isHighAbs = op.stats.absMensal > 0.03;
                  const isZeroAbs = op.stats.absMensal === 0;
                  const historyCount = operatorHistoryCounts[op.id] || 0;

                  return (
                    <tr
                      key={op.id}
                      className="h-11 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
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
                              title={`${historyCount} registro(s) no histórico do perfil`}
                              className="text-[11px] font-mono tabular-nums font-semibold text-amber-700 dark:text-amber-300 shrink-0"
                            >
                              ({historyCount})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{op.supervisor}</span>
                          {onOpenEditSupervisor && (
                            <button
                              type="button"
                              onClick={() => {
                                const count = operators.filter(
                                  o => o.supervisor.toLowerCase() === op.supervisor.toLowerCase()
                                ).length;
                                onOpenEditSupervisor(op.supervisor, count);
                              }}
                              title="Editar nome deste supervisor"
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#006772] dark:hover:text-[#2dd4bf] rounded transition-opacity cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {op.entrada}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {op.saida}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono tabular-nums font-medium text-[#006772] dark:text-[#2dd4bf]">
                        {op.jornadaMin}m
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        <span
                          className={
                            op.stats.minutosPerdidos > 0
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-slate-400'
                          }
                        >
                          {op.stats.minutosPerdidos.toLocaleString('pt-BR')}m
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {op.stats.minutosEscalados.toLocaleString('pt-BR')}m
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            isZeroAbs
                              ? 'text-[#006772] dark:text-[#2dd4bf]'
                              : isHighAbs
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-[#d89627] dark:text-amber-400'
                          }
                        >
                          {formatPercent(op.stats.absMensal)}
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
                            title="Abrir apontamento diário deste operador"
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
            <tfoot className="bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 font-bold text-xs">
              <tr>
                <td colSpan={6} className="py-3 px-4 text-slate-700 dark:text-slate-200">
                  Total Consolidado ({aggregateStats.totalCount} colaboradores)
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  {aggregateStats.perdidos.toLocaleString('pt-BR')}m
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                  {aggregateStats.escalados.toLocaleString('pt-BR')}m
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#006772] dark:text-[#2dd4bf] font-extrabold">
                  {formatPercent(aggregateStats.avgAbs)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

    </div>
  );
};
