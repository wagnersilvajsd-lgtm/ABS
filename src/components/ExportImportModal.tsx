import React, { useState } from 'react';
import { Operator, OperatorMonthlyData, OperatorHistoryEvent, TransferRequest } from '../types/abs';
import { calculateOperatorStats } from '../utils/calculations';
import { formatMonthLabel, getDaysInMonth, parseMonthKey } from '../utils/calendar';
import { X, Download, Copy, Check, FileSpreadsheet, Upload, AlertCircle, Code } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/googleAppsScriptCode';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  onImportData: (
    operators: Operator[],
    monthlyData: Record<string, OperatorMonthlyData>,
    operatorHistory?: Record<string, OperatorHistoryEvent[]>,
    transferRequests?: TransferRequest[]
  ) => void;
  selectedMonthKey: string;
  operatorHistory?: Record<string, OperatorHistoryEvent[]>;
  transferRequests?: TransferRequest[];
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  operators,
  monthlyData,
  onImportData,
  selectedMonthKey,
  operatorHistory,
  transferRequests
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const totalDays = getDaysInMonth(year, month);
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const [activeTab, setActiveTab] = useState<'export' | 'appscript' | 'import'>('export');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate CSV for Tab 1: OPERADORES
  const generateOperadoresCsv = () => {
    const headers = [
      'OPERADOR',
      'SUPERVISOR',
      'HORÁRIO ENTRADA',
      'HORÁRIO SAÍDA',
      'JORNADA (MIN)',
      'MIN. PERDIDOS',
      'MIN. ESCALADOS',
      'ABS MENSAL'
    ];
    const rows = operators.map(op => {
      const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
      const stats = calculateOperatorStats(data.dias, op.jornadaMin);
      return [
        `"${op.nome}"`,
        `"${op.supervisor}"`,
        `"${op.entrada}"`,
        `"${op.saida}"`,
        op.jornadaMin,
        stats.minutosPerdidos,
        stats.minutosEscalados,
        `"${(stats.absMensal * 100).toFixed(2)}%"`
      ].join(';');
    });
    return [headers.join(';'), ...rows].join('\n');
  };

  // Generate CSV for Tab 3: BASE_APONTAMENTOS
  const generateBaseApontamentosCsv = () => {
    const headers = ['OPERADOR', 'MINUTOS_PERDIDOS', 'MINUTOS_ESCALADOS', 'MINUTOS_ABONADOS'];
    for (let d = 1; d <= totalDays; d++) {
      headers.push(`D${d}_STATUS`);
      headers.push(`D${d}_ATRASO_OU_ABONO`);
    }

    const rows = operators.map(op => {
      const opData = monthlyData[op.id] || { operatorId: op.id, dias: [] };
      const stats = calculateOperatorStats(opData.dias, op.jornadaMin);
      const rowVals: (string | number)[] = [
        `"${op.nome}"`,
        stats.minutosPerdidos,
        stats.minutosEscalados,
        stats.minutosAbonados
      ];
      for (let d = 1; d <= totalDays; d++) {
        const record = opData.dias.find(item => item.dia === d);
        rowVals.push(`"${record ? record.status : 'dia ok'}"`);
        rowVals.push(
          record
            ? record.status === 'abono' || record.status === 'abono_legal'
              ? record.abonoMin || 0
              : record.atraso
            : 0
        );
      }
      return rowVals.join(';');
    });

    return [headers.join(';'), ...rows].join('\n');
  };

  // Download CSV trigger
  const handleDownloadCsv = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to clipboard for instant pasting into Google Sheets / Excel
  const handleCopyToClipboard = (content: string, type: string) => {
    // Replace semicolons with tabs for spreadsheet paste
    const tsv = content.replace(/;/g, '\t').replace(/"/g, '');
    navigator.clipboard.writeText(tsv).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  // Backup JSON
  const handleDownloadJsonBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      operators,
      monthlyData,
      operatorHistory: operatorHistory || {},
      transferRequests: transferRequests || []
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backup_abs_wfm_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Import JSON
  const handleProcessImport = () => {
    try {
      setImportError(null);
      if (!importJsonText.trim()) {
        setImportError('Insira o conteúdo JSON do backup.');
        return;
      }
      const parsed = JSON.parse(importJsonText);
      if (!parsed.operators || !parsed.monthlyData) {
        setImportError('Formato inválido: o JSON deve conter "operators" e "monthlyData".');
        return;
      }
      onImportData(
        parsed.operators,
        parsed.monthlyData,
        parsed.operatorHistory,
        parsed.transferRequests
      );
      onClose();
    } catch (e: any) {
      setImportError(`Erro ao processar JSON: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#006772] dark:text-[#2dd4bf]" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Exportar / Importar Dados WFM
              </h3>
              <p className="text-xs text-slate-500">
                Compatibilidade direta com Google Sheets, Excel e arquivos CSV/JSON.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#006772] text-[#006772] dark:border-[#2dd4bf] dark:text-[#2dd4bf]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Exportar &amp; Copiar Planilhas
          </button>
          <button
            onClick={() => setActiveTab('appscript')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'appscript'
                ? 'border-[#006772] text-[#006772] dark:border-[#2dd4bf] dark:text-[#2dd4bf]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📜 Código Google Apps Script (.gs)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#006772] text-[#006772] dark:border-[#2dd4bf] dark:text-[#2dd4bf]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Restaurar Backup (JSON)
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'appscript' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Código Completo Refatorado (Google Apps Script)
                  </h4>
                  <p className="text-xs text-slate-500">
                    100% testado, operações em lote (Batch), anti-timeout e regra de folgas flexíveis.
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE).then(() => {
                      setCopiedType('appscript');
                      setTimeout(() => setCopiedType(null), 2500);
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedType === 'appscript' ? <Check className="w-3.5 h-3.5 text-teal-200" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'appscript' ? 'Código Copiado!' : 'Copiar Código .gs'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="max-h-[380px] overflow-y-auto p-4 bg-slate-950 text-slate-200 text-[11px] font-mono rounded-xl border border-slate-800 select-all whitespace-pre leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Cole este código no menu: <strong>Extensões &gt; Apps Script</strong> da sua planilha.</span>
                <span>Fórmula D40: <code>(COUNTIF(&lt;&gt;folga) - COUNTIF("")) * D3</code></span>
              </div>
            </div>
          ) : activeTab === 'export' ? (
            <div className="space-y-4">
              
              {/* Card 1: OPERADORES */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Aba 1: OPERADORES ({operators.length} Colaboradores · {monthLabel})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nome, Supervisor, Horários, Minutos Perdidos, Escalados e ABS Mensal.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyToClipboard(generateOperadoresCsv(), 'operadores')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedType === 'operadores' ? <Check className="w-3.5 h-3.5 text-[#006772]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedType === 'operadores' ? 'Copiado!' : 'Copiar p/ Sheets'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadCsv(generateOperadoresCsv(), `OPERADORES_ABS_WFM_${selectedMonthKey}.csv`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Card 2: BASE_APONTAMENTOS */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Aba 3: BASE_APONTAMENTOS (Matriz {totalDays} Dias · {monthLabel})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Histórico diário completo de todos os {operators.length} colaboradores com status e atrasos D1 a D{totalDays}.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyToClipboard(generateBaseApontamentosCsv(), 'base')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copiedType === 'base' ? <Check className="w-3.5 h-3.5 text-[#006772]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedType === 'base' ? 'Copiado!' : 'Copiar p/ Sheets'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadCsv(generateBaseApontamentosCsv(), `BASE_APONTAMENTOS_WFM_${selectedMonthKey}.csv`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Backup Geral JSON */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Backup Completo da Base (JSON)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Arquivo estruturado com operadores, configurações e apontamentos dos {totalDays} dias de {monthLabel}.
                  </p>
                </div>
                <button
                  onClick={handleDownloadJsonBackup}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar JSON</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Cole o código JSON do backup abaixo:
                </label>
                <textarea
                  rows={8}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"exportedAt": "...", "operators": [...], "monthlyData": {...}}'
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleProcessImport}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Processar e Restaurar Backup</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
