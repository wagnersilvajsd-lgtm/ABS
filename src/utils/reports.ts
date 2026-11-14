import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Operation, Operator, OperatorMonthlyData } from '../types/abs';
import {
  calculateOperationSummary,
  calculateOperatorStats,
  formatMinutesToHours,
  formatPercent
} from './calculations';
import { formatMonthLabel, getDaysInMonth, parseMonthKey } from './calendar';

function sanitizeFilePart(text: string): string {
  return (text || 'operacao')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toUpperCase();
}

function setAutoColumnWidths(ws: XLSX.WorkSheet, rows: Array<Array<string | number>>) {
  const maxWidths: number[] = [];
  rows.forEach((row) => {
    row.forEach((cell, idx) => {
      const len = String(cell ?? '').length;
      maxWidths[idx] = Math.min(44, Math.max(maxWidths[idx] || 10, len + 3));
    });
  });
  ws['!cols'] = maxWidths.map((wch) => ({ wch }));
}

function getOperationSupervisors(op: Operation, opOperators: Operator[]): string[] {
  const set = new Set<string>(op.supervisores || []);
  opOperators.forEach((o) => {
    if (o.supervisor) set.add(o.supervisor);
  });
  return Array.from(set);
}

/**
 * Exports a formatted multi-sheet Excel (.xlsx) workbook for a single operation.
 */
