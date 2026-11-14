import ExcelJS from 'exceljs';
import { Operation, Operator, OperatorMonthlyData } from '../types/abs';
import {
  calculateOperationSummary,
  calculateOperatorStats,
  formatMinutesToHours
} from './calculations';
import { formatMonthLabel, getDaysInMonth, parseMonthKey } from './calendar';

export interface ExcelExportStyleConfig {
  presetId: string;
  headerColor: string;
  headerTextColor: string;
  highlightColor: string;
  zebraColor: string;
  enableZebra: boolean;
  highlightCriticalRows: boolean;
  criticalRowColor: string;
}

export interface ExcelStylePreset {
  id: string;
  name: string;
  description: string;
  config: Omit<ExcelExportStyleConfig, 'presetId' | 'enableZebra' | 'highlightCriticalRows'>;
}

export const EXCEL_STYLE_PRESETS: ExcelStylePreset[] = [
  {
    id: 'jsd-teal',
    name: 'JSD Corporativo',
    description: 'Teal institucional e destaque suave',
    config: {
      headerColor: '#005059',
      headerTextColor: '#FFFFFF',
      highlightColor: '#E6F4F5',
      zebraColor: '#F8FAFC',
      criticalRowColor: '#FFF1F2'
    }
  },
  {
    id: 'navy-exec',
    name: 'Executivo Marinho',
    description: 'Azul marinho clássico para diretoria',
    config: {
      headerColor: '#1E3A8A',
      headerTextColor: '#FFFFFF',
      highlightColor: '#DBEAFE',
      zebraColor: '#F8FAFC',
      criticalRowColor: '#FFE4E6'
    }
  },
  {
    id: 'slate-amber',
    name: 'Grafite & Ouro',
    description: 'Cinza executivo com destaque âmbar',
    config: {
      headerColor: '#1E293B',
      headerTextColor: '#FFFFFF',
      highlightColor: '#FEF3C7',
      zebraColor: '#F8FAFC',
      criticalRowColor: '#FEE2E2'
    }
  },
  {
    id: 'emerald-pro',
    name: 'Esmeralda Gestão',
    description: 'Verde escuro com realce menta',
    config: {
      headerColor: '#064E3B',
      headerTextColor: '#FFFFFF',
      highlightColor: '#D1FAE5',
      zebraColor: '#F0FDF4',
      criticalRowColor: '#FFE4E6'
    }
  },
  {
    id: 'burgundy-board',
    name: 'Vinho Diretoria',
    description: 'Bordô sóbrio para apresentações',
    config: {
      headerColor: '#6B1D3B',
      headerTextColor: '#FFFFFF',
      highlightColor: '#FCE7F3',
      zebraColor: '#FFF5F7',
      criticalRowColor: '#FEE2E2'
    }
  }
];

export const DEFAULT_EXCEL_STYLE: ExcelExportStyleConfig = {
  presetId: 'jsd-teal',
  ...EXCEL_STYLE_PRESETS[0].config,
  enableZebra: true,
  highlightCriticalRows: false
};

const EXCEL_STYLE_STORAGE_KEY = 'jsd_wfm_excel_style_v1';

export function loadExcelStyleConfig(): ExcelExportStyleConfig {
  try {
    const raw = localStorage.getItem(EXCEL_STYLE_STORAGE_KEY);
    if (!raw) return DEFAULT_EXCEL_STYLE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_EXCEL_STYLE,
      ...parsed
    };
  } catch {
    return DEFAULT_EXCEL_STYLE;
  }
}

