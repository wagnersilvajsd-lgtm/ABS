import { DayRecord, Operation, Operator, OperatorMonthlyData, OperatorStats, OperationSummary, StatusType, SupervisorStats } from '../types/abs';

/**
 * Calculates daily ABS matching Google Sheets Formula in Col D:
 * =IF(OR(B7="folga", ISBLANK(B7), B7=""), "",
 *    IF(B7="dia ok", 0,
 *       IF(B7="dia ok/atraso", IFERROR(C7/$D$3, 0),
 *          IF(OR(B7="falta", B7="atestado", B7="suspensão"), 1, ""))))
 */
export function calculateDayAbs(
  status: StatusType,
  atraso: number,
  jornadaMin: number = 380,
  abonoMin: number = 0
): number | null {
  if (status === 'folga' || status === 'folga_aniversario' || status === 'banco_horas_integral') {
    return null; // Não pontua e não gera ABS
  }
  if (status === 'dia ok') {
    return 0;
  }
  if (status === 'abono') {
    // Declaração médica/universidade etc.: horas faltantes justificadas GERAM ABS
    const validMissing = Math.max(0, Math.min(jornadaMin, Number(abonoMin) || 0));
    return jornadaMin > 0 ? validMissing / jornadaMin : 0;
  }
  if (status === 'abono_legal') {
    // Saída antecipada programada com Banco de Horas: NÃO gera ABS
    const validBh = Math.max(0, Math.min(jornadaMin, Number(abonoMin) || 0));
    const workedMin = Math.max(0, jornadaMin - validBh);
    return workedMin > 0 ? 0 : null;
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
 * - 'abono' (Declaração / Horas Faltantes): soma horas faltantes em Minutos Perdidos (GERA ABS) e mantém jornadaMin em Escalados.
 * - 'abono_legal' (Saída Antecipada Programada com BH): NÃO gera ABS (0 min perdidos, apenas horas logadas em Escalados).
 * - 'folga', 'folga_aniversario', 'banco_horas_integral': NÃO geram ABS e NÃO entram em Minutos Escalados.
 */
export function calculateOperatorStats(dias: DayRecord[], jornadaMin: number = 380): OperatorStats {
  let minutosAtraso = 0;
  let minutosAbonoFaltante = 0;
  let countFalta = 0;
  let countAtestado = 0;
  let countSuspensao = 0;
  let countDiaOk = 0;
  let countDiaOkAtraso = 0;
  let countFolga = 0;
  let countAbono = 0;
  let countAbonoLegal = 0;
  let minutosAbonoLegal = 0;
  let countFolgaAniversario = 0;
  let countBancoHorasIntegral = 0;
  let minutosEscalados = 0;
  let diasTrabalhadosParciais = 0;

  for (const d of dias) {
    const status = (d.status || '').trim().toLowerCase();

    // Status vazio, folga DSR, folga aniversário ou banco de horas integral NÃO entra em minutos escalados e NÃO gera ABS
    if (status === 'folga' || !status) {
      countFolga++;
      continue;
    }

    if (status === 'folga_aniversario') {
      countFolgaAniversario++;
      continue;
    }

    if (status === 'banco_horas_integral') {
      countBancoHorasIntegral++;
      continue;
    }

    if (status === 'abono_legal') {
      countAbonoLegal++;
      const validBh = Math.max(0, Math.min(jornadaMin, Number(d.abonoMin) || 0));
      const workedMin = Math.max(0, jornadaMin - validBh);
      minutosAbonoLegal += validBh;
      minutosEscalados += workedMin;
      if (workedMin > 0) {
        diasTrabalhadosParciais++;
      }
      continue;
    }

    if (status === 'abono') {
      // Declaração médica/universidade etc.: horas faltantes justificadas GERAM ABS
      countAbono++;
      const validMissing = Math.max(0, Math.min(jornadaMin, Number(d.abonoMin) || 0));
      const workedMin = Math.max(0, jornadaMin - validMissing);
      minutosAbonoFaltante += validMissing;
      minutosEscalados += jornadaMin;
      if (workedMin > 0) {
        diasTrabalhadosParciais++;
      }
      continue;
    }

    // Qualquer outro status válido é considerado dia útil escalado integral
    minutosEscalados += jornadaMin;

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

  // Minutos Perdidos (Numerador): atrasos + horas faltantes em 'abono' (declaração) + faltas/atestados/suspensões * jornadaMin
  const minutosPerdidos =
    minutosAtraso +
    minutosAbonoFaltante +
    (countFalta + countAtestado + countSuspensao) * jornadaMin;

  // ABS Consolidado
  const absMensal = minutosEscalados > 0 ? minutosPerdidos / minutosEscalados : 0;

  return {
    minutosPerdidos,
    minutosEscalados,
    absMensal,
    diasTrabalhados: countDiaOk + countDiaOkAtraso + diasTrabalhadosParciais,
    diasFolga: countFolga,
    diasFalta: countFalta,
    diasAtestado: countAtestado,
    diasSuspensao: countSuspensao,
    diasAtraso: countDiaOkAtraso,
    diasAbono: countAbono,
    minutosAbonados: minutosAbonoFaltante,
    diasAbonoLegal: countAbonoLegal,
    minutosAbonoLegal,
    diasFolgaAniversario: countFolgaAniversario,
    diasBancoHorasIntegral: countBancoHorasIntegral
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
  let totalDiasAbono = 0;
  let totalMinutosAbonados = 0;
  let totalDiasAbonoLegal = 0;
  let totalMinutosAbonoLegal = 0;
  let totalFolgaAniversario = 0;
  let totalBancoHorasIntegral = 0;

  operators.forEach(op => {
    const opData = monthlyData[op.id];
    if (opData) {
      const stats = calculateOperatorStats(opData.dias, op.jornadaMin);
      totalMinutosPerdidos += stats.minutosPerdidos;
      totalMinutosEscalados += stats.minutosEscalados;
      totalFaltas += stats.diasFalta;
      totalAtestados += stats.diasAtestado;
      totalSuspensoes += stats.diasSuspensao;
      totalDiasAbono += stats.diasAbono;
      totalMinutosAbonados += stats.minutosAbonados;
      totalDiasAbonoLegal += stats.diasAbonoLegal;
      totalMinutosAbonoLegal += stats.minutosAbonoLegal;
      totalFolgaAniversario += stats.diasFolgaAniversario;
      totalBancoHorasIntegral += stats.diasBancoHorasIntegral;
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
    totalDiasAbono,
    totalMinutosAbonados,
    totalDiasAbonoLegal,
    totalMinutosAbonoLegal,
    totalFolgaAniversario,
    totalBancoHorasIntegral,
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

/**
 * Resolves the effective ABS target for a specific month ('YYYY-MM'),
 * falling back to the operation's default metaAbs (or 3.0%) when no monthly override is set.
 */
export function getOperationMetaForMonth(
  operation: Pick<Operation, 'metaAbs' | 'monthlyMetas'> | undefined,
  monthKey?: string
): number {
  if (
    monthKey &&
    operation?.monthlyMetas &&
    typeof operation.monthlyMetas[monthKey] === 'number' &&
    !isNaN(operation.monthlyMetas[monthKey])
  ) {
    return operation.monthlyMetas[monthKey];
  }
  return operation?.metaAbs || 0.03;
}
