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
  Trash2
} from 'lucide-react';

interface OperatorsListViewProps {
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  onSelectOperatorForAudit: (operatorId: string) => void;
  onAddOperator: () => void;
  onOpenProfile: (operator: Operator) => void;
  onOpenTransfer: (operator: Operator) => void;
  onOpenDelete: (operator: Operator) => void;
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
    <div className="space-y-5">
      
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#006772] dark:text-[#2dd4bf]">
              Aba 1: Cadastro &amp; Consolidação (OPERADORES)
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Relação dos {operators.length} Operadores &amp; Escalas Contratuais
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fórmulas ativas com cálculo em minutos de jornada (380 min) e índice de absenteísmo mensal consolidado.
            </p>
          </div>

          {/* Quick Metrics Bar & Add Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onAddOperator}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Adicionar Operador</span>
            </button>

            <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 px-3 py-1.5 rounded-lg text-center">
              <span className="text-[10px] font-bold text-[#006772] dark:text-teal-300 uppercase block">
                Operadores
              </span>
              <span className="text-base font-bold font-mono text-[#005059] dark:text-teal-100">
                {aggregateStats.totalCount} / {operators.length}
              </span>
            </div>

            <div className="bg-[#005059] text-white px-3.5 py-1.5 rounded-lg text-center">
              <span className="text-[10px] font-bold text-teal-200 uppercase block">
                ABS Médio
              </span>
              <span className="text-base font-extrabold font-mono text-white">
                {formatPercent(aggregateStats.avgAbs)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar operador ou horário..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
            />
          </div>

          {/* Supervisor Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedSupervisor('todos')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedSupervisor === 'todos'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos Supervisores
            </button>
            {supervisorsList.map((sup) => (
              <button
                key={sup}
                onClick={() => setSelectedSupervisor(sup)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedSupervisor.toLowerCase() === sup.toLowerCase()
                    ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {sup.split(' ')[0]} ({sup.split(' ')[1] || ''})
              </button>
            ))}
          </div>

          {/* ABS Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">ABS:</span>
            <select
              value={absFilter}
              onChange={(e) => setAbsFilter(e.target.value as any)}
              className="py-1 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="todos">Todos os índices</option>
              <option value="zero">0% (Sem faltas/atrasos)</option>
              <option value="baixo">≤ 3.00% (Baixo / Na Meta)</option>
              <option value="critico">&gt; 3.00% (Atenção / Acima da Meta)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#005059] text-white font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleToggleSort('nome')}
                  className="py-3 px-4 cursor-pointer hover:bg-[#00383f] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>OPERADOR (A)</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('supervisor')}
                  className="py-3 px-4 cursor-pointer hover:bg-[#00383f] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SUPERVISOR (B)</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('entrada')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-[#00383f] transition-colors select-none w-28"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>ENTRADA (C)</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28">
                  SAÍDA (D)
                </th>
                <th className="py-3 px-3 text-center w-24">
                  JORNADA (E)
                </th>
                <th
                  onClick={() => handleToggleSort('minutosPerdidos')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-[#00383f] transition-colors select-none w-32"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>PERDIDOS (F)</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('minutosEscalados')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-[#00383f] transition-colors select-none w-32"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>ESCALADOS (G)</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-200" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('absMensal')}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-[#00383f] transition-colors select-none w-32 bg-[#00383f]"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>ABS MENSAL (H)</span>
                    <ArrowUpDown className="w-3 h-3 text-teal-100" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-48">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {sortedOperators.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
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
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      {/* Operador */}
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono w-5 shrink-0">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
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
                              className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0"
                            >
                              {historyCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Supervisor */}
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                        {op.supervisor}
                      </td>

                      {/* Entrada */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {op.entrada}
                      </td>

                      {/* Saída */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {op.saida}
                      </td>

                      {/* Jornada */}
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-[#006772] dark:text-[#2dd4bf]">
                        {op.jornadaMin}
                      </td>

                      {/* Minutos Perdidos */}
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        <span
                          className={
                            op.stats.minutosPerdidos > 0
                              ? 'text-rose-700 dark:text-rose-400 font-bold'
                              : 'text-slate-500 dark:text-slate-400'
                          }
                        >
                          {op.stats.minutosPerdidos.toLocaleString('pt-BR')}
                        </span>
                      </td>

                      {/* Minutos Escalados */}
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {op.stats.minutosEscalados.toLocaleString('pt-BR')}
                      </td>

                      {/* ABS Mensal */}
                      <td className="py-2.5 px-4 text-center font-mono font-bold tabular-nums">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            isZeroAbs
                              ? 'text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/40 font-bold'
                              : isHighAbs
                              ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 font-extrabold'
                              : 'text-[#d89627] dark:text-[#f0ad35] bg-amber-50 dark:bg-amber-950/40 font-bold'
                          }`}
                        >
                          {formatPercent(op.stats.absMensal)}
                        </span>
                      </td>

                      {/* Ações: Perfil, Transferir, Apontar, Excluir */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenProfile(op)}
                            className="p-1.5 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded transition-colors cursor-pointer"
                            title="Perfil, Histórico e Escala Pedagógica"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenTransfer(op)}
                            className="p-1.5 text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded transition-colors cursor-pointer"
                            title="Transferir operador para outro supervisor"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectOperatorForAudit(op.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Abrir apontamento diário deste operador"
                          >
                            <span>Apontar</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDelete(op)}
                            className="p-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded transition-colors cursor-pointer"
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
            {/* Table Footer */}
            <tfoot className="bg-slate-100 dark:bg-slate-800/80 font-bold text-xs">
              <tr>
                <td colSpan={5} className="py-3 px-4 text-slate-800 dark:text-slate-200">
                  TOTAL CONSOLIDADO ({aggregateStats.totalCount} colaboradores exibidos)
                </td>
                <td className="py-3 px-4 text-right font-mono text-rose-700 dark:text-rose-400">
                  {aggregateStats.perdidos.toLocaleString('pt-BR')} min
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-200">
                  {aggregateStats.escalados.toLocaleString('pt-BR')} min
                </td>
                <td className="py-3 px-4 text-center font-mono text-[#006772] dark:text-[#2dd4bf] text-sm font-extrabold">
                  {formatPercent(aggregateStats.avgAbs)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
