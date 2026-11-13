import React, { useState, useMemo } from 'react';
import { Operator, OperatorMonthlyData, StatusType, DayRecord } from '../types/abs';
import { STATUS_OPTIONS } from '../data/initialData';
import { formatMonthLabel, getDaysInMonth, getWeekdayAbbr, isWeekendDate, parseMonthKey } from '../utils/calendar';
import { calculateOperatorStats, formatPercent } from '../utils/calculations';
import { Search, Filter, Calendar, Edit3, X, Check, Eraser } from 'lucide-react';

interface BaseApontamentosViewProps {
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  onUpdateDays: (operatorId: string, dias: DayRecord[]) => void;
  onSelectOperatorForAudit: (operatorId: string) => void;
  selectedMonthKey: string;
  selectedPeriodDays?: number[] | null;
  onClearMonthAbs?: () => void;
}

export const BaseApontamentosView: React.FC<BaseApontamentosViewProps> = ({
  operators,
  monthlyData,
  onUpdateDays,
  onSelectOperatorForAudit,
  selectedMonthKey,
  selectedPeriodDays = null,
  onClearMonthAbs
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const totalDays = getDaysInMonth(year, month);
  const monthLabel = formatMonthLabel(selectedMonthKey);

  const displayedDayNumbers = useMemo(() => {
    if (selectedPeriodDays && selectedPeriodDays.length > 0) {
      return selectedPeriodDays.filter(d => d >= 1 && d <= totalDays);
    }
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [selectedPeriodDays, totalDays]);

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
    jornadaMin: number;
    dia: number;
    status: StatusType;
    atraso: number;
    abonoMin: number;
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
          atraso: editingCell.status === 'dia ok/atraso' ? editingCell.atraso : 0,
          abonoMin:
            editingCell.status === 'abono' || editingCell.status === 'abono_legal'
              ? editingCell.abonoMin
              : undefined
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
    <div className="space-y-6">

      {/* Header & Controls */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
              Base Matriz de Apontamentos
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {operators.length} colaboradores × {displayedDayNumbers.length}{displayedDayNumbers.length < totalDays ? ` de ${totalDays}` : ''} dias ({monthLabel}) · Clique em qualquer célula para editar o dia
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Exibindo</span>
              <span className="text-sm font-bold font-mono tabular-nums text-[#006772] dark:text-[#2dd4bf]">
                {filteredOperators.length} operador(es)
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
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar colaborador ou supervisor na matriz..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs overflow-x-auto">
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
        </div>

        {/* Compact Code Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Legenda:</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-teal-100 text-[#006772] dark:bg-teal-950/60 dark:text-teal-300 font-mono text-[9px] font-bold flex items-center justify-center">OK</span> Dia OK</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-mono text-[9px] font-bold flex items-center justify-center">15</span> Atraso (min)</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-orange-500 text-white font-mono text-[9px] font-bold flex items-center justify-center">DC</span> Declaração (ABS)</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-cyan-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">AL</span> Abono Legal BH</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-indigo-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">BH</span> BH Integral</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-emerald-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">AN</span> Aniversário</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">F</span> Falta</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-blue-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">A</span> Atestado</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-purple-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">S</span> Suspensão</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-slate-100 text-slate-400 dark:bg-slate-800 font-mono text-[9px] font-bold flex items-center justify-center">—</span> Folga DSR</span>
        </div>
      </section>

      {/* Matrix Table */}
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-[#005059] text-white font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-3 sticky left-0 z-30 bg-[#005059] w-56 border-r border-[#003e45]">
                  Operador
                </th>
                <th className="py-2.5 px-2 text-right w-20 border-r border-[#003e45]">
                  Perd. (m)
                </th>
                <th className="py-2.5 px-2 text-right w-20 border-r border-[#003e45]">
                  Escal. (m)
                </th>
                <th className="py-2.5 px-2 text-right w-18 border-r border-[#003e45] bg-[#003e45] text-teal-100">
                  ABS %
                </th>

                {/* Days filtered by period */}
                {displayedDayNumbers.map((dia) => {
                  const weekdayName = getWeekdayAbbr(year, month, dia);
                  const isWeekend = isWeekendDate(year, month, dia);
                  return (
                    <th
                      key={dia}
                      className={`py-2 px-1 text-center min-w-[34px] border-r border-[#003e45]/70 font-mono tabular-nums ${
                        isWeekend ? 'bg-amber-950/60 text-amber-300 font-bold' : ''
                      }`}
                      title={`Dia ${dia} (${weekdayName})`}
                    >
                      <div>{dia}</div>
                      <div className="text-[8px] opacity-75 font-sans">{weekdayName}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
              {filteredOperators.map((op) => {
                const opData = monthlyData[op.id] || { operatorId: op.id, dias: [] };
                const stats = calculateOperatorStats(opData.dias, op.jornadaMin);

                return (
                  <tr
                    key={op.id}
                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
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

                    {/* Days filtered by period */}
                    {displayedDayNumbers.map((diaNum) => {
                      const d = opData.dias.find(item => item.dia === diaNum) || {
                        dia: diaNum,
                        status: 'dia ok' as StatusType,
                        atraso: 0
                      };
                      const isOk = d.status === 'dia ok';
                      const isAtraso = d.status === 'dia ok/atraso';
                      const isAbono = d.status === 'abono';
                      const isAbonoLegal = d.status === 'abono_legal';
                      const isBhIntegral = d.status === 'banco_horas_integral';
                      const isAniversario = d.status === 'folga_aniversario';
                      const isFalta = d.status === 'falta';
                      const isAtestado = d.status === 'atestado';
                      const isSuspensao = d.status === 'suspensão';
                      const validAbono = Math.max(0, Math.min(op.jornadaMin, Number(d.abonoMin) || 0));

                      return (
                        <td
                          key={d.dia}
                          onClick={() =>
                            setEditingCell({
                              operatorId: op.id,
                              operatorNome: op.nome,
                              jornadaMin: op.jornadaMin,
                              dia: d.dia,
                              status: d.status,
                              atraso: d.atraso,
                              abonoMin:
                                d.status === 'abono' || d.status === 'abono_legal'
                                  ? validAbono
                                  : Math.max(0, op.jornadaMin - Math.min(120, op.jornadaMin))
                            })
                          }
                          className="py-1 px-0.5 text-center border-r border-slate-100 dark:border-slate-800/80 cursor-pointer hover:ring-2 hover:ring-[#006772] hover:z-10 transition-all select-none"
                          title={`${op.nome} - Dia ${d.dia}: ${d.status} ${
                            isAtraso
                              ? `(${d.atraso} min)`
                              : isAbono
                              ? `(${validAbono} min faltantes / ${Math.max(0, op.jornadaMin - validAbono)} min logados — gera ABS)`
                              : isAbonoLegal
                              ? `(${validAbono} min BH prog. / ${Math.max(0, op.jornadaMin - validAbono)} min logados — sem ABS)`
                              : isBhIntegral
                              ? '(Banco de Horas Integral — sem ABS)'
                              : isAniversario
                              ? '(Folga Aniversário — sem ABS)'
                              : ''
                          } (Clique para alterar)`}
                        >
                          <div
                            className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[9px] font-bold ${
                              isOk
                                ? 'bg-teal-100 text-[#006772] dark:bg-teal-950/60 dark:text-teal-300'
                                : isAtraso
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                : isAbono
                                ? 'bg-orange-500 text-white'
                                : isAbonoLegal
                                ? 'bg-cyan-600 text-white'
                                : isBhIntegral
                                ? 'bg-indigo-600 text-white'
                                : isAniversario
                                ? 'bg-emerald-600 text-white'
                                : isFalta
                                ? 'bg-rose-600 text-white'
                                : isAtestado
                                ? 'bg-blue-600 text-white'
                                : isSuspensao
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500'
                            }`}
                          >
                            {isOk
                              ? 'OK'
                              : isAtraso
                              ? `${d.atraso}`
                              : isAbono
                              ? 'DC'
                              : isAbonoLegal
                              ? 'AL'
                              : isBhIntegral
                              ? 'BH'
                              : isAniversario
                              ? 'AN'
                              : isFalta
                              ? 'F'
                              : isAtestado
                              ? 'A'
                              : isSuspensao
                              ? 'S'
                              : '—'}
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
      </section>

      {/* Cell Quick Edit Modal */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-backdrop-in">
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
                          atraso: opt.value === 'dia ok/atraso' ? (editingCell.atraso || 15) : 0,
                          abonoMin:
                            opt.value === 'abono' || opt.value === 'abono_legal'
                              ? editingCell.abonoMin || Math.max(0, editingCell.jornadaMin - Math.min(120, editingCell.jornadaMin))
                              : editingCell.abonoMin
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
                    max={editingCell.jornadaMin}
                    value={editingCell.atraso}
                    onChange={(e) =>
                      setEditingCell({
                        ...editingCell,
                        atraso: Math.max(0, Math.min(editingCell.jornadaMin, parseInt(e.target.value) || 0))
                      })
                    }
                    className="w-full h-10 px-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg font-mono text-sm font-bold text-amber-950 dark:text-amber-100"
                  />
                </div>
              )}

              {(editingCell.status === 'abono' || editingCell.status === 'abono_legal') && (
                <div
                  className={`p-3 rounded-lg border space-y-2.5 ${
                    editingCell.status === 'abono'
                      ? 'bg-orange-50/70 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
                      : 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      className={`text-xs font-bold ${
                        editingCell.status === 'abono'
                          ? 'text-orange-900 dark:text-orange-200'
                          : 'text-cyan-900 dark:text-cyan-200'
                      }`}
                    >
                      Tempo Trabalhado / Logado (min):
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        editingCell.status === 'abono'
                          ? 'text-orange-700 dark:text-orange-300'
                          : 'text-cyan-700 dark:text-cyan-300'
                      }`}
                    >
                      Jornada: {editingCell.jornadaMin} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={editingCell.jornadaMin}
                      value={Math.max(0, editingCell.jornadaMin - editingCell.abonoMin)}
                      onChange={(e) => {
                        const worked = Math.max(0, Math.min(editingCell.jornadaMin, parseInt(e.target.value, 10) || 0));
                        setEditingCell({
                          ...editingCell,
                          abonoMin: Math.max(0, editingCell.jornadaMin - worked)
                        });
                      }}
                      className="w-28 h-9 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-sm font-bold text-slate-900 dark:text-slate-100"
                    />
                    <div className="flex items-center gap-1 flex-wrap">
                      {[
                        { label: '0h (Integral)', mins: 0 },
                        { label: '1h', mins: 60 },
                        { label: '2h', mins: 120 },
                        { label: '3h', mins: 180 },
                        { label: '4h', mins: 240 }
                      ].map((preset) => {
                        const clamped = Math.min(editingCell.jornadaMin, preset.mins);
                        const active = editingCell.jornadaMin - editingCell.abonoMin === clamped;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              setEditingCell({
                                ...editingCell,
                                abonoMin: Math.max(0, editingCell.jornadaMin - clamped)
                              })
                            }
                            className={`px-2 py-1 text-[11px] font-mono rounded cursor-pointer transition-colors ${
                              active
                                ? editingCell.status === 'abono'
                                  ? 'bg-orange-600 text-white font-bold'
                                  : 'bg-cyan-700 text-white font-bold'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {editingCell.status === 'abono' ? (
                    <p className="text-[11px] text-orange-800 dark:text-orange-300 font-medium">
                      Horas faltantes (declaração): <strong>{editingCell.abonoMin} min</strong> serão somados como minutos perdidos e{' '}
                      <strong>geram ABS</strong> no mês ({Math.max(0, editingCell.jornadaMin - editingCell.abonoMin)} min trabalhados).
                    </p>
                  ) : (
                    <p className="text-[11px] text-cyan-800 dark:text-cyan-300 font-medium">
                      Saída antecipada programada (BH): <strong>{editingCell.abonoMin} min</strong> cobertos pelo Banco de Horas —{' '}
                      <strong>não gera ABS</strong> ({Math.max(0, editingCell.jornadaMin - editingCell.abonoMin)} min trabalhados).
                    </p>
                  )}
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