export function saveExcelStyleConfig(config: ExcelExportStyleConfig): void {
  try {
    localStorage.setItem(EXCEL_STYLE_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage quota errors
  }
}

function normalizeHex(hex: string, fallback: string): string {
  const clean = (hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(clean)) return `#${clean.toUpperCase()}`;
  return fallback;
}

function hexToArgb(hex: string, fallback = '#005059'): string {
  const norm = normalizeHex(hex, fallback);
  return `FF${norm.slice(1)}`;
}

function isDarkHex(hex: string): boolean {
  const norm = normalizeHex(hex, '#FFFFFF').slice(1);
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.56;
}

function darkenHex(hex: string, factor = 0.72): string {
  const norm = normalizeHex(hex, '#005059').slice(1);
  const r = Math.max(0, Math.min(255, Math.round(parseInt(norm.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(norm.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(norm.slice(4, 6), 16) * factor)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

interface ResolvedExcelTheme {
  headerBg: string;
  headerText: string;
  headerBorder: string;
  highlightBg: string;
  highlightText: string;
  highlightBorder: string;
  zebraBg: string;
  enableZebra: boolean;
  highlightCriticalRows: boolean;
  criticalRowBg: string;
}

function resolveExcelTheme(styleConfig?: ExcelExportStyleConfig): ResolvedExcelTheme {
  const cfg = styleConfig || loadExcelStyleConfig();
  const headerHex = normalizeHex(cfg.headerColor, DEFAULT_EXCEL_STYLE.headerColor);
  const headerTextHex = normalizeHex(cfg.headerTextColor, DEFAULT_EXCEL_STYLE.headerTextColor);
  const highlightHex = normalizeHex(cfg.highlightColor, DEFAULT_EXCEL_STYLE.highlightColor);
  const zebraHex = normalizeHex(cfg.zebraColor, DEFAULT_EXCEL_STYLE.zebraColor);
  const criticalHex = normalizeHex(cfg.criticalRowColor, DEFAULT_EXCEL_STYLE.criticalRowColor);

  return {
    headerBg: hexToArgb(headerHex),
    headerText: hexToArgb(headerTextHex),
    headerBorder: hexToArgb(darkenHex(headerHex, 0.72)),
    highlightBg: hexToArgb(highlightHex),
    highlightText: isDarkHex(highlightHex) ? 'FFFFFFFF' : 'FF0F172A',
    highlightBorder: hexToArgb(headerHex),
    zebraBg: hexToArgb(zebraHex),
    enableZebra: cfg.enableZebra,
    highlightCriticalRows: cfg.highlightCriticalRows,
    criticalRowBg: hexToArgb(criticalHex)
  };
}

const COLORS = {
  TEAL_DARK: 'FF005059',
  TEAL_PRIMARY: 'FF006772',
  TEAL_SOFT: 'FFE6F4F5',
  TEAL_TOTAL: 'FFCCFBF1',
  GOLD_SOFT: 'FFFEF3C7',
  GOLD_TEXT: 'FF92400E',
  GREEN_SOFT: 'FFDCFCE7',
  GREEN_TEXT: 'FF065F46',
  ROSE_SOFT: 'FFFFE4E6',
  ROSE_TEXT: 'FF9F1239',
  BLUE_SOFT: 'FFDBEAFE',
  BLUE_TEXT: 'FF1E40AF',
  CYAN_SOFT: 'FFCFFAFE',
  CYAN_TEXT: 'FF155E75',
  SLATE_ZEBRA: 'FFF8FAFC',
  SLATE_MUTED_BG: 'FFF1F5F9',
  SLATE_MUTED_TEXT: 'FF64748B',
  BORDER: 'FFCBD5E1',
  BORDER_DARK: 'FF003E45',
  TEXT_DARK: 'FF0F172A',
  WHITE: 'FFFFFFFF'
} as const;

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.BORDER } },
  left: { style: 'thin', color: { argb: COLORS.BORDER } },
  bottom: { style: 'thin', color: { argb: COLORS.BORDER } },
  right: { style: 'thin', color: { argb: COLORS.BORDER } }
};

function sanitizeFilePart(text: string): string {
  return (text || 'operacao')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase();
}

function getOperationSupervisors(op: Operation, opOperators: Operator[]): string[] {
  const set = new Set<string>(op.supervisores || []);
  opOperators.forEach((o) => {
    if (o.supervisor) set.add(o.supervisor);
  });
  return Array.from(set);
}

function getColLetter(colNum: number): string {
  let letter = '';
  let n = colNum;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function applyBanner(
  ws: ExcelJS.Worksheet,
  totalCols: number,
  title: string,
  subtitle: string,
  theme: ResolvedExcelTheme
): void {
  const lastCol = getColLetter(totalCols);

  ws.mergeCells(`A1:${lastCol}1`);
  const row1 = ws.getRow(1);
  row1.height = 30;
  const titleCell = ws.getCell('A1');
  titleCell.value = title;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: theme.headerText } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  ws.mergeCells(`A2:${lastCol}2`);
  const row2 = ws.getRow(2);
  row2.height = 20;
  const subCell = ws.getCell('A2');
  subCell.value = subtitle;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: theme.highlightText } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.highlightBg } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  subCell.border = {
    bottom: { style: 'medium', color: { argb: theme.highlightBorder } }
  };

  ws.getRow(3).height = 10;
}

function styleTableHeaderRow(
  row: ExcelJS.Row,
  colCount: number,
  theme: ResolvedExcelTheme
): void {
  row.height = 24;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: theme.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: theme.headerBorder } },
      left: { style: 'thin', color: { argb: theme.headerBorder } },
      bottom: { style: 'medium', color: { argb: theme.headerBorder } },
      right: { style: 'thin', color: { argb: theme.headerBorder } }
    };
  }
}

function styleAbsBadge(
  cell: ExcelJS.Cell,
  absDecimal: number,
  metaLimit: number,
  isEmpty = false,
  theme?: ResolvedExcelTheme
): void {
  cell.numFmt = '0.00%';
  cell.alignment = { vertical: 'middle', horizontal: 'right' };
  if (isEmpty) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SLATE_MUTED_BG } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.SLATE_MUTED_TEXT } };
    return;
  }
  if (absDecimal === 0) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GREEN_SOFT } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.GREEN_TEXT } };
  } else if (absDecimal <= metaLimit) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: theme ? theme.highlightBg : COLORS.TEAL_SOFT }
    };
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: theme ? theme.highlightText : COLORS.TEAL_DARK }
    };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ROSE_SOFT } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.ROSE_TEXT } };
  }
}

