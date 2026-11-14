import React, { useEffect, useState } from 'react';
import { Operation, Operator, OperatorMonthlyData, OperatorHistoryEvent, TransferRequest } from '../types/abs';
import { calculateOperatorStats } from '../utils/calculations';
import { formatMonthLabel, getDaysInMonth, parseMonthKey } from '../utils/calendar';
import {
  ExcelExportStyleConfig,
  exportOperationExcelReport,
  loadExcelStyleConfig,
  saveExcelStyleConfig
} from '../utils/reports';
import { ExcelStyleConfigPanel } from './ExcelStyleConfigPanel';
import { formatPeriodSummary } from './PeriodCalendarPopover';
import { X, Download, Copy, Check, FileSpreadsheet, Palette, ChevronDown, ChevronUp } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation?: Operation;
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  onImportData?: (
    operators: Operator[],
    monthlyData: Record<string, OperatorMonthlyData>,
    operatorHistory?: Record<string, OperatorHistoryEvent[]>,
    transferRequests?: TransferRequest[]
  ) => void;
  selectedMonthKey: string;
  selectedPeriodDays?: number[] | null;
  operatorHistory?: Record<string, OperatorHistoryEvent[]>;
  transferRequests?: TransferRequest[];
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  operation,
  operators,
  monthlyData,
  selectedMonthKey,
  selectedPeriodDays = null,
  operatorHistory,
  transferRequests
}) => {
  const { year, month } = parseMonthKey(selectedMonthKey);
  const totalDays = getDaysInMonth(year, month);
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [excelStyle, setExcelStyle] = useState<ExcelExportStyleConfig>(() => loadExcelStyleConfig());
  const [showStylePicker, setShowStylePicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setExcelStyle(loadExcelStyleConfig());
    }
  }, [isOpen]);

  const handleExcelStyleChange = (next: ExcelExportStyleConfig) => {
    setExcelStyle(next);
    saveExcelStyleConfig(next);
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#006772] dark:text-[#2dd4bf]" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Exportar Dados e Relatórios WFM
              </h3>
              <p className="text-xs text-slate-500">
                Compatibilidade direta com Excel (XLSX), Google Sheets e arquivos CSV/JSON.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">

              {/* Card 0: Relatório Gerencial XLSX (Cores & Filtros + Seletor de Paleta) */}
              <div className="bg-teal-50/60 dark:bg-teal-950/30 p-4 rounded-xl border border-teal-200 dark:border-teal-800/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Relatório Gerencial XLSX · {operation?.nome || 'Operação'} ({monthLabel})
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Planilha organizada em 3 abas com cores personalizadas, cabeçalho congelado e filtros automáticos.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowStylePicker((prev) => !prev)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <span
                        className="w-3 h-3 rounded-xs border border-black/15"
                        style={{ backgroundColor: excelStyle.headerColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-xs border border-black/15 -ml-1"
                        style={{ backgroundColor: excelStyle.highlightColor }}
                      />
                      <Palette className="w-3.5 h-3.5 text-[#006772] dark:text-[#2dd4bf]" />
                      <span>Estilo</span>
                      {showStylePicker ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const resolvedOp: Operation = operation || {
                          id: 'caern',
                          nome: 'Operação JSD',
                          cliente: 'JSD Telecom',
                          logoUrl: '/assets/aistudio/image_def6497f.png',
                          metaAbs: 0.03,
                          jornadaPadraoMin: 380,
                          supervisores: []
                        };
                        const periodLabel =
                          selectedPeriodDays && selectedPeriodDays.length > 0
                            ? formatPeriodSummary(selectedPeriodDays, selectedMonthKey)
                            : undefined;
                        void exportOperationExcelReport({
                          operation: resolvedOp,
                          operators,
                          monthlyData,
                          selectedMonthKey,
                          periodSummaryLabel: periodLabel,
                          styleConfig: excelStyle
                        });
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#005059] hover:bg-[#003e45] rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#f0ad35]" />
                      <span>Baixar XLSX</span>
                    </button>
                  </div>
                </div>

                {showStylePicker && (
                  <div className="pt-3 border-t border-teal-200/70 dark:border-teal-800/60 animate-fade-in">
                    <ExcelStyleConfigPanel
                      value={excelStyle}
                      onChange={handleExcelStyleChange}
                      compact
                    />
                  </div>
                )}
              </div>
              
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
        </div>

      </div>
    </div>
  );
};
