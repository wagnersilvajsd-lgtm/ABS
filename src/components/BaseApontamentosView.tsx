import React, { useState, useMemo } from 'react';
import { Operator, OperatorMonthlyData, StatusType, DayRecord } from '../types/abs';
import { STATUS_OPTIONS } from '../data/initialData';
import { formatMonthLabel, getDaysInMonth, getWeekdayAbbr, isWeekendDate, parseMonthKey } from '../utils/calendar';
import { calculateOperatorStats, formatPercent } from '../utils/calculations';
import { Search, Filter, Calendar, Edit3, X, Check } from 'lucide-react';

interface BaseApontamentosViewProps {
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  onUpdateDays: (operatorId: string, dias: DayRecord[]) => void;
  onSelectOperatorForAudit: (operatorId: string) => void;
  selectedMonthKey: string;
}

export const BaseApontamentosView: React.FC<BaseApontamentosViewProps> = ({
  operators,
  monthlyData,
  onUpdateDays,
  onSelectOperatorForAudit,
  selectedMonthKey
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const totalDays = getDaysInMonth(year, month);
  const monthLabel = formatMonthLabel(selectedMonthKey);

  const supervisorsList = useMemo(() => {
    const set = new Set<string>();
    operators.forEach(op => {
      if (op.supervisor) set.add(op.supervisor);
    });
    return Array.from(set);
  }, [operators]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('todos');
  const [editingCell, setEditingCell] = useState<{
    operatorId: string;
    operatorNome: string;
    dia: number;
    status: StatusType;
    atraso: number;
  } | null>(null);

  // Filtered operators
  const filteredOperators = useMemo(() => {
    return operators.filter(op => {
      const matchSearch =
        op.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSupervisor =
        selectedSupervisor === 'todos' ||
        op.supervisor.toLowerCase() === selectedSupervisor.toLowerCase();
      return matchSearch && matchSupervisor;
    });
  }, [operators, searchTerm, selectedSupervisor]);

  // Handle cell edit save
  const handleSaveCellEdit = () => {
    if (!editingCell) return;
    const opData = monthlyData[editingCell.operatorId];
    if (!opData) return;

    const updated = opData.dias.map(d => {
      if (d.dia === editingCell.dia) {
        return {
          ...d,
          status: editingCell.status,
          atraso: editingCell.status === 'dia ok/atraso' ? editingCell.atraso : 0
        };
      }
      return d;
    });

    onUpdateDays(editingCell.operatorId, updated);
    setEditingCell(null);
  };

  // Mass action: Apply status to all displayed operators on a specific day
  const handleMassApplyDay = (diaNum: number, status: StatusType) => {
    if (
      !window.confirm(
        `Deseja aplicar o status '${status}' no Dia ${diaNum} para todos os ${filteredOperators.length} operadores filtrados?`
      )
    ) {
      return;
    }

    filteredOperators.forEach(op => {
      const opData = monthlyData[op.id];
      if (opData) {
        const updated = opData.dias.map(d => {
          if (d.dia === diaNum) {
            return {
              ...d,
              status,
              atraso: 0
            };
          }
          return d;
        });
        onUpdateDays(op.id, updated);
      }
    });
  };

  return (
    <div className="space-y-5">
      
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#006772] dark:text-[#2dd4bf]">
              Aba 3: Repositório Central (BASE_APONTAMENTOS)
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Matriz Geral ({operators.length} Colaboradores × {totalDays} Dias · {monthLabel})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visualize toda a equipe em lote. Clique em qualquer célula diária para edição rápida direta.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Exibindo:</span>
            <span className="text-xs font-bold font-mono text-[#006772] dark:text-[#2dd4bf] bg-teal-50 dark:bg-teal-950/40 px-2 py-1 rounded">
              {filteredOperators.length} operadores
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar colaborador na matriz..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs overflow-x-auto">
            <button
              onClick={() => setSelectedSupervisor('todos')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedSupervisor === 'todos'
                  ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Todos
            </button>
            {supervisorsList.map((sup) => (
              <button
                key={sup}
                onClick={() => setSelectedSupervisor(sup)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedSupervisor.toLowerCase() === sup.toLowerCase()
                    ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {sup.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-[#005059] text-white font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-3 sticky left-0 z-30 bg-[#005059] w-56 border-r border-[#00383f] shadow-xs">
                  OPERADOR
                </th>
                <th className="py-2.5 px-2 text-center w-20 border-r border-[#00383f]">
                  PERD (min)
                </th>
                <th className="py-2.5 px-2 text-center w-20 border-r border-[#00383f]">
                  ESCAL (min)
                </th>
                <th className="py-2.5 px-2 text-center w-16 border-r border-[#00383f] bg-[#00383f] text-teal-100">
                  ABS %
                </th>

                {/* Days 1 to totalDays */}
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((dia) => {
                  const weekdayName = getWeekdayAbbr(year, month, dia);
                  const isWeekend = isWeekendDate(year, month, dia);
                  return (
                    <th
                      key={dia}
                      className={`py-2 px-1 text-center min-w-[34px] border-r border-slate-800 font-mono ${
                        isWeekend ? 'bg-amber-950/60 text-amber-400 font-bold' : ''
                      }`}
                      title={`Dia ${dia} (${weekdayName})`}
                    >
                      <div>{dia}</div>
                      <div className="text-[8px] opacity-70 font-sans">{weekdayName}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
              {filteredOperators.map((op, idx) => {
                const opData = monthlyData[op.id] || { operatorId: op.id, dias: [] };
                const stats = calculateOperatorStats(opData.dias, op.jornadaMin);

                return (
                  <tr
                    key={op.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    {/* Operador (Sticky Left) */}
                    <td className="py-2 px-3 sticky left-0 z-10 bg-white dark:bg-slate-900 font-sans font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 truncate max-w-[220px] shadow-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate" title={op.nome}>{op.nome}</span>
                        <button
                          onClick={() => onSelectOperatorForAudit(op.id)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-[#006772] dark:text-[#2dd4bf] hover:underline shrink-0 cursor-pointer"
                        >
                          ver
                        </button>
                      </div>
                    </td>

                    {/* Minutos Perdidos */}
                    <td className="py-2 px-2 text-right border-r border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-bold tabular-nums">
                      {stats.minutosPerdidos}
                    </td>

                    {/* Minutos Escalados */}
                    <td className="py-2 px-2 text-right border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 tabular-nums">
                      {stats.minutosEscalados}
                    </td>

                    {/* ABS % */}
                    <td className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800 font-bold tabular-nums">
                      <span
                        className={
                          stats.absMensal === 0
                            ? 'text-[#006772] dark:text-[#2dd4bf]'
                            : stats.absMensal > 0.03
                            ? 'text-rose-700 dark:text-rose-400 font-extrabold'
                            : 'text-[#d89627] dark:text-[#f0ad35]'
                        }
                      >
                        {formatPercent(stats.absMensal)}
                      </span>
                    </td>

                    {/* Days D1 to D{totalDays} */}
                    {opData.dias.slice(0, totalDays).map((d) => {
                      const isFolga = d.status === 'folga';
                      const isOk = d.status === 'dia ok';
                      const isAtraso = d.status === 'dia ok/atraso';
                      const isFalta = d.status === 'falta';
                      const isAtestado = d.status === 'atestado';
                      const isSuspensao = d.status === 'suspensão';

                      return (
                        <td
                          key={d.dia}
                          onClick={() =>
                            setEditingCell({
                              operatorId: op.id,
                              operatorNome: op.nome,
                              dia: d.dia,
                              status: d.status,
                              atraso: d.atraso
                            })
                          }
                          className="py-1 px-0.5 text-center border-r border-slate-100 dark:border-slate-800/80 cursor-pointer hover:ring-2 hover:ring-[#006772] hover:z-10 transition-all select-none"
                          title={`${op.nome} - Dia ${d.dia}: ${d.status} ${
                            isAtraso ? `(${d.atraso} min)` : ''
                          } (Clique para alterar)`}
                        >
                          <div
                            className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[9px] font-bold ${
                              isOk
                                ? 'bg-teal-100 text-[#006772] dark:bg-teal-950/60 dark:text-teal-300'
                                : isAtraso
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                : isFalta
                                ? 'bg-rose-600 text-white'
                                : isAtestado
                                ? 'bg-blue-600 text-white'
                                : isSuspensao
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500'
                            }`}
                          >
                            {isOk ? 'OK' : isAtraso ? `${d.atraso}` : isFalta ? 'F' : isAtestado ? 'A' : isSuspensao ? 'S' : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cell Quick Edit Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-md shadow-xl animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Editar Apontamento Rápido
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-[280px]">
                  {editingCell.operatorNome} · Dia {editingCell.dia}
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Status do Dia:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setEditingCell({
                          ...editingCell,
                          status: opt.value,
                          atraso: opt.value === 'dia ok/atraso' ? (editingCell.atraso || 15) : 0
                        })
                      }
                      className={`p-2 text-xs rounded-lg border text-left transition-all font-medium cursor-pointer ${
                        editingCell.status === opt.value
                          ? 'bg-[#006772] text-white border-[#006772] shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {editingCell.status === 'dia ok/atraso' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Minutos de Atraso:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="380"
                    value={editingCell.atraso}
                    onChange={(e) =>
                      setEditingCell({
                        ...editingCell,
                        atraso: Math.max(0, Math.min(380, parseInt(e.target.value) || 0))
                      })
                    }
                    className="w-full h-10 px-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg font-mono text-sm font-bold text-amber-950 dark:text-amber-100"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCellEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Alteração</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
