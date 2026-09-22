
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
  biomasaActual?: number;
  biomasaTotal: number;
  precosechas?: number;
  isPreharvestRow?: boolean;
  alimentoSemanal: number;
  alimentoAcumulado: number;
  fca: number;
  fcaEnAgua?: number;
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

export interface HarvestRecord {
  id: string;
  granja: string;
  estanque: string;
  fecha: string;
  
  // Pre-cosecha 1
  fecha1?: string;
  pre1Kilos?: number;
  pre1Gramos?: number;
  pre1Organismos?: number;
  
  // 2da Pre-cosecha
  fecha2?: string;
  pre2Kilos?: number;
  pre2Gramos?: number;
  pre2Organismos?: number;

  // 3ra Pre-cosecha
  fecha3?: string;
  pre3Kilos?: number;
  pre3Gramos?: number;
  pre3Organismos?: number;

  // 4ta Pre-cosecha
  fecha4?: string;
  pre4Kilos?: number;
  pre4Gramos?: number;
  pre4Organismos?: number;

  // 5ta Pre-cosecha
  fecha5?: string;
  pre5Kilos?: number;
  pre5Gramos?: number;
  pre5Organismos?: number;
  
  // Cosecha Final
  fechaFinal?: string;
  finalKilos?: number;
  finalGramos?: number;
  finalOrganismos?: number;
  
  // Totales Precosechados
  totalOrganismos: number;
  totalKilos: number;
  pesoPromedioPrecosechado?: number;
  sobrevivenciaFinal?: number;
}

export interface PondExtractionStage {
  etapa: string;
  fecha: string;
  kilos: number;
  gramos: number;
  organismos: number;
  kilosAcumulados?: number;
  fcaEtapa?: number;
}

export interface PondHarvestSummary {
  totalKilos: number;
  totalOrganismos: number;
  stages: PondExtractionStage[];
  pesoPromedio: number;
  sobrevivenciaFinal?: number;
  tieneExtracciones: boolean;
}

export interface PondNetMetrics {
  kilosExtraidos: number;
  organismosExtraidos: number;
  biomasaTeorica: number;
  biomasaActual: number;
  biomasaTotal: number;
  biomasaEnAgua: number;
  biomasaHaEnAgua: number;
  poblacionTeorica: number;
  poblacionEnAgua: number;
  camM2EnAgua: number;
  alimentoProyectadoDiaAjustado: number;
  alimentoProyectadoSemanaAjustado: number;
  porcentajeExtraidoBiomasa: number;
  porcentajeRestanteBiomasa: number;
  tieneExtracciones: boolean;
  stages: PondExtractionStage[];
  alimentoAcumulado: number;
  fcaSinPrecosecha: number;
  fcaEnAgua: number;
  fcaAjustado: number;
  fcaPoscosecha: number;
  diferenciaFca: number;
}