function styleStatusBadge(cell: ExcelJS.Cell, statusText: string): void {
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  if (statusText === 'Dentro da Meta') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GREEN_SOFT } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.GREEN_TEXT } };
  } else if (statusText === 'Acima da Meta') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ROSE_SOFT } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.ROSE_TEXT } };
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GOLD_SOFT } };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.GOLD_TEXT } };
  }
}

function getRowBg(
  idx: number,
  isCritical: boolean,
  theme: ResolvedExcelTheme
): string {
  if (theme.highlightCriticalRows && isCritical) {
    return theme.criticalRowBg;
  }
  if (theme.enableZebra && idx % 2 === 1) {
    return theme.zebraBg;
  }
  return COLORS.WHITE;
}

function autoFitColumns(ws: ExcelJS.Worksheet, minWidth = 10, maxWidth = 40, startRow = 4): void {
  ws.columns.forEach((col, colIdx) => {
    let maxLen = minWidth;
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < startRow) return;
      const cell = row.getCell(colIdx + 1);
      const val = cell.value;
      const text =
        val === null || val === undefined
          ? ''
          : typeof val === 'object' && 'richText' in val
          ? ''
          : String(val);
      maxLen = Math.max(maxLen, text.length + 4);
    });
    col.width = Math.min(maxWidth, maxLen);
  });
}

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports a richly styled, color-coded, filterable Excel (.xlsx) workbook for a single operation.
 */
