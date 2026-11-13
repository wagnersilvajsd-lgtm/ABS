export type StatusType =
  | 'dia ok'
  | 'dia ok/atraso'
  | 'abono' // Declaração médica/universidade etc. (horas faltantes justificadas que GERAM ABS)
  | 'abono_legal' // Saída antecipada programada com banco de horas (NÃO gera ABS)
  | 'banco_horas_integral' // Dia integral em banco de horas (NÃO gera ABS)
  | 'folga_aniversario' // Folga aniversário (NÃO gera ABS)
  | 'atestado'
  | 'falta'
  | 'folga'
  | 'suspensão';

export interface DayRecord {
  dia: number;
  status: StatusType;
  atraso: number; // in minutes
  abonoMin?: number; // missing minutes in 'abono' (generates ABS) or BH minutes in 'abono_legal' (no ABS)
}

export interface Operation {
  id: string;
  nome: string;
  cliente: string;
  logoUrl?: string;
  metaAbs: number; // e.g. 0.03 (3.00%)
  jornadaPadraoMin: number; // typically 380 min (6h20)
  descricao?: string;
  supervisores: string[];
}

export interface Operator {
  id: string;
  nome: string;
  supervisor: string;
  entrada: string;
  saida: string;
  jornadaMin: number; // typically 380 min (6h20)
  offDayOfWeek: number; // 1 = Dom, 2 = Seg, ..., 7 = Sáb
  operacaoId?: string; // id da operação vinculada (ex: 'caern')
}

export type PedagogicalMeasureType =
  | 'feedback'
  | 'advertencia_verbal'
  | 'advertencia_escrita'
  | 'suspensao';

export type HistoryEventCategory = 'pedagogico' | 'transferencia' | 'horario';

export interface OperatorHistoryEvent {
  id: string;
  operatorId: string;
  category: HistoryEventCategory;
  measureType?: PedagogicalMeasureType;
  reason?: string;
  description: string;
  appliedBy: string;
  dateTime: string; // ISO timestamp
  suspensionDays?: number;
  fromSupervisor?: string;
  toSupervisor?: string;
  fromSchedule?: string;
  toSchedule?: string;
  transferStatus?: 'pendente' | 'aceita' | 'recusada';
}

export interface TransferRequest {
  id: string;
  operatorId: string;
  operatorName: string;
  operacaoId: string;
  fromSupervisor: string;
  toSupervisor: string;
  fromEntrada: string;
  fromSaida: string;
  fromJornadaMin: number;
  toEntrada: string;
  toSaida: string;
  toJornadaMin: number;
  requestedAt: string; // ISO timestamp
  requestedBy: string;
  reason: string;
  status: 'pendente' | 'aceita' | 'recusada';
  respondedAt?: string;
  responseNote?: string;
}

export interface OperatorMonthlyData {
  operatorId: string;
  dias: DayRecord[]; // Exact days of month (28, 29, 30, or 31)
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
  diasAbono: number;
  minutosAbonados: number;
  diasAbonoLegal: number;
  minutosAbonoLegal: number;
  diasFolgaAniversario: number;
  diasBancoHorasIntegral: number;
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
  totalDiasAbono: number;
  totalMinutosAbonados: number;
  totalDiasAbonoLegal: number;
  totalMinutosAbonoLegal: number;
  totalFolgaAniversario: number;
  totalBancoHorasIntegral: number;
  supervisores: SupervisorStats[];
}
