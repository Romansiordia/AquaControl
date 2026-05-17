
export interface PondRecord {
  id: string;
  granja: string;
  orgMt2: number;
  especie: string;
  fecha: string;
  fechaSiembra: string;
  fechaCosecha: string;
  alimento: string;
  laboratorio: string;
  estanque: string;
  hectareas: number;
  pesoAnterior: number;
  pesoActual: number;
  incrementoSemanal: number;
  diasCultivo: number;
  sobrevivencia: number;
  densidadInicial: number;
  densidadActual: number;
  biomasaHa: number;
  biomasaTotal: number;
  alimentoSemanal: number;
  alimentoAcumulado: number;
  fca: number;
  camM2Inicial: number;
  camM2Actual: number;
  organismosSembrados: number;
  alimentadores: string;
  aditivos: string;
  alimentoProyectadoDia: number;
  alimentoProyectadoSemana: number;
}

export interface GrowthPoint {
  dias: number;
  std: number;
  real: number | null;
  highlighted?: boolean;
}

export type NewPondRecord = Omit<PondRecord, 'id' | 'incrementoSemanal' | 'biomasaHa' | 'biomasaTotal' | 'fca'>;

export type EvaluationFormData = Record<string, string | number | boolean>;

export interface EvaluationRecord extends EvaluationFormData {
  id: string;
  submissionDate: string;
}

export interface StockingProgramRecord {
  id: string;
  granja: string;
  fechaCosecha: string;
  fechaSiembra: string;
  alimento: string;
  laboratorio: string;
  estanque: number;
  hectareas: number;
  organismosSembrados: number;
  orgM2: number;
  alimentadores: string;
  aditivos: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  lastSync?: string;
  isAutoSync?: boolean;
}
