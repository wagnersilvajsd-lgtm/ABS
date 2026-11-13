import React, { useState } from 'react';
import { TransferRequest } from '../types/abs';
import { ArrowRightLeft, CheckCircle2, XCircle, Clock, UserCheck, Calendar, X, BellRing } from 'lucide-react';

interface TransferInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTransfers: TransferRequest[];
  activeSupervisorView: string;
  onAcceptTransfer: (transferId: string, responseNote: string) => void;
  onRejectTransfer: (transferId: string, responseNote: string) => void;
}

export const TransferInboxModal: React.FC<TransferInboxModalProps> = ({
  isOpen,
  onClose,
  pendingTransfers,
  activeSupervisorView,
  onAcceptTransfer,
  onRejectTransfer
}) => {
  const [responseNote, setResponseNote] = useState('');

  if (!isOpen || pendingTransfers.length === 0) return null;

  const current = pendingTransfers[0];

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
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

  const scheduleChanged =
    current.fromEntrada !== current.toEntrada ||
    current.fromSaida !== current.toSaida ||
    current.fromJornadaMin !== current.toJornadaMin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-backdrop-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#d89627] w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Alert Banner Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#006772] via-[#005059] to-[#00383f] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d89627] text-white flex items-center justify-center shrink-0 shadow-sm">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-300/30 font-mono">
                  Recebimento de Transferência
                </span>
                {pendingTransfers.length > 1 && (
                  <span className="text-[10px] font-mono bg-white/15 px-1.5 py-0.5 rounded">
                    1 de {pendingTransfers.length} pendentes
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold mt-0.5">
                Novo Operador Transferido para Você
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Minimizar para responder depois"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {activeSupervisorView === 'gestor' && (
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[11px] text-[#006772] dark:text-teal-300">
              Visualizando caixa do supervisor recebedor: <strong>{current.toSupervisor}</strong>
            </div>
          )}

          {/* Operator Name & Timestamp */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Colaborador Transferido
              </span>
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatTimestamp(current.requestedAt)}
              </span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {current.operatorName}
            </div>
          </div>

          {/* Supervisor Transition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Supervisor Origem (Enviou)
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{current.fromSupervisor}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/30">
              <span className="text-[10px] font-bold uppercase text-[#006772] dark:text-[#2dd4bf] block">
                Supervisor Destino (Recebe)
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-extrabold text-[#005059] dark:text-teal-200">
                <UserCheck className="w-3.5 h-3.5 text-[#006772] shrink-0" />
                <span className="truncate">{current.toSupervisor}</span>
              </div>
            </div>
          </div>

          {/* Schedule Comparison */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#d89627]" />
                Horário / Escala do Colaborador
              </span>
              {scheduleChanged && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Com Alteração de Horário
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 text-xs font-mono">
              <div className="text-slate-500">
                <span className="text-[10px] block font-sans">Anterior</span>
                <strong>{current.fromEntrada} – {current.fromSaida}</strong>
              </div>
              <ArrowRightLeft className="w-4 h-4 text-[#006772] shrink-0" />
              <div className="text-right text-[#006772] dark:text-[#2dd4bf]">
                <span className="text-[10px] block font-sans">Novo Horário</span>
                <strong>{current.toEntrada} – {current.toSaida} ({current.toJornadaMin}m)</strong>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
              Motivo / Informativo da Transferência:
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
              {current.reason}
            </p>
          </div>

          {/* Optional Response Note */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 uppercase">
              Observação da Resposta (opcional):
            </label>
            <input
              type="text"
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder="Ex: Recebido na equipe ou motivo da recusa..."
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Accept / Reject Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onRejectTransfer(current.id, responseNote.trim());
                setResponseNote('');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 rounded-xl transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Recusar Transferência</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onAcceptTransfer(current.id, responseNote.trim());
                setResponseNote('');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#006772] hover:bg-[#005059] rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aceitar Transferência</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
