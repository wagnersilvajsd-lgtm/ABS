import React, { useState, useMemo } from 'react';
import {
  Operator,
  OperatorHistoryEvent,
  PedagogicalMeasureType
} from '../types/abs';
import {
  X,
  UserCheck,
  Clock,
  ArrowRightLeft,
  Trash2,
  Plus,
  MessageSquare,
  AlertTriangle,
  FileWarning,
  ShieldAlert,
  History,
  CheckCircle2,
  Calendar,
  Edit2
} from 'lucide-react';

interface OperatorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  operator: Operator | null;
  operationName: string;
  historyEvents: OperatorHistoryEvent[];
  onAddHistoryEvent: (event: Omit<OperatorHistoryEvent, 'id'>) => void;
  onDeleteHistoryEvent: (operatorId: string, eventId: string) => void;
  onOpenTransfer: (operator: Operator) => void;
  onOpenDelete: (operator: Operator) => void;
  onOpenEditOperator?: (operator: Operator) => void;
}

const PEDAGOGICAL_OPTIONS: {
  value: PedagogicalMeasureType;
  label: string;
  shortLabel: string;
  level: number;
  desc: string;
}[] = [
  {
    value: 'feedback',
    label: '1. Feedback / Alinhamento',
    shortLabel: 'Feedback',
    level: 1,
    desc: 'Conversa orientativa de alinhamento e acompanhamento'
  },
  {
    value: 'advertencia_verbal',
    label: '2. Advertência Verbal',
    shortLabel: 'Adv. Verbal',
    level: 2,
    desc: 'Primeiro registro disciplinar formal verbal'
  },
  {
    value: 'advertencia_escrita',
    label: '3. Advertência Escrita',
    shortLabel: 'Adv. Escrita',
    level: 3,
    desc: 'Registro formal documentado assinado em escala pedagógica'
  },
  {
    value: 'suspensao',
    label: '4. Suspensão Disciplinar',
    shortLabel: 'Suspensão',
    level: 4,
    desc: 'Medida disciplinar restritiva com afastamento temporário'
  }
];

const REASON_PRESETS = [
  'Absenteísmo / Faltas Injustificadas',
  'Atrasos Recorrentes na Escala',
  'Conduta / Comportamento Operacional',
  'Qualidade / Monitoria de Atendimento',
  'Descumprimento de Pausas / NR-17',
  'Feedback Positivo / Reconhecimento',
  'Outro Motivo'
];

