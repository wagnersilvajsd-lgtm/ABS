import {
  Operator,
  OperatorMonthlyData,
  Operation,
  OperatorHistoryEvent,
  TransferRequest
} from '../types/abs';
import { INITIAL_OPERATORS, INITIAL_OPERATIONS } from '../data/initialData';
import {
  getDefaultMonthKey,
  parseMonthKey,
  generateMonthDatasetForOperators,
  normalizeOperatorMonthlyDays,
  MIN_YEAR,
  MAX_YEAR
} from './calendar';

const OPERATIONS_STORAGE_KEY = 'abs_wfm_operations_v1';
const SELECTED_OPERATION_STORAGE_KEY = 'abs_wfm_selected_operation_v1';
const OPERATORS_STORAGE_KEY = 'abs_wfm_operators_v1';
const MONTHLY_DATA_STORAGE_KEY = 'abs_wfm_monthly_data_v1';
const MONTHLY_DATA_BY_MONTH_KEY = 'abs_wfm_monthly_data_by_month_v2';
const SELECTED_MONTH_STORAGE_KEY = 'abs_wfm_selected_month_v1';
const SELECTED_OPERATOR_STORAGE_KEY = 'abs_wfm_selected_op_v1';
const OPERATOR_HISTORY_STORAGE_KEY = 'abs_wfm_operator_history_v1';
const TRANSFERS_STORAGE_KEY = 'abs_wfm_transfers_v1';
const ACTIVE_SUPERVISOR_VIEW_KEY = 'abs_wfm_active_supervisor_view_v1';
const SAMPLE_CLEANED_FLAG_KEY = 'abs_wfm_clean_start_v1';

const SAMPLE_SEEDED_OPERATOR_IDS = new Set(['op-1', 'op-6', 'op-16', 'op-31', 'op-35']);

function hasOnlySeededSampleDeviations(monthMap: Record<string, OperatorMonthlyData>): boolean {
  let foundSample = false;
  for (const opId of Object.keys(monthMap)) {
    const record = monthMap[opId];
    if (!record || !Array.isArray(record.dias)) continue;
    for (const d of record.dias) {
      if (d.status !== 'dia ok' && d.status !== 'folga') {
        if (!SAMPLE_SEEDED_OPERATOR_IDS.has(opId)) {
          return false;
        }
        const isKnownSample =
          (opId === 'op-1' && ((d.status === 'dia ok/atraso' && d.atraso === 35) || d.status === 'falta')) ||
          (opId === 'op-6' && d.status === 'atestado') ||
          (opId === 'op-16' && ((d.status === 'dia ok/atraso' && d.atraso === 45) || d.status === 'falta')) ||
          (opId === 'op-31' && d.status === 'dia ok/atraso' && d.atraso === 20) ||
          (opId === 'op-35' && d.status === 'falta');
        if (!isKnownSample) {
          return false;
        }
        foundSample = true;
      }
    }
  }
  return foundSample;
}

function stripDeviationsFromMonthMap(
  monthMap: Record<string, OperatorMonthlyData>
): Record<string, OperatorMonthlyData> {
  const cleaned: Record<string, OperatorMonthlyData> = {};
  Object.keys(monthMap).forEach((opId) => {
    const record = monthMap[opId];
    cleaned[opId] = {
      operatorId: opId,
      dias: (record?.dias || []).map((d) => ({
        ...d,
        status: d.status === 'folga' ? 'folga' : 'dia ok',
        atraso: 0,
        abonoMin: undefined
      }))
    };
  });
  return cleaned;
}

