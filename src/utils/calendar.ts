import { DayRecord, Operator, OperatorMonthlyData, StatusType } from '../types/abs';

export const MIN_YEAR = 2025;
export const MAX_YEAR = 2030;

export const AVAILABLE_YEARS: number[] = [2025, 2026, 2027, 2028, 2029, 2030];

export const MONTH_NAMES_PT: string[] = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

export const MONTH_ABBR_PT: string[] = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez'
];

// Matches Date.prototype.getDay(): 0 = Dom, 1 = Seg, ..., 6 = Sáb
export const WEEKDAYS_ABBR_REAL: string[] = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Returns exact number of days in a month (28, 29 in leap years like Feb 2028, 30, or 31).
 * @param year Full year (e.g. 2026..2030)
 * @param month 1-indexed month (1 = Janeiro .. 12 = Dezembro)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns 0 (Dom) to 6 (Sáb) for a specific calendar date.
 */
export function getWeekdayIndex(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

/**
 * Returns abbreviated Portuguese weekday name ('Dom', 'Seg', ..., 'Sáb') for a real date.
 */
export function getWeekdayAbbr(year: number, month: number, day: number): string {
  return WEEKDAYS_ABBR_REAL[getWeekdayIndex(year, month, day)];
}

/**
 * True strictly when the real calendar date is Saturday (6) or Sunday (0).
 */
export function isWeekendDate(year: number, month: number, day: number): boolean {
  const w = getWeekdayIndex(year, month, day);
  return w === 0 || w === 6;
}

/**
 * Returns all weekend day numbers for a given month/year.
 */
export function getMonthWeekends(year: number, month: number): {
  totalDays: number;
  saturdays: number[];
  sundays: number[];
  allWeekendDays: number[];
  completeWeekendsCount: number;
} {
  const totalDays = getDaysInMonth(year, month);
  const saturdays: number[] = [];
  const sundays: number[] = [];
  const allWeekendDays: number[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const w = getWeekdayIndex(year, month, d);
    if (w === 6) {
      saturdays.push(d);
      allWeekendDays.push(d);
    } else if (w === 0) {
      sundays.push(d);
      allWeekendDays.push(d);
    }
  }

  // Count complete Sat+Sun weekend pairs in the month
  let completeWeekendsCount = 0;
  for (const sat of saturdays) {
    if (sundays.includes(sat + 1)) {
      completeWeekendsCount++;
    }
  }

  return {
    totalDays,
    saturdays,
    sundays,
    allWeekendDays,
    completeWeekendsCount
  };
}

export function formatMonthKey(year: number, month: number): string {
  const clampedYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
  const clampedMonth = Math.max(1, Math.min(12, month));
  return `${clampedYear}-${String(clampedMonth).padStart(2, '0')}`;
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const parts = (monthKey || '').split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (!isNaN(y) && !isNaN(m) && y >= MIN_YEAR && y <= MAX_YEAR && m >= 1 && m <= 12) {
    return { year: y, month: m };
  }
  return { year: 2026, month: 11 };
}

export function formatMonthLabel(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  return `${MONTH_NAMES_PT[month - 1]} / ${year}`;
}

export function formatMonthShortLabel(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  return `${MONTH_ABBR_PT[month - 1]}/${year}`;
}

export function getDefaultMonthKey(): string {
  const now = new Date();
  let y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (y < MIN_YEAR) y = MIN_YEAR;
  if (y > MAX_YEAR) y = MAX_YEAR;
  return formatMonthKey(y, m);
}

export function getPrevMonthKey(monthKey: string): string | null {
  const { year, month } = parseMonthKey(monthKey);
  if (year === MIN_YEAR && month === 1) return null;
  if (month === 1) return formatMonthKey(year - 1, 12);
  return formatMonthKey(year, month - 1);
}

export function getNextMonthKey(monthKey: string): string | null {
  const { year, month } = parseMonthKey(monthKey);
  if (year === MAX_YEAR && month === 12) return null;
  if (month === 12) return formatMonthKey(year + 1, 1);
  return formatMonthKey(year, month + 1);
}

export type WeekendFolgaMode =
  | 'auto' // Alternates Sundays / Saturdays based on operator index, capping at complete weekends / maxWeekendFolgas
  | '3-dom'
  | '3-sab'
  | '4-dom'
  | '4-sab'
  | 'all-dom'
  | 'all-sab';

/**
 * Selects which days of the month are DSR ('folga') based on real calendar weekends.
 * Supports 3 weekend folgas (for shorter months or 3-FDS scales) as well as 4 or all Sundays/Saturdays.
 */
export function getRecommendedFolgaDays(
  year: number,
  month: number,
  opIdx: number,
  mode: WeekendFolgaMode = 'auto'
): number[] {
  const { totalDays, saturdays, sundays, completeWeekendsCount } = getMonthWeekends(year, month);

  // In shorter months (like Feb 28d or months where only 3 complete weekends / <= 29 days exist),
  // default auto-mode naturally respects available weekend slots (3 or 4).
  const defaultCap = totalDays <= 29 || completeWeekendsCount <= 3 ? 3 : 4;

  switch (mode) {
    case '3-dom':
      return sundays.slice(0, 3);
    case '3-sab':
      return saturdays.slice(0, 3);
    case '4-dom':
      return sundays.slice(0, 4);
    case '4-sab':
      return saturdays.slice(0, 4);
    case 'all-dom':
      return [...sundays];
    case 'all-sab':
      return [...saturdays];
    case 'auto':
    default: {
      const list = opIdx % 2 === 0 ? sundays : saturdays;
      return list.slice(0, defaultCap);
    }
  }
}

/**
 * Generates exact DayRecord[] (28, 29, 30, or 31 days) for a given operator and calendar month.
 */
export function generateMonthDays(
  year: number,
  month: number,
  opIdx: number,
  mode: WeekendFolgaMode = 'auto'
): DayRecord[] {
  const totalDays = getDaysInMonth(year, month);
  const folgaDays = getRecommendedFolgaDays(year, month, opIdx, mode);

  return Array.from({ length: totalDays }, (_, i) => {
    const dia = i + 1;
    const isFolga = folgaDays.includes(dia);
    return {
      dia,
      status: isFolga ? ('folga' as StatusType) : ('dia ok' as StatusType),
      atraso: 0
    };
  });
}

/**
 * Ensures an existing OperatorMonthlyData matches the exact number of days of the target month.
 */
export function normalizeOperatorMonthlyDays(
  existing: OperatorMonthlyData | undefined,
  operatorId: string,
  year: number,
  month: number,
  opIdx: number
): OperatorMonthlyData {
  const totalDays = getDaysInMonth(year, month);
  if (!existing || !Array.isArray(existing.dias) || existing.dias.length === 0) {
    return {
      operatorId,
      dias: generateMonthDays(year, month, opIdx, 'auto')
    };
  }

  // Reconcile length to exact daysInMonth (28..31)
  const mapByDia = new Map<number, DayRecord>();
  existing.dias.forEach(d => {
    if (d.dia >= 1 && d.dia <= totalDays) {
      mapByDia.set(d.dia, d);
    }
  });

  const folgaFallback = getRecommendedFolgaDays(year, month, opIdx, 'auto');
  const normalized: DayRecord[] = Array.from({ length: totalDays }, (_, i) => {
    const dia = i + 1;
    const found = mapByDia.get(dia);
    if (found) return found;
    return {
      dia,
      status: folgaFallback.includes(dia) ? ('folga' as StatusType) : ('dia ok' as StatusType),
      atraso: 0
    };
  });

  return {
    operatorId,
    dias: normalized
  };
}

/**
 * Generates initial monthly records for a list of operators for a specific (year, month).
 * Preserves sample occurrences on the default/current month so initial KPIs remain realistic.
 */
export function generateMonthDatasetForOperators(
  operators: Operator[],
  year: number,
  month: number,
  includeSampleDeviations: boolean = false
): Record<string, OperatorMonthlyData> {
  const dataset: Record<string, OperatorMonthlyData> = {};
  const totalDays = getDaysInMonth(year, month);

  operators.forEach((op, opIdx) => {
    const dias = generateMonthDays(year, month, opIdx, 'auto');

    if (includeSampleDeviations) {
      const applySample = (dayNum: number, status: StatusType, atraso: number = 0) => {
        if (dayNum <= totalDays) {
          const target = dias[dayNum - 1];
          // If sample day happened to be folga in this calendar month, shift to nearest working day
          if (target && target.status !== 'folga') {
            target.status = status;
            target.atraso = atraso;
          } else {
            const alt = dias.find(d => d.status !== 'folga' && d.dia >= dayNum) || dias.find(d => d.status !== 'folga');
            if (alt) {
              alt.status = status;
              alt.atraso = atraso;
            }
          }
        }
      };

      if (opIdx === 0) {
        applySample(3, 'dia ok/atraso', 35);
        applySample(12, 'falta', 0);
      } else if (opIdx === 5) {
        applySample(15, 'atestado', 0);
      } else if (opIdx === 15) {
        applySample(8, 'dia ok/atraso', 45);
        applySample(22, 'falta', 0);
      } else if (opIdx === 30) {
        applySample(5, 'dia ok/atraso', 20);
      } else if (opIdx === 34) {
        applySample(18, 'falta', 0);
      }
    }

    dataset[op.id] = {
      operatorId: op.id,
      dias
    };
  });

  return dataset;
}