export const OperatorProfileModal: React.FC<OperatorProfileModalProps> = ({
  isOpen,
  onClose,
  operator,
  operationName,
  historyEvents,
  onAddHistoryEvent,
  onDeleteHistoryEvent,
  onOpenTransfer,
  onOpenDelete,
  onOpenEditOperator
}) => {
  const [timelineFilter, setTimelineFilter] = useState<'todos' | 'pedagogico' | 'transferencia'>('todos');
  const [showAddForm, setShowAddForm] = useState(false);

  // Pedagogical form fields
  const [measureType, setMeasureType] = useState<PedagogicalMeasureType>('feedback');
  const [reason, setReason] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [appliedBy, setAppliedBy] = useState('');
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [suspensionDays, setSuspensionDays] = useState(1);

  const sortedEvents = useMemo(() => {
    return [...historyEvents].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [historyEvents]);

  const filteredEvents = useMemo(() => {
    if (timelineFilter === 'todos') return sortedEvents;
    if (timelineFilter === 'pedagogico') {
      return sortedEvents.filter(e => e.category === 'pedagogico');
    }
    return sortedEvents.filter(e => e.category === 'transferencia' || e.category === 'horario');
  }, [sortedEvents, timelineFilter]);

  // Pedagogical counts & highest level reached
  const pedagogicalSummary = useMemo(() => {
    const counts = {
      feedback: 0,
      advertencia_verbal: 0,
      advertencia_escrita: 0,
      suspensao: 0,
      transferencias: 0
    };
    let highestLevel = 0;

    historyEvents.forEach(ev => {
      if (ev.category === 'pedagogico' && ev.measureType) {
        counts[ev.measureType] = (counts[ev.measureType] || 0) + 1;
        const opt = PEDAGOGICAL_OPTIONS.find(p => p.value === ev.measureType);
        if (opt && opt.level > highestLevel) {
          highestLevel = opt.level;
        }
      } else if (ev.category === 'transferencia') {
        counts.transferencias++;
      }
    });

    return { counts, highestLevel };
  }, [historyEvents]);

  if (!isOpen || !operator) return null;

  const initials = operator.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('');

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Outro Motivo' ? customReason.trim() || 'Outro' : reason;
    const finalAppliedBy = (appliedBy.trim() || operator.supervisor).toUpperCase();

    onAddHistoryEvent({
      operatorId: operator.id,
      category: 'pedagogico',
      measureType,
      reason: finalReason,
      description: description.trim() || `Aplicação de ${PEDAGOGICAL_OPTIONS.find(p => p.value === measureType)?.shortLabel}`,
      appliedBy: finalAppliedBy,
      dateTime: dateTime ? new Date(dateTime).toISOString() : new Date().toISOString(),
      suspensionDays: measureType === 'suspensao' ? Math.max(1, suspensionDays) : undefined
    });

    setDescription('');
    setCustomReason('');
    setShowAddForm(false);
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const getEventBadge = (ev: OperatorHistoryEvent) => {
    if (ev.category === 'transferencia' || ev.category === 'horario') {
      if (ev.transferStatus === 'aceita') {
        return {
          label: 'Transferência Aceita',
          cls: 'bg-teal-100 text-[#006772] dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />
        };
      }
      if (ev.transferStatus === 'recusada') {
        return {
          label: 'Transferência Recusada',
          cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: <X className="w-3.5 h-3.5" />
        };
      }
      return {
        label: 'Transferência Solicitada',
        cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        icon: <ArrowRightLeft className="w-3.5 h-3.5" />
      };
    }

    switch (ev.measureType) {
      case 'feedback':
        return {
          label: 'Feedback (Nível 1)',
          cls: 'bg-teal-100 text-[#006772] dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800',
          icon: <MessageSquare className="w-3.5 h-3.5" />
        };
      case 'advertencia_verbal':
        return {
          label: 'Advertência Verbal (Nível 2)',
          cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: <AlertTriangle className="w-3.5 h-3.5" />
        };
      case 'advertencia_escrita':
        return {
          label: 'Advertência Escrita (Nível 3)',
          cls: 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border-orange-200 dark:border-orange-800',
          icon: <FileWarning className="w-3.5 h-3.5" />
        };
      case 'suspensao':
        return {
          label: `Suspensão${ev.suspensionDays ? ` (${ev.suspensionDays}d)` : ''} (Nível 4)`,
          cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: <ShieldAlert className="w-3.5 h-3.5" />
        };
      default:
        return {
          label: 'Registro',
          cls: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <History className="w-3.5 h-3.5" />
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 overflow-y-auto animate-backdrop-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col animate-scale-in">
        
        {/* Top Profile Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#006772] via-[#005059] to-[#00383f] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-lg font-extrabold font-mono shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-300/30 font-mono">
                  {operationName}
                </span>
                <span className="text-[10px] font-mono text-teal-200">
                  Perfil &amp; Escala Pedagógica
                </span>
              </div>
              <h2 className="text-lg font-extrabold truncate mt-0.5">
                {operator.nome}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-teal-100 mt-1">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>{operator.supervisor}</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-teal-200" />
                  <span>{operator.entrada} às {operator.saida} ({operator.jornadaMin} min)</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white self-end sm:self-center cursor-pointer transition-colors"
            aria-label="Fechar perfil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Fechar Formulário' : 'Registrar Feedback / Advertência / Suspensão'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenTransfer(operator)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transferir Supervisor / Horário</span>
            </button>

            {onOpenEditOperator && (
              <button
                type="button"
                onClick={() => onOpenEditOperator(operator)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Nome / Horário</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenDelete(operator)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Operador</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Pedagogical Scale Stepper */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#006772] dark:text-[#2dd4bf]">
                  Escala Pedagógica Progressiva do Colaborador
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Acompanhamento formal de medidas orientativas e disciplinares aplicadas ao perfil.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {pedagogicalSummary.highestLevel === 0
                  ? 'Sem ocorrências'
                  : `Nível ${pedagogicalSummary.highestLevel} atingido`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PEDAGOGICAL_OPTIONS.map((step) => {
                const count = pedagogicalSummary.counts[step.value] || 0;
                const isActive = count > 0;
                return (
                  <div
                    key={step.value}
                    className={`p-3 rounded-xl border transition-all ${
                      isActive
                        ? step.level === 4
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                          : step.level === 3
                          ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800'
                          : step.level === 2
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                          : 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-500 font-mono">
                        Nível {step.level}
                      </span>
                      <span className="text-xs font-extrabold font-mono text-slate-900 dark:text-slate-100">
                        {count}x
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {step.shortLabel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Pedagogical Measure Form */}
          {showAddForm && (
            <form
              onSubmit={handleSubmitForm}
              className="bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200 dark:border-teal-800/60 p-4 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#006772] dark:text-[#2dd4bf]">
                  Novo Registro na Escala Pedagógica
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase">
                    Medida / Nível da Escala:
                  </label>
                  <select
                    value={measureType}
                    onChange={(e) => setMeasureType(e.target.value as PedagogicalMeasureType)}
                    className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {PEDAGOGICAL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase">
                    Data e Hora da Aplicação:
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase">
                    Motivo / Enquadramento:
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {REASON_PRESETS.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase">
                    Aplicado por (Supervisor / RH):
                  </label>
                  <input
                    type="text"
                    value={appliedBy}
                    onChange={(e) => setAppliedBy(e.target.value)}
                    placeholder={operator.supervisor}
                    className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 uppercase"
                  />
                </div>
              </div>

              {reason === 'Outro Motivo' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase">
                    Especifique o Motivo:
                  </label>
                  <input
                    type="text"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Descreva o motivo..."
                    className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {measureType === 'suspensao' && (
                <div>
                  <label className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block mb-1 uppercase">
                    Quantidade de Dias de Suspensão:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(parseInt(e.target.value, 10) || 1)}
                    className="w-32 h-9 px-2.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-lg text-rose-800 dark:text-rose-200"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase">
                  Detalhamento / Plano de Ação:
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o feedback, advertência ou suspensão e o combinado com o colaborador..."
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Salvar no Histórico do Perfil</span>
                </button>
              </div>
            </form>
          )}

          {/* Unified Timeline */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#006772] dark:text-[#2dd4bf]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Histórico Completo do Colaborador ({filteredEvents.length})
                </h3>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setTimelineFilter('todos')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    timelineFilter === 'todos'
                      ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Todos ({sortedEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineFilter('pedagogico')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    timelineFilter === 'pedagogico'
                      ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Escala Pedagógica
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineFilter('transferencia')}
                  className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                    timelineFilter === 'transferencia'
                      ? 'bg-white dark:bg-slate-900 text-[#006772] dark:text-[#2dd4bf] shadow-2xs'
                      : 'text-slate-500'
                  }`}
                >
                  Transferências &amp; Horários
                </button>
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Nenhum registro encontrado no histórico deste colaborador até o momento.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredEvents.map((ev) => {
                  const badge = getEventBadge(ev);
                  return (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${badge.cls}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                          {ev.reason && (
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              · {ev.reason}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatTimestamp(ev.dateTime)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteHistoryEvent(operator.id, ev.id)}
                            title="Remover registro do histórico"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {ev.description}
                      </p>

                      {(ev.fromSupervisor || ev.fromSchedule) && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {ev.fromSupervisor && ev.toSupervisor && (
                            <div>
                              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                                Supervisão
                              </span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {ev.fromSupervisor.split(' ')[0]} &rarr; {ev.toSupervisor.split(' ')[0]}
                              </span>
                            </div>
                          )}
                          {ev.fromSchedule && ev.toSchedule && (
                            <div>
                              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                                Horário
                              </span>
                              <span className="font-mono font-semibold text-[#006772] dark:text-[#2dd4bf]">
                                {ev.fromSchedule} &rarr; {ev.toSchedule}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-2 text-[10px] text-slate-400 font-medium">
                        Registrado / Aplicado por: <strong className="text-slate-600 dark:text-slate-300">{ev.appliedBy}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
