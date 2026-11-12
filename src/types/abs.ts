export type StatusType =
  | 'dia ok'
  | 'dia ok/atraso'
  | 'atestado'
  | 'falta'
  | 'folga'
  | 'suspensão';

export interface DayRecord {
  dia: number;
  status: StatusType;
  atraso: number; // in minutes
}

export interface Operator {
  id: string;
  nome: string;
  supervisor: string;
  entrada: string;
  saida: string;
  jornadaMin: number; // typically 380 min (6h20)
  offDayOfWeek: number; // 1 = Dom, 2 = Seg, ..., 7 = Sáb
}

export interface OperatorMonthlyData {
  operatorId: string;
  dias: DayRecord[]; // 31 days
}

export interface OperatorStats {
  minutosPerdidos: number;
  minutosEscalados: number;
  absMensal: number; // 0 to 1
  diasTrabalhados: number;
  diasFolga: number;
  diasFalta: number;
  diasAtestado: number;
  diasSuspensao: number;
  diasAtraso: number;
}

export interface SupervisorStats {
  supervisor: string;
  totalOperadores: number;
  minutosPerdidos: number;
  minutosEscalados: number;
  absPercent: number; // 0 to 1
  operadores: Operator[];
}

export interface OperationSummary {
  totalOperadores: number;
  totalMinutosPerdidos: number;
  totalMinutosEscalados: number;
  absGeral: number;
  totalFaltas: number;
  totalAtestados: number;
  totalSuspensoes: number;
  totalMinutosAtraso: number;
  supervisores: SupervisorStats[];
}
