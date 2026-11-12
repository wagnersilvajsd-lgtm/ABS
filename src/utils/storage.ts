import { Operator, OperatorMonthlyData } from '../types/abs';
import { INITIAL_OPERATORS, generateInitialMonthlyData } from '../data/initialData';

const OPERATORS_STORAGE_KEY = 'abs_wfm_operators_v1';
const MONTHLY_DATA_STORAGE_KEY = 'abs_wfm_monthly_data_v1';
const SELECTED_OPERATOR_STORAGE_KEY = 'abs_wfm_selected_op_v1';
const SELECTED_MONTH_STORAGE_KEY = 'abs_wfm_selected_month_v1';

export function loadStoredOperators(): Operator[] {
  try {
    const raw = localStorage.getItem(OPERATORS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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

export function loadStoredMonthlyData(operators: Operator[]): Record<string, OperatorMonthlyData> {
  try {
    const raw = localStorage.getItem(MONTHLY_DATA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load monthly data from storage', e);
  }
  return generateInitialMonthlyData(operators);
}

export function saveStoredMonthlyData(data: Record<string, OperatorMonthlyData>): void {
  try {
    localStorage.setItem(MONTHLY_DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save monthly data to storage', e);
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

export function resetToDefaults(): {
  operators: Operator[];
  monthlyData: Record<string, OperatorMonthlyData>;
} {
  localStorage.removeItem(OPERATORS_STORAGE_KEY);
  localStorage.removeItem(MONTHLY_DATA_STORAGE_KEY);
  localStorage.removeItem(SELECTED_OPERATOR_STORAGE_KEY);
  const initialOps = INITIAL_OPERATORS;
  const initialMonthly = generateInitialMonthlyData(initialOps);
  saveStoredOperators(initialOps);
  saveStoredMonthlyData(initialMonthly);
  saveStoredSelectedOperatorId(initialOps[0].id);
  return { operators: initialOps, monthlyData: initialMonthly };
}
