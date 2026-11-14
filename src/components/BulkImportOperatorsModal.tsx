import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Operator, OperatorMonthlyData } from '../types/abs';
import {
  generateMonthDays,
  getDefaultMonthKey,
  parseMonthKey,
  WeekendFolgaMode
} from '../utils/calendar';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  ClipboardPaste
} from 'lucide-react';

interface BulkImportOperatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationId: string;
  operationName: string;
  defaultJornadaMin?: number;
  existingOperators: Operator[];
  existingSupervisors: string[];
  selectedMonthKey?: string;
  onBulkAddOperators: (
    newOperators: Operator[],
    newMonthlyDataMap: Record<string, OperatorMonthlyData>
  ) => void;
}

interface ParsedRow {
  lineNumber: number;
  nome: string;
  supervisor: string;
  entrada: string;
  saida: string;
  jornadaMin: number;
  status: 'ok' | 'duplicate' | 'invalid';
  reason?: string;
}

function normalizeTimeValue(raw: unknown): string {
  if (typeof raw === 'number' && !isNaN(raw)) {
    // Excel serial time fraction (0..1)
    const totalMinutes = Math.round((raw % 1) * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }
  const s = String(raw || '').trim();
  if (!s) return '';
  const match = s.match(/^(\d{1,2})[:hH](\d{1,2})(?::(\d{1,2}))?/);
  if (!match) return '';
  const h = Math.min(23, parseInt(match[1], 10));
  const m = Math.min(59, parseInt(match[2], 10));
  const sec = match[3] ? Math.min(59, parseInt(match[3], 10)) : 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return '14:20:00';
  const total = (h * 60 + m + minutesToAdd) % (24 * 60);
  const outH = Math.floor(total / 60);
  const outM = total % 60;
  return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}:00`;
}

export const BulkImportOperatorsModal: React.FC<BulkImportOperatorsModalProps> = ({
  isOpen,
  onClose,
  operationId,
  operationName,
  defaultJornadaMin = 380,
  existingOperators,
  existingSupervisors,
  selectedMonthKey,
  onBulkAddOperators
}) => {
  const [rawText, setRawText] = useState('');
  const [rawMatrixFromFile, setRawMatrixFromFile] = useState<unknown[][] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fallbackSupervisor, setFallbackSupervisor] = useState(
    existingSupervisors[0] || ''
  );
  const [folgaMode, setFolgaMode] = useState<WeekendFolgaMode>('auto');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);

  const activeMonthKey = selectedMonthKey || getDefaultMonthKey();
  const { year, month } = parseMonthKey(activeMonthKey);

  const existingNamesSet = useMemo(() => {
    return new Set(existingOperators.map((o) => o.nome.trim().toUpperCase()));
  }, [existingOperators]);

  const parsedRows: ParsedRow[] = useMemo(() => {
    let rowsMatrix: unknown[][] = [];

    if (rawMatrixFromFile && rawMatrixFromFile.length > 0) {
      rowsMatrix = rawMatrixFromFile;
    } else if (rawText.trim()) {
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      rowsMatrix = lines.map((line) => {
        if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
        if (line.includes(';')) return line.split(';').map((c) => c.trim());
        if (line.includes('|')) return line.split('|').map((c) => c.trim());
        return line.split(',').map((c) => c.trim());
      });
    }

    if (rowsMatrix.length === 0) return [];

    // Detect & skip header row if column 0 looks like a header label
    const firstCell = String(rowsMatrix[0]?.[0] || '').trim().toLowerCase();
    const looksLikeHeader =
      firstCell === 'operador' ||
      firstCell === 'colaborador' ||
      firstCell === 'nome' ||
      firstCell === 'nome completo';

    const startIndex = looksLikeHeader ? 1 : 0;
    const seenInBatch = new Set<string>();
    const results: ParsedRow[] = [];

    for (let i = startIndex; i < rowsMatrix.length; i++) {
      const cols = rowsMatrix[i] || [];
      const nome = String(cols[0] ?? '').trim().toUpperCase();
      if (!nome) continue;

      const supRaw = String(cols[1] ?? '').trim().toUpperCase();
      const supervisor =
        supRaw || fallbackSupervisor.trim().toUpperCase() || 'SUPERVISÃO GERAL';

      const jornadaRaw = parseInt(String(cols[4] ?? ''), 10);
      const jornadaMin =
        !isNaN(jornadaRaw) && jornadaRaw >= 60 && jornadaRaw <= 600
          ? jornadaRaw
          : defaultJornadaMin;

      const entradaNorm = normalizeTimeValue(cols[2]) || '08:00:00';
      const saidaNorm =
        normalizeTimeValue(cols[3]) || addMinutesToTime(entradaNorm, jornadaMin);

      const isDupExisting = existingNamesSet.has(nome);
      const isDupBatch = seenInBatch.has(nome);

      if (isDupExisting || isDupBatch) {
        results.push({
          lineNumber: i + 1,
          nome,
          supervisor,
          entrada: entradaNorm,
          saida: saidaNorm,
          jornadaMin,
          status: 'duplicate',
          reason: isDupExisting
            ? 'Já cadastrado nesta operação'
            : 'Repetido nesta planilha'
        });
      } else {
        seenInBatch.add(nome);
        results.push({
          lineNumber: i + 1,
          nome,
          supervisor,
          entrada: entradaNorm,
          saida: saidaNorm,
          jornadaMin,
          status: 'ok'
        });
      }
    }

    return results;
  }, [rawMatrixFromFile, rawText, fallbackSupervisor, defaultJornadaMin, existingNamesSet]);

  if (!isOpen) return null;

  const readyRows = parsedRows.filter(
    (r) => r.status === 'ok' || (!skipDuplicates && r.status === 'duplicate')
  );
  const duplicatesCount = parsedRows.filter((r) => r.status === 'duplicate').length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) {
          setParseError('A planilha enviada está vazia.');
          return;
        }
        const sheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: ''
        });
        setRawMatrixFromFile(rows.filter((r) => Array.isArray(r) && r.some((c) => String(c ?? '').trim() !== '')));
        setFileName(file.name);
        setRawText('');
      } catch (err: unknown) {
        setParseError(
          `Não foi possível ler o arquivo: ${err instanceof Error ? err.message : 'formato inválido'}`
        );
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      ['OPERADOR', 'SUPERVISOR', 'ENTRADA', 'SAIDA', 'JORNADA'],
      ['CARLOS EDUARDO DA SILVA', 'FERNANDA ALVES PEREIRA', '08:00:00', '14:20:00', 380],
      ['MARIANA OLIVEIRA SANTOS', 'FERNANDA ALVES PEREIRA', '08:00:00', '14:20:00', 380],
      ['LUCAS HENRIQUE COSTA', 'RAFAEL MENDES LIMA', '14:00:00', '20:20:00', 380]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateRows);
    ws['!cols'] = [{ wch: 30 }, { wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Operadores');
    XLSX.writeFile(wb, 'MODELO_IMPORTACAO_OPERADORES_WFM.xlsx');
  };

  const handleInsertSample = () => {
    setRawMatrixFromFile(null);
    setFileName(null);
    setParseError(null);
    setRawText(
      [
        'OPERADOR\tSUPERVISOR\tENTRADA\tSAIDA\tJORNADA',
        'CARLOS EDUARDO DA SILVA\tFERNANDA ALVES PEREIRA\t08:00:00\t14:20:00\t380',
        'MARIANA OLIVEIRA SANTOS\tFERNANDA ALVES PEREIRA\t08:00:00\t14:20:00\t380',
        'LUCAS HENRIQUE COSTA\tRAFAEL MENDES LIMA\t14:00:00\t20:20:00\t380'
      ].join('\n')
    );
  };

  const handleConfirm = () => {
    if (readyRows.length === 0) return;
    const baseTs = Date.now();
    const baseOpIdx = existingOperators.length;

    const newOperators: Operator[] = [];
    const newMonthlyMap: Record<string, OperatorMonthlyData> = {};

    readyRows.forEach((row, idx) => {
      const id = `op-${baseTs}-${idx}`;
      newOperators.push({
        id,
        nome: row.nome,
        supervisor: row.supervisor,
        entrada: row.entrada,
        saida: row.saida,
        jornadaMin: row.jornadaMin,
        offDayOfWeek: folgaMode.includes('sab') ? 7 : 1,
        operacaoId: operationId
      });

      newMonthlyMap[id] = {
        operatorId: id,
        dias: generateMonthDays(year, month, baseOpIdx + idx, folgaMode)
      };
    });

    onBulkAddOperators(newOperators, newMonthlyMap);
    setRawText('');
    setRawMatrixFromFile(null);
    setFileName(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-backdrop-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#006772] text-white flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Importar Equipe em Lote · {operationName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cole direto do Excel/Google Sheets ou envie arquivo .xlsx / .csv para cadastrar supervisores e colaboradores de uma vez.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Quick Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <label className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Enviar Arquivo (.xlsx / .csv)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Modelo Excel</span>
              </button>

              <button
                type="button"
                onClick={handleInsertSample}
                className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#006772] dark:text-[#2dd4bf] hover:underline cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Preencher Exemplo</span>
              </button>
            </div>

            {fileName && (
              <div className="flex items-center gap-2 text-xs text-[#006772] dark:text-[#2dd4bf] font-semibold">
                <span>Arquivo: {fileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFileName(null);
                    setRawMatrixFromFile(null);
                  }}
                  className="text-rose-600 hover:underline font-normal cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          {/* Paste Input */}
          {!rawMatrixFromFile && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Ou cole as linhas aqui (Colunas: Operador | Supervisor | Entrada | Saída | Jornada):
              </label>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => {
                  setParseError(null);
                  setRawText(e.target.value);
                }}
                placeholder={
                  'OPERADOR\tSUPERVISOR\tENTRADA\tSAIDA\tJORNADA\nCARLOS EDUARDO DA SILVA\tFERNANDA ALVES\t08:00\t14:20\t380'
                }
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#006772]/30"
              />
            </div>
          )}

          {/* Import Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Supervisor padrão (se coluna vazia):
              </label>
              <input
                type="text"
                value={fallbackSupervisor}
                onChange={(e) => setFallbackSupervisor(e.target.value)}
                placeholder="Ex: SUPERVISÃO GERAL"
                className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 uppercase"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Escala 6x1 inicial no mês:
              </label>
              <select
                value={folgaMode}
                onChange={(e) => setFolgaMode(e.target.value as WeekendFolgaMode)}
                className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="auto">Automático (Alternar Dom/Sáb)</option>
                <option value="4-dom">4 Domingos</option>
                <option value="4-sab">4 Sábados</option>
                <option value="3-dom">3 Domingos</option>
                <option value="3-sab">3 Sábados</option>
                <option value="all-dom">Todos os Domingos</option>
                <option value="all-sab">Todos os Sábados</option>
              </select>
            </div>

            <div className="flex items-end pb-1.5">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="rounded border-slate-300 text-[#006772] focus:ring-[#006772]"
                />
                <span>Ignorar nomes já cadastrados ({duplicatesCount})</span>
              </label>
            </div>
          </div>

          {parseError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Pré-visualização ({parsedRows.length} linha(s) lida(s))
                </span>
                <span className="font-mono tabular-nums text-[#006772] dark:text-[#2dd4bf] font-semibold">
                  {readyRows.length} pronto(s) para importar
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#005059] text-white text-[11px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Operador</th>
                      <th className="py-2 px-3">Supervisor</th>
                      <th className="py-2 px-3 text-center">Entrada</th>
                      <th className="py-2 px-3 text-center">Saída</th>
                      <th className="py-2 px-3 text-center">Jornada</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={`${row.lineNumber}-${idx}`}
                        className={
                          row.status === 'duplicate' && skipDuplicates
                            ? 'opacity-55 bg-amber-50/40 dark:bg-amber-950/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }
                      >
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {row.nome}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                          {row.supervisor}
                        </td>
                        <td className="py-2 px-3 text-center font-mono tabular-nums">
                          {row.entrada}
                        </td>
                        <td className="py-2 px-3 text-center font-mono tabular-nums">
                          {row.saida}
                        </td>
                        <td className="py-2 px-3 text-center font-mono tabular-nums">
                          {row.jornadaMin}m
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.status === 'ok' ? (
                            <span className="text-[#006772] dark:text-[#2dd4bf] font-semibold">
                              Pronto
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                              {row.reason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Supervisores novos na planilha são vinculados automaticamente à operação.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={readyRows.length === 0}
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006772] hover:bg-[#005059] rounded-lg shadow-xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Importar {readyRows.length} Colaborador(es)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