export async function exportOperationExcelReport(params: {
  operation: Operation;
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  selectedMonthKey: string;
  periodSummaryLabel?: string;
  styleConfig?: ExcelExportStyleConfig;
}): Promise<void> {
  const { operation, operators, monthlyData, selectedMonthKey, periodSummaryLabel, styleConfig } = params;
  const theme = resolveExcelTheme(styleConfig);
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const { year, month } = parseMonthKey(selectedMonthKey);
  const totalDays = getDaysInMonth(year, month);
  const supervisors = getOperationSupervisors(operation, operators);
  const summary = calculateOperationSummary(operators, monthlyData, supervisors);
  const metaLimit = operation.metaAbs || 0.03;
  const generatedStr = new Date().toLocaleString('pt-BR');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'JSD Telecom · WFM ABS';
  wb.created = new Date();

  // =========================================================================
  // ABA 1: RESUMO EXECUTIVO (KPIs + Tabela de Supervisões com Filtro)
  // =========================================================================
  const wsResumo = wb.addWorksheet('Resumo Executivo', {
    properties: { tabColor: { argb: theme.headerBg } }
  });
  applyBanner(
    wsResumo,
    6,
    `JSD TELECOM · RELATÓRIO GERENCIAL WFM — ${operation.nome.toUpperCase()}`,
    `Cliente: ${operation.cliente}   |   Competência: ${monthLabel} (${periodSummaryLabel || 'Mês Integral'})   |   Meta ABS ≤ ${(metaLimit * 100).toFixed(1)}%   |   Gerado em: ${generatedStr}`,
    theme
  );

  // Bloco de Indicadores Consolidados (Linhas 4..10)
  const kpiPairs: Array<[string, string | number, string, string | number, string, string | number]> = [
    [
      'ABS Geral (%)',
      summary.absGeral,
      'Minutos Perdidos',
      summary.totalMinutosPerdidos,
      'Minutos Escalados',
      summary.totalMinutosEscalados
    ],
    [
      'Status vs Meta',
      operators.length === 0
        ? 'Em Aberto'
        : summary.absGeral <= metaLimit
        ? 'Dentro da Meta'
        : 'Acima da Meta',
      'Horas Perdidas',
      formatMinutesToHours(summary.totalMinutosPerdidos),
      'Colaboradores Ativos',
      summary.totalOperadores
    ],
    [
      'Supervisores Ativos',
      supervisors.length,
      'Faltas / Atestados / Susp.',
      `${summary.totalFaltas}d / ${summary.totalAtestados}d / ${summary.totalSuspensoes}d`,
      'Atrasos / Decl. ABS / BH',
      `${summary.totalMinutosAtraso}m / ${summary.totalMinutosAbonados}m / ${summary.totalMinutosAbonoLegal}m`
    ]
  ];

  kpiPairs.forEach((vals, i) => {
    const r = wsResumo.getRow(4 + i);
    r.height = 22;
    vals.forEach((v, idx) => {
      const cell = r.getCell(idx + 1);
      cell.value = v;
      cell.border = THIN_BORDER;
      if (idx % 2 === 0) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: theme.highlightText } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.highlightBg } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.WHITE } };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (i === 0 && idx === 1) {
          styleAbsBadge(cell, Number(v), metaLimit, operators.length === 0, theme);
        } else if (i === 1 && idx === 1) {
          styleStatusBadge(cell, String(v));
        } else if (typeof v === 'number') {
          cell.numFmt = '#,##0';
        }
      }
    });
  });

  wsResumo.getRow(7).height = 12;

  // Tabela por Supervisão (Linha 8 = Cabeçalho com AutoFilter)
  const supHeaderRowNum = 8;
  const supHeaderRow = wsResumo.getRow(supHeaderRowNum);
  supHeaderRow.values = [
    'SUPERVISOR',
    'COLABORADORES',
    'MIN. PERDIDOS',
    'MIN. ESCALADOS',
    'ABS (%)',
    'STATUS META'
  ];
  styleTableHeaderRow(supHeaderRow, 6, theme);

  const sortedSups = [...summary.supervisores].sort((a, b) => a.absPercent - b.absPercent);
  let supRowCursor = supHeaderRowNum;

  sortedSups.forEach((sup, idx) => {
    supRowCursor++;
    const r = wsResumo.getRow(supRowCursor);
    r.height = 20;
    const statusText =
      sup.totalOperadores === 0
        ? 'Em Aberto'
        : sup.absPercent <= metaLimit
        ? 'Dentro da Meta'
        : 'Acima da Meta';

    r.values = [
      sup.supervisor,
      sup.totalOperadores,
      sup.minutosPerdidos,
      sup.minutosEscalados,
      sup.absPercent,
      statusText
    ];

    const zebraBg = getRowBg(idx, statusText === 'Acima da Meta', theme);
    for (let c = 1; c <= 6; c++) {
      const cell = r.getCell(c);
      cell.border = THIN_BORDER;
      cell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: c === 1 ? 'left' : c === 2 || c === 6 ? 'center' : 'right'
      };
      if (c === 2 || c === 3 || c === 4) {
        cell.numFmt = '#,##0';
      }
    }
    styleAbsBadge(r.getCell(5), sup.absPercent, metaLimit, sup.totalOperadores === 0, theme);
    styleStatusBadge(r.getCell(6), statusText);
  });

  if (sortedSups.length === 0) {
    supRowCursor++;
    const emptyRow = wsResumo.getRow(supRowCursor);
    emptyRow.values = ['Nenhum supervisor cadastrado nesta operação', 0, 0, 0, 0, 'Em Aberto'];
    emptyRow.height = 20;
    for (let c = 1; c <= 6; c++) {
      emptyRow.getCell(c).border = THIN_BORDER;
    }
  }

  // Linha de Total Geral de Supervisões
  const supTotalRowNum = supRowCursor + 1;
  const supTotalRow = wsResumo.getRow(supTotalRowNum);
  supTotalRow.height = 22;
  supTotalRow.values = [
    'TOTAL DA OPERAÇÃO',
    summary.totalOperadores,
    summary.totalMinutosPerdidos,
    summary.totalMinutosEscalados,
    summary.absGeral,
    operators.length === 0
      ? 'Em Aberto'
      : summary.absGeral <= metaLimit
      ? 'Dentro da Meta'
      : 'Acima da Meta'
  ];
  for (let c = 1; c <= 6; c++) {
    const cell = supTotalRow.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: theme.highlightText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.highlightBg } };
    cell.border = {
      top: { style: 'medium', color: { argb: theme.highlightBorder } },
      bottom: { style: 'medium', color: { argb: theme.highlightBorder } },
      left: { style: 'thin', color: { argb: COLORS.BORDER } },
      right: { style: 'thin', color: { argb: COLORS.BORDER } }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: c === 1 ? 'left' : c === 2 || c === 6 ? 'center' : 'right'
    };
    if (c === 2 || c === 3 || c === 4) cell.numFmt = '#,##0';
  }
  supTotalRow.getCell(5).numFmt = '0.00%';

  wsResumo.autoFilter = {
    from: { row: supHeaderRowNum, column: 1 },
    to: { row: supRowCursor, column: 6 }
  };
  wsResumo.views = [{ state: 'frozen', ySplit: supHeaderRowNum, showGridLines: true }];
  wsResumo.columns = [
    { width: 32 },
    { width: 18 },
    { width: 20 },
    { width: 20 },
    { width: 18 },
    { width: 24 }
  ];

  // =========================================================================
  // ABA 2: COLABORADORES (Com filtros em todas as colunas + cores de meta)
  // =========================================================================
  const wsOps = wb.addWorksheet('Colaboradores', {
    properties: { tabColor: { argb: theme.highlightBorder } }
  });
  const opHeaders = [
    'OPERADOR',
    'SUPERVISOR',
    'ENTRADA',
    'SAÍDA',
    'JORNADA (MIN)',
    'DIAS TRAB.',
    'DSR',
    'FALTAS',
    'ATESTADOS',
    'ATRASO (MIN)',
    'DECL. ABS (MIN)',
    'BH LEGAL (MIN)',
    'MIN. PERDIDOS',
    'MIN. ESCALADOS',
    'ABS (%)',
    'SITUAÇÃO'
  ];
  applyBanner(
    wsOps,
    opHeaders.length,
    `DETALHAMENTO DE COLABORADORES · ${operation.nome.toUpperCase()}`,
    `Competência: ${monthLabel} (${periodSummaryLabel || 'Mês Integral'})   |   Use os filtros no cabeçalho para filtrar por Supervisor, Situação ou ABS`,
    theme
  );

  const opsHeaderRowNum = 4;
  const opsHeaderRow = wsOps.getRow(opsHeaderRowNum);
  opsHeaderRow.values = opHeaders;
  styleTableHeaderRow(opsHeaderRow, opHeaders.length, theme);

  const sortedOperators = [...operators].sort((a, b) => {
    const stA = calculateOperatorStats((monthlyData[a.id] || { dias: [] }).dias, a.jornadaMin);
    const stB = calculateOperatorStats((monthlyData[b.id] || { dias: [] }).dias, b.jornadaMin);
    return stB.absMensal - stA.absMensal;
  });

  let opsCursor = opsHeaderRowNum;
  sortedOperators.forEach((op, idx) => {
    opsCursor++;
    const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
    const st = calculateOperatorStats(data.dias, op.jornadaMin);
    let delayMins = 0;
    data.dias.forEach((d) => {
      if (d.status === 'dia ok/atraso') {
        delayMins += Math.max(0, Math.min(op.jornadaMin, Number(d.atraso) || 0));
      }
    });
    const statusText = st.absMensal <= metaLimit ? 'Dentro da Meta' : 'Acima da Meta';

    const r = wsOps.getRow(opsCursor);
    r.height = 20;
    r.values = [
      op.nome,
      op.supervisor,
      op.entrada,
      op.saida,
      op.jornadaMin,
      st.diasTrabalhados,
      st.diasFolga,
      st.diasFalta,
      st.diasAtestado,
      delayMins,
      st.minutosAbonados,
      st.minutosAbonoLegal,
      st.minutosPerdidos,
      st.minutosEscalados,
      st.absMensal,
      statusText
    ];

    const zebraBg = getRowBg(idx, statusText === 'Acima da Meta', theme);
    for (let c = 1; c <= opHeaders.length; c++) {
      const cell = r.getCell(c);
      cell.border = THIN_BORDER;
      cell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: c <= 2 ? 'left' : c <= 4 || c === 16 ? 'center' : 'right'
      };
      if (c >= 5 && c <= 14) {
        cell.numFmt = '#,##0';
      }
      if (c === 13 && st.minutosPerdidos > 0) {
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.ROSE_TEXT } };
      }
    }
    styleAbsBadge(r.getCell(15), st.absMensal, metaLimit, false, theme);
    styleStatusBadge(r.getCell(16), statusText);
  });

  if (sortedOperators.length > 0) {
    wsOps.autoFilter = {
      from: { row: opsHeaderRowNum, column: 1 },
      to: { row: opsCursor, column: opHeaders.length }
    };
  }
  wsOps.views = [{ state: 'frozen', ySplit: opsHeaderRowNum, xSplit: 1, showGridLines: true }];
  autoFitColumns(wsOps, 12, 34, opsHeaderRowNum);

  // =========================================================================
  // ABA 3: BASE MATRIZ DIÁRIA (Colorida por Status + Filtros)
  // =========================================================================
  const wsMatrix = wb.addWorksheet('Base Matriz', {
    properties: { tabColor: { argb: 'FFD89627' } }
  });
  const matrixHeaders: string[] = ['OPERADOR', 'SUPERVISOR', 'ABS (%)'];
  for (let d = 1; d <= totalDays; d++) {
    matrixHeaders.push(`D${String(d).padStart(2, '0')}`);
  }

  applyBanner(
    wsMatrix,
    matrixHeaders.length,
    `BASE MATRIZ DIÁRIA · ${operation.nome.toUpperCase()} (${monthLabel})`,
    'Legenda de cores: Verde = OK  |  Vermelho = Falta / Suspensão  |  Azul = Atestado  |  Âmbar = Atraso / Declaração ABS  |  Ciano = BH / Abono Legal / Aniv.  |  Cinza = DSR',
    theme
  );

  const matrixHeaderRowNum = 4;
  const matrixHeaderRow = wsMatrix.getRow(matrixHeaderRowNum);
  matrixHeaderRow.values = matrixHeaders;
  styleTableHeaderRow(matrixHeaderRow, matrixHeaders.length, theme);

  let matrixCursor = matrixHeaderRowNum;
  sortedOperators.forEach((op, idx) => {
    matrixCursor++;
    const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
    const st = calculateOperatorStats(data.dias, op.jornadaMin);
    const rowVals: Array<string | number> = [op.nome, op.supervisor, st.absMensal];

    const dayColors: Array<{ bg: string; fg: string; bold?: boolean }> = [];

    for (let d = 1; d <= totalDays; d++) {
      const rec = data.dias.find((item) => item.dia === d);
      if (!rec) {
        rowVals.push('—');
        dayColors.push({ bg: COLORS.WHITE, fg: COLORS.SLATE_MUTED_TEXT });
      } else if (rec.status === 'dia ok') {
        rowVals.push('OK');
        dayColors.push({ bg: COLORS.GREEN_SOFT, fg: COLORS.GREEN_TEXT });
      } else if (rec.status === 'dia ok/atraso') {
        rowVals.push(`ATR ${rec.atraso}m`);
        dayColors.push({ bg: COLORS.GOLD_SOFT, fg: COLORS.GOLD_TEXT, bold: true });
      } else if (rec.status === 'abono') {
        rowVals.push(`DECL ${rec.abonoMin || 0}m`);
        dayColors.push({ bg: COLORS.GOLD_SOFT, fg: COLORS.GOLD_TEXT, bold: true });
      } else if (rec.status === 'abono_legal') {
        rowVals.push(`AL ${rec.abonoMin || 0}m`);
        dayColors.push({ bg: COLORS.CYAN_SOFT, fg: COLORS.CYAN_TEXT });
      } else if (rec.status === 'banco_horas_integral') {
        rowVals.push('BH');
        dayColors.push({ bg: COLORS.CYAN_SOFT, fg: COLORS.CYAN_TEXT });
      } else if (rec.status === 'folga_aniversario') {
        rowVals.push('ANIV');
        dayColors.push({ bg: COLORS.CYAN_SOFT, fg: COLORS.CYAN_TEXT });
      } else if (rec.status === 'falta') {
        rowVals.push('FALTA');
        dayColors.push({ bg: COLORS.ROSE_SOFT, fg: COLORS.ROSE_TEXT, bold: true });
      } else if (rec.status === 'atestado') {
        rowVals.push('ATEST');
        dayColors.push({ bg: COLORS.BLUE_SOFT, fg: COLORS.BLUE_TEXT, bold: true });
      } else if (rec.status === 'suspensão') {
        rowVals.push('SUSP');
        dayColors.push({ bg: COLORS.ROSE_SOFT, fg: COLORS.ROSE_TEXT, bold: true });
      } else {
        rowVals.push('DSR');
        dayColors.push({ bg: COLORS.SLATE_MUTED_BG, fg: COLORS.SLATE_MUTED_TEXT });
      }
    }

    const r = wsMatrix.getRow(matrixCursor);
    r.height = 19;
    r.values = rowVals;
    const zebraBg = getRowBg(idx, st.absMensal > metaLimit, theme);

    for (let c = 1; c <= 2; c++) {
      const cell = r.getCell(c);
      cell.border = THIN_BORDER;
      cell.font = { name: 'Calibri', size: 10, bold: c === 1, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }
    const absCell = r.getCell(3);
    absCell.border = THIN_BORDER;
    styleAbsBadge(absCell, st.absMensal, metaLimit, false, theme);

    dayColors.forEach((dc, dIdx) => {
      const cell = r.getCell(4 + dIdx);
      cell.border = THIN_BORDER;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dc.bg } };
      cell.font = { name: 'Calibri', size: 9, bold: Boolean(dc.bold), color: { argb: dc.fg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  if (sortedOperators.length > 0) {
    wsMatrix.autoFilter = {
      from: { row: matrixHeaderRowNum, column: 1 },
      to: { row: matrixCursor, column: matrixHeaders.length }
    };
  }
  wsMatrix.views = [{ state: 'frozen', ySplit: matrixHeaderRowNum, xSplit: 3, showGridLines: true }];
  wsMatrix.getColumn(1).width = 30;
  wsMatrix.getColumn(2).width = 24;
  wsMatrix.getColumn(3).width = 11;
  for (let d = 1; d <= totalDays; d++) {
    wsMatrix.getColumn(3 + d).width = 9;
  }

  const filename = `RELATORIO_WFM_${sanitizeFilePart(operation.nome)}_${selectedMonthKey}.xlsx`;
  await downloadWorkbook(wb, filename);
}

/**
 * Exports a richly styled, color-coded, filterable multi-operation Excel (.xlsx) workbook.
 */
export async function exportMultiOperationExcelReport(params: {
  operations: Operation[];
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  selectedMonthKey: string;
  styleConfig?: ExcelExportStyleConfig;
}): Promise<void> {
  const { operations, operators, monthlyData, selectedMonthKey, styleConfig } = params;
  const theme = resolveExcelTheme(styleConfig);
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const generatedStr = new Date().toLocaleString('pt-BR');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'JSD Telecom · WFM ABS';
  wb.created = new Date();

  const enriched = operations
    .map((op) => {
      const opOps = operators.filter((o) => (o.operacaoId || 'caern') === op.id);
      const sups = getOperationSupervisors(op, opOps);
      const summary = calculateOperationSummary(opOps, monthlyData, sups);
      return { op, opOps, sups, summary };
    })
    .sort((a, b) => {
      if (a.opOps.length === 0 && b.opOps.length > 0) return 1;
      if (b.opOps.length === 0 && a.opOps.length > 0) return -1;
      return a.summary.absGeral - b.summary.absGeral;
    });

  const totalPerdidos = enriched.reduce((acc, r) => acc + r.summary.totalMinutosPerdidos, 0);
  const totalEscalados = enriched.reduce((acc, r) => acc + r.summary.totalMinutosEscalados, 0);
  const totalSups = enriched.reduce((acc, r) => acc + r.sups.length, 0);
  const globalAbs = totalEscalados > 0 ? totalPerdidos / totalEscalados : 0;

  // =========================================================================
  // ABA 1: RANKING OPERAÇÕES (Com cores de status + filtros automáticos)
  // =========================================================================
  const wsRanking = wb.addWorksheet('Ranking Operações', {
    properties: { tabColor: { argb: theme.headerBg } }
  });
  const rankHeaders = [
    'POSIÇÃO',
    'OPERAÇÃO',
    'CLIENTE',
    'SUPERVISORES',
    'COLABORADORES',
    'MIN. PERDIDOS',
    'MIN. ESCALADOS',
    'HORAS PERDIDAS',
    'META (%)',
    'ABS (%)',
    'SITUAÇÃO'
  ];

  applyBanner(
    wsRanking,
    rankHeaders.length,
    'JSD TELECOM · CONSOLIDADO EXECUTIVO MULTI-OPERAÇÕES',
    `Competência: ${monthLabel}   |   ABS Consolidado: ${(globalAbs * 100).toFixed(2)}%   |   Gerado em: ${generatedStr}   |   Filtros ativos na linha de cabeçalho`,
    theme
  );

  const rankHeaderRowNum = 4;
  const rankHeaderRow = wsRanking.getRow(rankHeaderRowNum);
  rankHeaderRow.values = rankHeaders;
  styleTableHeaderRow(rankHeaderRow, rankHeaders.length, theme);

  let rankCursor = rankHeaderRowNum;
  enriched.forEach(({ op, opOps, sups, summary }, idx) => {
    rankCursor++;
    const metaLimit = op.metaAbs || 0.03;
    const status =
      opOps.length === 0
        ? 'Em Aberto'
        : summary.absGeral <= metaLimit
        ? 'Dentro da Meta'
        : 'Acima da Meta';

    const r = wsRanking.getRow(rankCursor);
    r.height = 21;
    r.values = [
      idx + 1,
      op.nome,
      op.cliente,
      sups.length,
      opOps.length,
      summary.totalMinutosPerdidos,
      summary.totalMinutosEscalados,
      formatMinutesToHours(summary.totalMinutosPerdidos),
      metaLimit,
      summary.absGeral,
      status
    ];

    const zebraBg = getRowBg(idx, status === 'Acima da Meta', theme);
    for (let c = 1; c <= rankHeaders.length; c++) {
      const cell = r.getCell(c);
      cell.border = THIN_BORDER;
      cell.font = { name: 'Calibri', size: 10, bold: c === 2, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
      cell.alignment = {
        vertical: 'middle',
        horizontal:
          c === 1 || c === 4 || c === 5 || c === 11
            ? 'center'
            : c <= 3
            ? 'left'
            : 'right'
      };
      if (c >= 4 && c <= 7) cell.numFmt = '#,##0';
      if (c === 9) cell.numFmt = '0.0%';
    }
    styleAbsBadge(r.getCell(10), summary.absGeral, metaLimit, opOps.length === 0, theme);
    styleStatusBadge(r.getCell(11), status);
  });

  // Linha Consolidada
  const rankTotalRow = wsRanking.getRow(rankCursor + 1);
  rankTotalRow.height = 23;
  rankTotalRow.values = [
    '—',
    'CONSOLIDADO JSD TELECOM',
    `${operations.length} Operações`,
    totalSups,
    operators.length,
    totalPerdidos,
    totalEscalados,
    formatMinutesToHours(totalPerdidos),
    0.03,
    globalAbs,
    globalAbs <= 0.03 ? 'Dentro da Meta' : 'Acima da Meta'
  ];
  for (let c = 1; c <= rankHeaders.length; c++) {
    const cell = rankTotalRow.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: theme.highlightText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.highlightBg } };
    cell.border = {
      top: { style: 'medium', color: { argb: theme.highlightBorder } },
      bottom: { style: 'medium', color: { argb: theme.highlightBorder } },
      left: { style: 'thin', color: { argb: COLORS.BORDER } },
      right: { style: 'thin', color: { argb: COLORS.BORDER } }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal:
        c === 1 || c === 4 || c === 5 || c === 11
          ? 'center'
          : c <= 3
          ? 'left'
          : 'right'
    };
    if (c >= 4 && c <= 7) cell.numFmt = '#,##0';
    if (c === 9) cell.numFmt = '0.0%';
    if (c === 10) cell.numFmt = '0.00%';
  }

  wsRanking.autoFilter = {
    from: { row: rankHeaderRowNum, column: 1 },
    to: { row: rankCursor, column: rankHeaders.length }
  };
  wsRanking.views = [{ state: 'frozen', ySplit: rankHeaderRowNum, showGridLines: true }];
  autoFitColumns(wsRanking, 11, 34, rankHeaderRowNum);

  // =========================================================================
  // ABA 2: SUPERVISÕES (Todas as operações com filtro por Operação/Meta)
  // =========================================================================
  const wsSup = wb.addWorksheet('Supervisões', {
    properties: { tabColor: { argb: theme.highlightBorder } }
  });
  const supHeaders = [
    'OPERAÇÃO',
    'SUPERVISOR',
    'COLABORADORES',
    'MIN. PERDIDOS',
    'MIN. ESCALADOS',
    'ABS (%)',
    'STATUS META'
  ];
  applyBanner(
    wsSup,
    supHeaders.length,
    'DESEMPENHO POR SUPERVISÃO — TODAS AS OPERAÇÕES',
    `Competência: ${monthLabel}   |   Filtre por Operação, Supervisor ou Status Meta diretamente no cabeçalho`,
    theme
  );
  const supHeaderRowNum = 4;
  const supHeaderRow = wsSup.getRow(supHeaderRowNum);
  supHeaderRow.values = supHeaders;
  styleTableHeaderRow(supHeaderRow, supHeaders.length, theme);

  let supCursor = supHeaderRowNum;
  enriched.forEach(({ op, summary }) => {
    const metaLimit = op.metaAbs || 0.03;
    summary.supervisores.forEach((s) => {
      supCursor++;
      const status =
        s.totalOperadores === 0
          ? 'Em Aberto'
          : s.absPercent <= metaLimit
          ? 'Dentro da Meta'
          : 'Acima da Meta';
      const r = wsSup.getRow(supCursor);
      r.height = 20;
      r.values = [
        op.nome,
        s.supervisor,
        s.totalOperadores,
        s.minutosPerdidos,
        s.minutosEscalados,
        s.absPercent,
        status
      ];
      const zebraBg = getRowBg(supCursor - supHeaderRowNum - 1, status === 'Acima da Meta', theme);
      for (let c = 1; c <= supHeaders.length; c++) {
        const cell = r.getCell(c);
        cell.border = THIN_BORDER;
        cell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.TEXT_DARK } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: c <= 2 ? 'left' : c === 3 || c === 7 ? 'center' : 'right'
        };
        if (c >= 3 && c <= 5) cell.numFmt = '#,##0';
      }
      styleAbsBadge(r.getCell(6), s.absPercent, metaLimit, s.totalOperadores === 0, theme);
      styleStatusBadge(r.getCell(7), status);
    });
  });

  if (supCursor > supHeaderRowNum) {
    wsSup.autoFilter = {
      from: { row: supHeaderRowNum, column: 1 },
      to: { row: supCursor, column: supHeaders.length }
    };
  }
  wsSup.views = [{ state: 'frozen', ySplit: supHeaderRowNum, showGridLines: true }];
  autoFitColumns(wsSup, 13, 34, supHeaderRowNum);

  // =========================================================================
  // ABA 3: COLABORADORES GERAL (Consolidado com filtros e status colorido)
  // =========================================================================
  const wsOps = wb.addWorksheet('Colaboradores Geral', {
    properties: { tabColor: { argb: 'FFD89627' } }
  });
  const opHeaders = [
    'OPERAÇÃO',
    'OPERADOR',
    'SUPERVISOR',
    'ENTRADA',
    'SAÍDA',
    'JORNADA (MIN)',
    'MIN. PERDIDOS',
    'MIN. ESCALADOS',
    'ABS (%)',
    'SITUAÇÃO'
  ];
  applyBanner(
    wsOps,
    opHeaders.length,
    'BASE GERAL DE COLABORADORES · JSD TELECOM',
    `Competência: ${monthLabel}   |   ${operators.length} colaborador(es) distribuído(s) entre as operações`,
    theme
  );

  const opHeaderRowNum = 4;
  const opHeaderRow = wsOps.getRow(opHeaderRowNum);
  opHeaderRow.values = opHeaders;
  styleTableHeaderRow(opHeaderRow, opHeaders.length, theme);

  let opCursor = opHeaderRowNum;
  enriched.forEach(({ op, opOps }) => {
    const metaLimit = op.metaAbs || 0.03;
    opOps.forEach((o) => {
      opCursor++;
      const d = monthlyData[o.id] || { operatorId: o.id, dias: [] };
      const st = calculateOperatorStats(d.dias, o.jornadaMin);
      const status = st.absMensal <= metaLimit ? 'Dentro da Meta' : 'Acima da Meta';
      const r = wsOps.getRow(opCursor);
      r.height = 19;
      r.values = [
        op.nome,
        o.nome,
        o.supervisor,
        o.entrada,
        o.saida,
        o.jornadaMin,
        st.minutosPerdidos,
        st.minutosEscalados,
        st.absMensal,
        status
      ];
      const zebraBg = getRowBg(opCursor - opHeaderRowNum - 1, status === 'Acima da Meta', theme);
      for (let c = 1; c <= opHeaders.length; c++) {
        const cell = r.getCell(c);
        cell.border = THIN_BORDER;
        cell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.TEXT_DARK } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: c <= 3 ? 'left' : c <= 5 || c === 10 ? 'center' : 'right'
        };
        if (c >= 6 && c <= 8) cell.numFmt = '#,##0';
      }
      styleAbsBadge(r.getCell(9), st.absMensal, metaLimit, false, theme);
      styleStatusBadge(r.getCell(10), status);
    });
  });

  if (opCursor > opHeaderRowNum) {
    wsOps.autoFilter = {
      from: { row: opHeaderRowNum, column: 1 },
      to: { row: opCursor, column: opHeaders.length }
    };
  }
  wsOps.views = [{ state: 'frozen', ySplit: opHeaderRowNum, xSplit: 2, showGridLines: true }];
  autoFitColumns(wsOps, 12, 34, opHeaderRowNum);

  await downloadWorkbook(wb, `RELATORIO_CONSOLIDADO_JSD_WFM_${selectedMonthKey}.xlsx`);
}