export function loadStoredOperations(): Operation[] {
  try {
    const raw = localStorage.getItem(OPERATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load operations from storage', e);
  }
  return INITIAL_OPERATIONS;
}

export function saveStoredOperations(operations: Operation[]): void {
  try {
    localStorage.setItem(OPERATIONS_STORAGE_KEY, JSON.stringify(operations));
  } catch (e) {
    console.error('Failed to save operations to storage', e);
  }
}

export function loadStoredSelectedOperationId(): string {
  try {
    const saved = localStorage.getItem(SELECTED_OPERATION_STORAGE_KEY);
    if (saved) return saved;
  } catch (e) {}
  return INITIAL_OPERATIONS[0]?.id || 'caern';
}

export function saveStoredSelectedOperationId(id: string): void {
  try {
    localStorage.setItem(SELECTED_OPERATION_STORAGE_KEY, id);
  } catch (e) {}
}

export function loadStoredSelectedMonthKey(): string {
  try {
    const saved = localStorage.getItem(SELECTED_MONTH_STORAGE_KEY);
    if (saved) {
      const { year, month } = parseMonthKey(saved);
      if (year >= MIN_YEAR && year <= MAX_YEAR && month >= 1 && month <= 12) {
        return saved;
      }
    }
  } catch (e) {}
  return getDefaultMonthKey();
}

export function saveStoredSelectedMonthKey(monthKey: string): void {
  try {
    localStorage.setItem(SELECTED_MONTH_STORAGE_KEY, monthKey);
  } catch (e) {}
}

export function loadStoredOperators(): Operator[] {
  try {
    const raw = localStorage.getItem(OPERATORS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((op: Operator) => ({
          ...op,
          operacaoId: op.operacaoId || 'caern'
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load operators from storage', e);
  }
  return INITIAL_OPERATORS;
}

export function saveStoredOperators(operators: Operator[]): void {
  try {
    localStorage.setItem(OPERATORS_STORAGE_KEY, JSON.stringify(operators));
  } catch (e) {
    console.error('Failed to save operators to storage', e);
  }
}

export function loadStoredMonthlyDataByMonth(
  operators: Operator[]
): Record<string, Record<string, OperatorMonthlyData>> {
  const defaultKey = getDefaultMonthKey();
  const { year: defYear, month: defMonth } = parseMonthKey(defaultKey);

  try {
    const rawV2 = localStorage.getItem(MONTHLY_DATA_BY_MONTH_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (parsed && typeof parsed === 'object') {
        if (localStorage.getItem(SAMPLE_CLEANED_FLAG_KEY) !== 'true') {
          let modified = false;
          const nextParsed: Record<string, Record<string, OperatorMonthlyData>> = { ...parsed };
          Object.keys(nextParsed).forEach((mKey) => {
            if (nextParsed[mKey] && hasOnlySeededSampleDeviations(nextParsed[mKey])) {
              nextParsed[mKey] = stripDeviationsFromMonthMap(nextParsed[mKey]);
              modified = true;
            }
          });
          localStorage.setItem(SAMPLE_CLEANED_FLAG_KEY, 'true');
          if (modified) {
            saveStoredMonthlyDataByMonth(nextParsed);
          }
          return nextParsed;
        }
        return parsed;
      }
    }

    // Migrate legacy single-month storage if it exists
    const rawLegacy = localStorage.getItem(MONTHLY_DATA_STORAGE_KEY);
    if (rawLegacy) {
      const legacyParsed = JSON.parse(rawLegacy);
      if (legacyParsed && typeof legacyParsed === 'object') {
        let normalizedMonth: Record<string, OperatorMonthlyData> = {};
        operators.forEach((op, idx) => {
          normalizedMonth[op.id] = normalizeOperatorMonthlyDays(
            legacyParsed[op.id],
            op.id,
            defYear,
            defMonth,
            idx
          );
        });
        if (
          localStorage.getItem(SAMPLE_CLEANED_FLAG_KEY) !== 'true' &&
          hasOnlySeededSampleDeviations(normalizedMonth)
        ) {
          normalizedMonth = stripDeviationsFromMonthMap(normalizedMonth);
        }
        localStorage.setItem(SAMPLE_CLEANED_FLAG_KEY, 'true');
        const migrated = { [defaultKey]: normalizedMonth };
        saveStoredMonthlyDataByMonth(migrated);
        return migrated;
      }
    }
  } catch (e) {
    console.error('Failed to load monthly data from storage', e);
  }

  localStorage.setItem(SAMPLE_CLEANED_FLAG_KEY, 'true');
  return {
    [defaultKey]: generateMonthDatasetForOperators(operators, defYear, defMonth, false)
  };
}

export function saveStoredMonthlyDataByMonth(
  dataByMonth: Record<string, Record<string, OperatorMonthlyData>>
): void {
  try {
    localStorage.setItem(MONTHLY_DATA_BY_MONTH_KEY, JSON.stringify(dataByMonth));
  } catch (e) {
    console.error('Failed to save monthly data by month to storage', e);
  }
}

export function loadStoredSelectedOperatorId(): string {
  try {
    const saved = localStorage.getItem(SELECTED_OPERATOR_STORAGE_KEY);
    if (saved) return saved;
  } catch (e) {}
  return INITIAL_OPERATORS[0]?.id || 'op-1';
}

export function saveStoredSelectedOperatorId(id: string): void {
  try {
    localStorage.setItem(SELECTED_OPERATOR_STORAGE_KEY, id);
  } catch (e) {}
}

export function loadStoredOperatorHistory(): Record<string, OperatorHistoryEvent[]> {
  try {
    const raw = localStorage.getItem(OPERATOR_HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load operator history', e);
  }
  return {};
}

export function saveStoredOperatorHistory(history: Record<string, OperatorHistoryEvent[]>): void {
  try {
    localStorage.setItem(OPERATOR_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save operator history', e);
  }
}

export function loadStoredTransfers(): TransferRequest[] {
  try {
    const raw = localStorage.getItem(TRANSFERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load transfers', e);
  }
  return [];
}

export function saveStoredTransfers(transfers: TransferRequest[]): void {
  try {
    localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers));
  } catch (e) {
    console.error('Failed to save transfers', e);
  }
}

export function loadStoredActiveSupervisorView(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_SUPERVISOR_VIEW_KEY);
    if (saved) return saved;
  } catch (e) {}
  return 'gestor';
}

export function saveStoredActiveSupervisorView(sup: string): void {
  try {
    localStorage.setItem(ACTIVE_SUPERVISOR_VIEW_KEY, sup);
  } catch (e) {}
}

export function resetToDefaults(): {
  operations: Operation[];
  operators: Operator[];
  selectedMonthKey: string;
  monthlyDataByMonth: Record<string, Record<string, OperatorMonthlyData>>;
  operatorHistory: Record<string, OperatorHistoryEvent[]>;
  transfers: TransferRequest[];
} {
  localStorage.removeItem(OPERATIONS_STORAGE_KEY);
  localStorage.removeItem(SELECTED_OPERATION_STORAGE_KEY);
  localStorage.removeItem(OPERATORS_STORAGE_KEY);
  localStorage.removeItem(MONTHLY_DATA_STORAGE_KEY);
  localStorage.removeItem(MONTHLY_DATA_BY_MONTH_KEY);
  localStorage.removeItem(SELECTED_MONTH_STORAGE_KEY);
  localStorage.removeItem(SELECTED_OPERATOR_STORAGE_KEY);
  localStorage.removeItem(OPERATOR_HISTORY_STORAGE_KEY);
  localStorage.removeItem(TRANSFERS_STORAGE_KEY);
  localStorage.removeItem(ACTIVE_SUPERVISOR_VIEW_KEY);

  const initialOperations = INITIAL_OPERATIONS;
  const initialOps = INITIAL_OPERATORS;
  const defaultKey = getDefaultMonthKey();
  const { year, month } = parseMonthKey(defaultKey);
  const initialMonth = generateMonthDatasetForOperators(initialOps, year, month, false);
  const initialByMonth = { [defaultKey]: initialMonth };

  localStorage.setItem(SAMPLE_CLEANED_FLAG_KEY, 'true');
  saveStoredOperations(initialOperations);
  saveStoredOperators(initialOps);
  saveStoredMonthlyDataByMonth(initialByMonth);
  saveStoredSelectedOperationId(initialOperations[0].id);
  saveStoredSelectedMonthKey(defaultKey);
  saveStoredSelectedOperatorId(initialOps[0].id);

  return {
    operations: initialOperations,
    operators: initialOps,
    selectedMonthKey: defaultKey,
    monthlyDataByMonth: initialByMonth,
    operatorHistory: {},
    transfers: []
  };
}