export function exportOperationExcelReport(params: {
  operation: Operation;
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  selectedMonthKey: string;
  periodSummaryLabel?: string;
}): void {
  const { operation, operators, monthlyData, selectedMonthKey, periodSummaryLabel } = params;
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const { year, month } = parseMonthKey(selectedMonthKey);
  const totalDays = getDaysInMonth(year, month);
  const supervisors = getOperationSupervisors(operation, operators);
  const summary = calculateOperationSummary(operators, monthlyData, supervisors);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumo Executivo
  const metaPercent = (operation.metaAbs || 0.03) * 100;
  const resumoRows: Array<Array<string | number>> = [
    ['JSD TELECOM · RELATÓRIO GERENCIAL WFM DE ABSENTEÍSMO'],
    ['Operação', operation.nome, 'Cliente', operation.cliente],
    ['Competência', monthLabel, 'Recorte', periodSummaryLabel || 'Mês Integral'],
    ['Gerado em', new Date().toLocaleString('pt-BR'), 'Meta ABS', `${metaPercent.toFixed(2)}%`],
    [],
    ['INDICADORES CONSOLIDADOS', 'VALOR'],
    ['Colaboradores Ativos', summary.totalOperadores],
    ['Supervisores Ativos', supervisors.length],
    ['Minutos Escalados', summary.totalMinutosEscalados],
    ['Minutos Perdidos', summary.totalMinutosPerdidos],
    ['Horas Perdidas', formatMinutesToHours(summary.totalMinutosPerdidos)],
    ['ABS Geral (%)', Number((summary.absGeral * 100).toFixed(2))],
    ['Status Meta', summary.absGeral <= (operation.metaAbs || 0.03) ? 'DENTRO DA META' : 'ACIMA DA META'],
    ['Faltas (dias)', summary.totalFaltas],
    ['Atestados (dias)', summary.totalAtestados],
    ['Suspensões (dias)', summary.totalSuspensoes],
    ['Atrasos (min)', summary.totalMinutosAtraso],
    ['Declarações com ABS (min)', summary.totalMinutosAbonados],
    ['Abono Legal BH sem ABS (min)', summary.totalMinutosAbonoLegal],
    [],
    ['DESEMPENHO POR SUPERVISÃO', 'COLABORADORES', 'MIN. PERDIDOS', 'MIN. ESCALADOS', 'ABS (%)', 'STATUS META']
  ];

  [...summary.supervisores]
    .sort((a, b) => a.absPercent - b.absPercent)
    .forEach((sup) => {
      resumoRows.push([
        sup.supervisor,
        sup.totalOperadores,
        sup.minutosPerdidos,
        sup.minutosEscalados,
        Number((sup.absPercent * 100).toFixed(2)),
        sup.absPercent <= (operation.metaAbs || 0.03) ? 'Dentro da Meta' : 'Acima da Meta'
      ]);
    });

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoRows);
  setAutoColumnWidths(wsResumo, resumoRows);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Executivo');

  // Sheet 2: Colaboradores
  const opRows: Array<Array<string | number>> = [
    [
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
      'ABS (%)'
    ]
  ];

  operators.forEach((op) => {
    const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
    const st = calculateOperatorStats(data.dias, op.jornadaMin);
    let delayMins = 0;
    data.dias.forEach((d) => {
      if (d.status === 'dia ok/atraso') {
        delayMins += Math.max(0, Math.min(op.jornadaMin, Number(d.atraso) || 0));
      }
    });
    opRows.push([
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
      Number((st.absMensal * 100).toFixed(2))
    ]);
  });

  const wsOps = XLSX.utils.aoa_to_sheet(opRows);
  setAutoColumnWidths(wsOps, opRows);
  XLSX.utils.book_append_sheet(wb, wsOps, 'Colaboradores');

  // Sheet 3: Base Matriz Diária
  const matrixHeaders: string[] = ['OPERADOR', 'SUPERVISOR', 'ABS (%)'];
  for (let d = 1; d <= totalDays; d++) {
    matrixHeaders.push(`D${String(d).padStart(2, '0')}`);
  }
  const matrixRows: Array<Array<string | number>> = [matrixHeaders];

  operators.forEach((op) => {
    const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
    const st = calculateOperatorStats(data.dias, op.jornadaMin);
    const row: Array<string | number> = [
      op.nome,
      op.supervisor,
      Number((st.absMensal * 100).toFixed(2))
    ];
    for (let d = 1; d <= totalDays; d++) {
      const rec = data.dias.find((item) => item.dia === d);
      if (!rec) {
        row.push('—');
      } else if (rec.status === 'dia ok') {
        row.push('OK');
      } else if (rec.status === 'dia ok/atraso') {
        row.push(`ATR ${rec.atraso}m`);
      } else if (rec.status === 'abono') {
        row.push(`DECL ${rec.abonoMin || 0}m`);
      } else if (rec.status === 'abono_legal') {
        row.push(`AL ${rec.abonoMin || 0}m`);
      } else if (rec.status === 'banco_horas_integral') {
        row.push('BH');
      } else if (rec.status === 'folga_aniversario') {
        row.push('ANIV');
      } else if (rec.status === 'falta') {
        row.push('FALTA');
      } else if (rec.status === 'atestado') {
        row.push('ATEST');
      } else if (rec.status === 'suspensão') {
        row.push('SUSP');
      } else {
        row.push('DSR');
      }
    }
    matrixRows.push(row);
  });

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);
  setAutoColumnWidths(wsMatrix, matrixRows);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Base Matriz');

  const filename = `RELATORIO_WFM_${sanitizeFilePart(operation.nome)}_${selectedMonthKey}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exports a consolidated multi-operation Excel (.xlsx) workbook comparing all operations.
 */
export function exportMultiOperationExcelReport(params: {
  operations: Operation[];
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  selectedMonthKey: string;
}): void {
  const { operations, operators, monthlyData, selectedMonthKey } = params;
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const wb = XLSX.utils.book_new();

  const rankingRows: Array<Array<string | number>> = [
    ['JSD TELECOM · CONSOLIDADO EXECUTIVO MULTI-OPERAÇÕES'],
    ['Competência', monthLabel, 'Gerado em', new Date().toLocaleString('pt-BR')],
    [],
    [
      'POSIÇÃO',
      'OPERAÇÃO',
      'CLIENTE',
      'SUPERVISORES',
      'COLABORADORES',
      'MIN. PERDIDOS',
      'MIN. ESCALADOS',
      'META (%)',
      'ABS (%)',
      'STATUS'
    ]
  ];

  const supRows: Array<Array<string | number>> = [
    ['OPERAÇÃO', 'SUPERVISOR', 'COLABORADORES', 'MIN. PERDIDOS', 'MIN. ESCALADOS', 'ABS (%)', 'STATUS META']
  ];

  const opRows: Array<Array<string | number>> = [
    ['OPERAÇÃO', 'OPERADOR', 'SUPERVISOR', 'ENTRADA', 'SAÍDA', 'JORNADA', 'MIN. PERDIDOS', 'MIN. ESCALADOS', 'ABS (%)']
  ];

  const enriched = operations.map((op) => {
    const opOps = operators.filter((o) => (o.operacaoId || 'caern') === op.id);
    const sups = getOperationSupervisors(op, opOps);
    const summary = calculateOperationSummary(opOps, monthlyData, sups);
    return { op, opOps, sups, summary };
  });

  enriched
    .sort((a, b) => {
      if (a.opOps.length === 0 && b.opOps.length > 0) return 1;
      if (b.opOps.length === 0 && a.opOps.length > 0) return -1;
      return a.summary.absGeral - b.summary.absGeral;
    })
    .forEach(({ op, opOps, sups, summary }, idx) => {
      const metaPct = (op.metaAbs || 0.03) * 100;
      const status =
        opOps.length === 0
          ? 'Em Aberto'
          : summary.absGeral <= (op.metaAbs || 0.03)
          ? 'Dentro da Meta'
          : 'Acima da Meta';

      rankingRows.push([
        idx + 1,
        op.nome,
        op.cliente,
        sups.length,
        opOps.length,
        summary.totalMinutosPerdidos,
        summary.totalMinutosEscalados,
        Number(metaPct.toFixed(2)),
        Number((summary.absGeral * 100).toFixed(2)),
        status
      ]);

      summary.supervisores.forEach((s) => {
        supRows.push([
          op.nome,
          s.supervisor,
          s.totalOperadores,
          s.minutosPerdidos,
          s.minutosEscalados,
          Number((s.absPercent * 100).toFixed(2)),
          s.absPercent <= (op.metaAbs || 0.03) ? 'Dentro da Meta' : 'Acima da Meta'
        ]);
      });

      opOps.forEach((o) => {
        const d = monthlyData[o.id] || { operatorId: o.id, dias: [] };
        const st = calculateOperatorStats(d.dias, o.jornadaMin);
        opRows.push([
          op.nome,
          o.nome,
          o.supervisor,
          o.entrada,
          o.saida,
          o.jornadaMin,
          st.minutosPerdidos,
          st.minutosEscalados,
          Number((st.absMensal * 100).toFixed(2))
        ]);
      });
    });

  const wsRanking = XLSX.utils.aoa_to_sheet(rankingRows);
  setAutoColumnWidths(wsRanking, rankingRows);
  XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking Operações');

  const wsSup = XLSX.utils.aoa_to_sheet(supRows);
  setAutoColumnWidths(wsSup, supRows);
  XLSX.utils.book_append_sheet(wb, wsSup, 'Supervisões');

  const wsOps = XLSX.utils.aoa_to_sheet(opRows);
  setAutoColumnWidths(wsOps, opRows);
  XLSX.utils.book_append_sheet(wb, wsOps, 'Colaboradores Geral');

  XLSX.writeFile(wb, `RELATORIO_CONSOLIDADO_JSD_WFM_${selectedMonthKey}.xlsx`);
}

/**
 * Generates an executive PDF report for a single operation using jsPDF + autoTable.
 */
export function exportOperationPdfReport(params: {
  operation: Operation;
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  selectedMonthKey: string;
  periodSummaryLabel?: string;
}): void {
  const { operation, operators, monthlyData, selectedMonthKey, periodSummaryLabel } = params;
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const supervisors = getOperationSupervisors(operation, operators);
  const summary = calculateOperationSummary(operators, monthlyData, supervisors);
  const metaLimit = operation.metaAbs || 0.03;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Corporate Teal Banner
  doc.setFillColor(0, 80, 89);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`JSD Telecom · Relatório Gerencial WFM`, 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${operation.nome} (${operation.cliente})  ·  Competência: ${monthLabel}${periodSummaryLabel ? ` (${periodSummaryLabel})` : ''}`,
    14,
    19
  );
  doc.setFontSize(8);
  doc.setTextColor(200, 235, 238);
  doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, 14, 24.5);

  // KPI Strip (4 Clean Vector Cards)
  const kpiTop = 34;
  const kpiGap = 4;
  const kpiWidth = (pageWidth - 28 - kpiGap * 3) / 4;
  const kpis = [
    {
      label: 'ABS GERAL',
      value: formatPercent(summary.absGeral),
      sub: summary.absGeral <= metaLimit ? `Meta ≤ ${(metaLimit * 100).toFixed(1)}% (OK)` : `Acima da Meta ${(metaLimit * 100).toFixed(1)}%`,
      highlight: true
    },
    {
      label: 'MIN. PERDIDOS',
      value: `${summary.totalMinutosPerdidos.toLocaleString('pt-BR')} m`,
      sub: formatMinutesToHours(summary.totalMinutosPerdidos),
      highlight: false
    },
    {
      label: 'MIN. ESCALADOS',
      value: `${summary.totalMinutosEscalados.toLocaleString('pt-BR')} m`,
      sub: formatMinutesToHours(summary.totalMinutosEscalados),
      highlight: false
    },
    {
      label: 'EFETIVO',
      value: `${summary.totalOperadores} op.`,
      sub: `${supervisors.length} supervisão(ões)`,
      highlight: false
    }
  ];

  kpis.forEach((k, idx) => {
    const x = 14 + idx * (kpiWidth + kpiGap);
    if (k.highlight) {
      doc.setFillColor(0, 103, 114);
      doc.roundedRect(x, kpiTop, kpiWidth, 21, 2, 2, 'F');
      doc.setTextColor(210, 240, 242);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, kpiTop, kpiWidth, 21, 2, 2, 'FD');
      doc.setTextColor(100, 116, 139);
    }
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(k.label, x + 3, kpiTop + 5.5);

    doc.setFontSize(12.5);
    doc.setTextColor(k.highlight ? 255 : 15, k.highlight ? 255 : 23, k.highlight ? 255 : 42);
    doc.text(k.value, x + 3, kpiTop + 13);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(k.highlight ? 210 : 100, k.highlight ? 240 : 116, k.highlight ? 242 : 139);
    doc.text(k.sub, x + 3, kpiTop + 18.2);
  });

  // Vector Bar Chart: Supervisors ABS Comparison
  let cursorY = 62;
  const sortedSups = [...summary.supervisores].sort((a, b) => a.absPercent - b.absPercent);

  if (sortedSups.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Comparativo de ABS por Supervisão', 14, cursorY);
    cursorY += 4;

    const maxChartAbs = Math.max(metaLimit * 2, ...sortedSups.map((s) => s.absPercent), 0.04);
    const barAreaStart = 68;
    const barAreaWidth = pageWidth - barAreaStart - 30;
    const metaLineX = barAreaStart + (metaLimit / maxChartAbs) * barAreaWidth;

    sortedSups.slice(0, 8).forEach((s) => {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const shortSup = s.supervisor.length > 26 ? `${s.supervisor.slice(0, 25)}...` : s.supervisor;
      doc.text(shortSup, 14, cursorY + 4);

      doc.setFillColor(241, 245, 249);
      doc.rect(barAreaStart, cursorY + 1, barAreaWidth, 4.2, 'F');

      const fillW = Math.max(1.5, Math.min(barAreaWidth, (s.absPercent / maxChartAbs) * barAreaWidth));
      if (s.absPercent <= metaLimit) {
        doc.setFillColor(0, 103, 114);
      } else {
        doc.setFillColor(225, 29, 72);
      }
      doc.rect(barAreaStart, cursorY + 1, fillW, 4.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatPercent(s.absPercent), barAreaStart + barAreaWidth + 3, cursorY + 4);
      cursorY += 7;
    });

    // Draw vertical target line across the bars
    doc.setDrawColor(216, 150, 39);
    doc.setLineWidth(0.4);
    doc.line(metaLineX, cursorY - sortedSups.slice(0, 8).length * 7, metaLineX, cursorY - 1);
    doc.setFontSize(6.5);
    doc.setTextColor(180, 115, 20);
    doc.text(`Meta ${(metaLimit * 100).toFixed(1)}%`, metaLineX - 5, cursorY + 2.5);
    cursorY += 8;
  }

  // Table 1: Supervisors Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo por Supervisão', 14, cursorY);

  autoTable(doc, {
    startY: cursorY + 3,
    head: [['Supervisor', 'Operadores', 'Min. Perdidos', 'Min. Escalados', 'ABS %', 'Situação']],
    body:
      sortedSups.length === 0
        ? [['Nenhum supervisor cadastrado nesta operação', '-', '-', '-', '-', '-']]
        : sortedSups.map((s) => [
            s.supervisor,
            String(s.totalOperadores),
            `${s.minutosPerdidos.toLocaleString('pt-BR')} m`,
            `${s.minutosEscalados.toLocaleString('pt-BR')} m`,
            formatPercent(s.absPercent),
            s.absPercent <= metaLimit ? 'Dentro da meta' : 'Acima da meta'
          ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [0, 80, 89], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center' }
    }
  });

  const afterSupY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || cursorY + 25;

  // Table 2: Operators Ranked by Highest ABS
  const rankedOperators = operators
    .map((op) => {
      const data = monthlyData[op.id] || { operatorId: op.id, dias: [] };
      const st = calculateOperatorStats(data.dias, op.jornadaMin);
      return { op, st };
    })
    .sort((a, b) => b.st.absMensal - a.st.absMensal);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Detalhamento de Colaboradores (${rankedOperators.length})`, 14, afterSupY + 9);

  autoTable(doc, {
    startY: afterSupY + 12,
    head: [['#', 'Colaborador', 'Supervisor', 'Horário', 'Perdidos', 'Escalados', 'ABS %']],
    body:
      rankedOperators.length === 0
        ? [['-', 'Nenhum colaborador cadastrado nesta operação', '-', '-', '-', '-', '-']]
        : rankedOperators.map(({ op, st }, i) => [
            String(i + 1).padStart(2, '0'),
            op.nome,
            op.supervisor,
            `${op.entrada.slice(0, 5)}–${op.saida.slice(0, 5)}`,
            `${st.minutosPerdidos} m`,
            `${st.minutosEscalados} m`,
            formatPercent(st.absMensal)
          ]),
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [0, 80, 89], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      3: { halign: 'center', cellWidth: 23 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 18 }
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 6 && rankedOperators[hookData.row.index]) {
        const val = rankedOperators[hookData.row.index].st.absMensal;
        if (val > metaLimit) {
          hookData.cell.styles.textColor = [225, 29, 72];
        } else {
          hookData.cell.styles.textColor = [0, 103, 114];
        }
      }
    }
  });

  doc.save(`RELATORIO_WFM_${sanitizeFilePart(operation.nome)}_${selectedMonthKey}.pdf`);
}

/**
 * Generates an executive multi-operation PDF report for JSD Telecom leadership.
 */
export function exportMultiOperationPdfReport(params: {
  operations: Operation[];
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
  selectedMonthKey: string;
}): void {
  const { operations, operators, monthlyData, selectedMonthKey } = params;
  const monthLabel = formatMonthLabel(selectedMonthKey);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const rows = operations.map((op) => {
    const opOps = operators.filter((o) => (o.operacaoId || 'caern') === op.id);
    const sups = getOperationSupervisors(op, opOps);
    const summary = calculateOperationSummary(opOps, monthlyData, sups);
    return { op, opOps, sups, summary };
  });

  const globalPerdidos = rows.reduce((acc, r) => acc + r.summary.totalMinutosPerdidos, 0);
  const globalEscalados = rows.reduce((acc, r) => acc + r.summary.totalMinutosEscalados, 0);
  const globalAbs = globalEscalados > 0 ? globalPerdidos / globalEscalados : 0;
  const totalSups = rows.reduce((acc, r) => acc + r.sups.length, 0);

  // Header
  doc.setFillColor(0, 80, 89);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('JSD Telecom · Relatório Executivo Multi-Operações', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ranking Comparativo de Absenteísmo (WFM)  ·  Competência: ${monthLabel}`, 14, 19);
  doc.setFontSize(8);
  doc.setTextColor(200, 235, 238);
  doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, 14, 24.5);

  // Global KPI Cards
  const kpiTop = 34;
  const kpiGap = 4;
  const kpiWidth = (pageWidth - 28 - kpiGap * 3) / 4;
  const kpis = [
    { label: 'ABS CONSOLIDADO', value: formatPercent(globalAbs), sub: `${operations.length} operações`, highlight: true },
    { label: 'COLABORADORES', value: `${operators.length}`, sub: `${totalSups} supervisões`, highlight: false },
    { label: 'MIN. PERDIDOS', value: `${globalPerdidos.toLocaleString('pt-BR')} m`, sub: formatMinutesToHours(globalPerdidos), highlight: false },
    { label: 'MIN. ESCALADOS', value: `${globalEscalados.toLocaleString('pt-BR')} m`, sub: formatMinutesToHours(globalEscalados), highlight: false }
  ];

  kpis.forEach((k, idx) => {
    const x = 14 + idx * (kpiWidth + kpiGap);
    if (k.highlight) {
      doc.setFillColor(0, 103, 114);
      doc.roundedRect(x, kpiTop, kpiWidth, 21, 2, 2, 'F');
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, kpiTop, kpiWidth, 21, 2, 2, 'FD');
    }
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(k.highlight ? 210 : 100, k.highlight ? 240 : 116, k.highlight ? 242 : 139);
    doc.text(k.label, x + 3, kpiTop + 5.5);

    doc.setFontSize(12.5);
    doc.setTextColor(k.highlight ? 255 : 15, k.highlight ? 255 : 23, k.highlight ? 255 : 42);
    doc.text(k.value, x + 3, kpiTop + 13);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(k.highlight ? 210 : 100, k.highlight ? 240 : 116, k.highlight ? 242 : 139);
    doc.text(k.sub, x + 3, kpiTop + 18.2);
  });

  // Comparative Table
  const sortedRows = [...rows].sort((a, b) => {
    if (a.opOps.length === 0 && b.opOps.length > 0) return 1;
    if (b.opOps.length === 0 && a.opOps.length > 0) return -1;
    return a.summary.absGeral - b.summary.absGeral;
  });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ranking Comparativo entre Operações', 14, 65);

  autoTable(doc, {
    startY: 68,
    head: [['Pos.', 'Operação', 'Superv.', 'Colab.', 'Perdidos', 'Escalados', 'Meta', 'ABS %', 'Situação']],
    body: sortedRows.map((r, i) => [
      `#${i + 1}`,
      r.op.nome,
      String(r.sups.length),
      String(r.opOps.length),
      `${r.summary.totalMinutosPerdidos.toLocaleString('pt-BR')} m`,
      `${r.summary.totalMinutosEscalados.toLocaleString('pt-BR')} m`,
      `${((r.op.metaAbs || 0.03) * 100).toFixed(1)}%`,
      formatPercent(r.summary.absGeral),
      r.opOps.length === 0
        ? 'Em Aberto'
        : r.summary.absGeral <= (r.op.metaAbs || 0.03)
        ? 'Dentro da Meta'
        : 'Acima da Meta'
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [0, 80, 89], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 11 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'right', fontStyle: 'bold', cellWidth: 17 },
      8: { halign: 'center' }
    }
  });

  doc.save(`RELATORIO_CONSOLIDADO_JSD_WFM_${selectedMonthKey}.pdf`);
}
