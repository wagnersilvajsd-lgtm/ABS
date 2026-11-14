import { Operator, OperatorMonthlyData } from '../types/abs';
import { calculateOperatorStats } from './calculations';
import {
  formatMonthKey,
  formatMonthLabel,
  formatMonthShortLabel,
  getPrevMonthKey,
  normalizeOperatorMonthlyDays,
  parseMonthKey
} from './calendar';

export interface MonthlyAbsPoint {
  monthKey: string;
  shortLabel: string;
  fullLabel: string;
  absPercent: number; // 0 to 1
  minutosPerdidos: number;
  minutosEscalados: number;
  ocorrencias: number;
  hasSavedData: boolean;
}

/**
 * Returns up to `count` chronological monthKeys ending at `anchorMonthKey`.
 */
export function getTrailingMonthKeys(anchorMonthKey: string, count: number): string[] {
  const keys: string[] = [];
  let cursor: string | null = anchorMonthKey;
  for (let i = 0; i < count && cursor; i++) {
    keys.unshift(cursor);
    cursor = getPrevMonthKey(cursor);
  }
  return keys;
}

/**
 * Computes monthly ABS trend for a set of operators (operation-wide, supervisor team, or single operator).
 */
export function computeMonthlyTrend(
  anchorMonthKey: string,
  monthsCount: number,
  targetOperators: Operator[],
  monthlyDataByMonth: Record<string, Record<string, OperatorMonthlyData>>
): MonthlyAbsPoint[] {
  const keys = getTrailingMonthKeys(anchorMonthKey, monthsCount);

  return keys.map((mKey) => {
    const { year, month } = parseMonthKey(mKey);
    const storedMonth = monthlyDataByMonth[mKey];
    const hasSavedData = Boolean(
      storedMonth && targetOperators.some((op) => Boolean(storedMonth[op.id]))
    );

    let minutosPerdidos = 0;
    let minutosEscalados = 0;
    let ocorrencias = 0;

    if (hasSavedData && storedMonth) {
      targetOperators.forEach((op, idx) => {
        const rawOpData = storedMonth[op.id];
        if (!rawOpData) return;
        const normalized = normalizeOperatorMonthlyDays(rawOpData, op.id, year, month, idx);
        const st = calculateOperatorStats(normalized.dias, op.jornadaMin || 380);
        minutosPerdidos += st.minutosPerdidos;
        minutosEscalados += st.minutosEscalados;
        ocorrencias +=
          st.diasFalta +
          st.diasAtestado +
          st.diasSuspensao +
          st.diasAtraso +
          st.diasAbono;
      });
    }

    const absPercent = minutosEscalados > 0 ? minutosPerdidos / minutosEscalados : 0;

    return {
      monthKey: mKey,
      shortLabel: formatMonthShortLabel(formatMonthKey(year, month)),
      fullLabel: formatMonthLabel(formatMonthKey(year, month)),
      absPercent,
      minutosPerdidos,
      minutosEscalados,
      ocorrencias,
      hasSavedData
    };
  });
}
