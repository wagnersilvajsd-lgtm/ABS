import { DayRecord, Operator, OperatorMonthlyData, OperatorStats, OperationSummary, StatusType, SupervisorStats } from '../types/abs';

/**
 * Calculates daily ABS matching Google Sheets Formula in Col D:
 * =IF(OR(B7="folga", ISBLANK(B7), B7=""), "",
 *    IF(B7="dia ok", 0,
 *       IF(B7="dia ok/atraso", IFERROR(C7/$D$3, 0),
 *          IF(OR(B7="falta", B7="atestado", B7="suspensão"), 1, ""))))
 */
export function calculateDayAbs(status: StatusType, atraso: number, jornadaMin: number = 380): number | null {
  if (status === 'folga') {
    return null; // Empty in spreadsheet, doesn't penalize or count
  }
  if (status === 'dia ok') {
    return 0;
  }
  if (status === 'dia ok/atraso') {
    const validDelay = Math.max(0, Math.min(jornadaMin, Number(atraso) || 0));
    return jornadaMin > 0 ? validDelay / jornadaMin : 0;
  }
  if (status === 'falta' || status === 'atestado' || status === 'suspensão') {
    return 1.0; // 100%
  }
  return null;
}

/**
 * Calculates operator monthly stats matching Google Sheets formulas:
 * D39 (Minutos Perdidos): SUM(C7:C37) + (COUNTIF(B7:B37, "falta") + COUNTIF(B7:B37, "atestado") + COUNTIF(B7:B37, "suspensão")) * D3
 * D40 (Minutos Escalados): (COUNTIF(B7:B37, "<>folga") - COUNTIF(B7:B37, "")) * D3
 * D38 (ABS Consolidado): D39 / D40
 */
export function calculateOperatorStats(dias: DayRecord[], jornadaMin: number = 380): OperatorStats {
  let minutosAtraso = 0;
  let countFalta = 0;
  let countAtestado = 0;
  let countSuspensao = 0;
  let countDiaOk = 0;
  let countDiaOkAtraso = 0;
  let countFolga = 0;
  let diasEscaladosCount = 0;

  for (const d of dias) {
    const status = (d.status || '').trim().toLowerCase();
    
    // Status vazio ou folga NÃO entra em minutos escalados
    if (status === 'folga' || !status) {
      countFolga++;
      continue;
    }

    // Qualquer outro status válido é considerado dia útil escalado
    diasEscaladosCount++;

    switch (status) {
      case 'dia ok':
        countDiaOk++;
        break;
      case 'dia ok/atraso':
        countDiaOkAtraso++;
        minutosAtraso += Math.max(0, Math.min(jornadaMin, Number(d.atraso) || 0));
        break;
      case 'falta':
        countFalta++;
        break;
      case 'atestado':
        countAtestado++;
        break;
      case 'suspensão':
        countSuspensao++;
        break;
    }
  }

  // Minutos Perdidos (Numerador): soma dos atrasos + faltas/atestados/suspensões * jornadaMin
  const minutosPerdidos = minutosAtraso + (countFalta + countAtestado + countSuspensao) * jornadaMin;
  
  // Minutos Escalados (Denominador): dias úteis escalados (excluindo estritamente folgas e vazios) * jornadaMin
  const minutosEscalados = diasEscaladosCount * jornadaMin;
  
  // ABS Consolidado
  const absMensal = minutosEscalados > 0 ? minutosPerdidos / minutosEscalados : 0;

  return {
    minutosPerdidos,
    minutosEscalados,
    absMensal,
    diasTrabalhados: countDiaOk + countDiaOkAtraso,
    diasFolga: countFolga,
    diasFalta: countFalta,
    diasAtestado: countAtestado,
    diasSuspensao: countSuspensao,
    diasAtraso: countDiaOkAtraso
  };
}

/**
 * Calculates Supervisor ABS matching Google Sheets Formula in F7:
 * =IFERROR(SUMIF(OPERADORES!B:B, B2, OPERADORES!F:F) / SUMIF(OPERADORES!B:B, B2, OPERADORES!G:G), 0)
 */
export function calculateSupervisorStats(
  supervisorName: string,
  operators: Operator[],
  monthlyData: Record<string, OperatorMonthlyData>
): SupervisorStats {
  const teamOperators = operators.filter(op => op.supervisor.toLowerCase().trim() === supervisorName.toLowerCase().trim());

  let totalPerdido = 0;
  let totalEscalado = 0;

  teamOperators.forEach(op => {
    const opData = monthlyData[op.id];
    if (opData) {
      const stats = calculateOperatorStats(opData.dias, op.jornadaMin);
      totalPerdido += stats.minutosPerdidos;
      totalEscalado += stats.minutosEscalados;
    }
  });

  const absPercent = totalEscalado > 0 ? totalPerdido / totalEscalado : 0;

  return {
    supervisor: supervisorName,
    totalOperadores: teamOperators.length,
    minutosPerdidos: totalPerdido,
    minutosEscalados: totalEscalado,
    absPercent,
    operadores: teamOperators
  };
}

/**
 * Calculates global operations WFM overview across all operators and supervisors
 */
export function calculateOperationSummary(
  operators: Operator[],
  monthlyData: Record<string, OperatorMonthlyData>,
  supervisores: string[]
): OperationSummary {
  let totalMinutosPerdidos = 0;
  let totalMinutosEscalados = 0;
  let totalFaltas = 0;
  let totalAtestados = 0;
  let totalSuspensoes = 0;
  let totalMinutosAtraso = 0;

  operators.forEach(op => {
    const opData = monthlyData[op.id];
    if (opData) {
      const stats = calculateOperatorStats(opData.dias, op.jornadaMin);
      totalMinutosPerdidos += stats.minutosPerdidos;
      totalMinutosEscalados += stats.minutosEscalados;
      totalFaltas += stats.diasFalta;
      totalAtestados += stats.diasAtestado;
      totalSuspensoes += stats.diasSuspensao;
      // Extract delay minutes specifically
      opData.dias.forEach(d => {
        if (d.status === 'dia ok/atraso') {
          totalMinutosAtraso += Math.max(0, Math.min(op.jornadaMin, Number(d.atraso) || 0));
        }
      });
    }
  });

  const absGeral = totalMinutosEscalados > 0 ? totalMinutosPerdidos / totalMinutosEscalados : 0;

  const supervisorStatsList = supervisores.map(sup =>
    calculateSupervisorStats(sup, operators, monthlyData)
  );

  return {
    totalOperadores: operators.length,
    totalMinutosPerdidos,
    totalMinutosEscalados,
    absGeral,
    totalFaltas,
    totalAtestados,
    totalSuspensoes,
    totalMinutosAtraso,
    supervisores: supervisorStatsList
  };
}

/**
 * Helper to format minutes as "XXh YYm"
 */
export function formatMinutesToHours(minutes: number): string {
  const rounded = Math.round(minutes);
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Helper to format percentages
 */
export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0.00%';
  return `${(value * 100).toFixed(2)}%`;
}
