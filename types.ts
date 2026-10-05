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
  hasExplicitPrecosecha?: boolean;
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
  fecha?: string;
  fecha1?: string;
  pre1Kilos?: number;
  pre1Gramos?: number;
  pre1Organismos?: number;
  fecha2?: string;
  pre2Kilos?: number;
  pre2Gramos?: number;
  pre2Organismos?: number;
  fecha3?: string;
  pre3Kilos?: number;
  pre3Gramos?: number;
  pre3Organismos?: number;
  fecha4?: string;
  pre4Kilos?: number;
  pre4Gramos?: number;
  pre4Organismos?: number;
  fecha5?: string;
  pre5Kilos?: number;
  pre5Gramos?: number;
  pre5Organismos?: number;
  fechaFinal?: string;
  finalKilos?: number;
  finalGramos?: number;
  finalOrganismos?: number;
  totalKilos?: number;
  totalOrganismos?: number;
  pesoPromedioPrecosechado?: number;
  sobrevivenciaFinal?: number;
}

export interface PondExtractionStage {
  name?: string;
  etapa?: string;
  dateStr?: string;
  fecha?: string;
  kilos: number;
  gramos: number;
  org?: number;
  organismos?: number;
  kilosAcumulados?: number;
  fcaResultante?: number;
  fcaEtapa?: number;
}

export interface PondHarvestSummary {
  totalKilos: number;
  totalOrganismos: number;
  stages: PondExtractionStage[];
  pesoPromedio: number;
  tieneExtracciones: boolean;
  sobrevivenciaFinal?: number;
}

export interface PondNetMetrics {
  kilosExtraidos: number;
  organismosExtraidos: number;
  biomasaEnAgua: number;
  biomasaActual?: number;
  biomasaTotal: number;
  biomasaTeorica: number;
  biomasaHaEnAgua: number;
  poblacionEnAgua: number;
  poblacionTeorica?: number;
  camM2EnAgua: number;
  alimentoProyectadoDiaAjustado: number;
  alimentoProyectadoSemanaAjustado: number;
  porcentajeExtraidoBiomasa: number;
  porcentajeRestanteBiomasa: number;
  tieneExtracciones: boolean;
  alimentoAcumulado?: number;
  fcaSinPrecosecha: number;
  fcaPoscosecha: number;
  fcaEnAgua: number;
  fcaAjustado: number;
  diferenciaFca: number;
  stages: PondExtractionStage[];
}

export type NewPondRecord = Omit<PondRecord, 'id' | 'diasCultivo' | 'fca' | 'biomasaHa' | 'biomasaTotal' | 'sobrevivencia' | 'incrementoSemanal' | 'camM2Inicial' | 'camM2Actual' | 'alimentoProyectadoDia' | 'alimentoProyectadoSemana'>;

export interface EvaluationFormData {
  granja?: string;
  localidad?: string;
  hectareas?: number;
  zona?: string;
  no_estanques?: number;
  precrias?: boolean;
  procedencia?: string;
  laboratorio?: string;
  fecha_siembra?: string;
  densidad_siembra?: number;
  race_ways?: boolean;
  especie?: string;
  dias_cultivo?: number;
  peso_cosecha?: number;
  rendimiento_ton_ha?: number;
  porcentaje_sobreviencia?: number;
  fca?: number;
  suelo?: string;
  kg_ha?: number;
  agua?: string;
  utilizacion_bolsos?: boolean;
  fertilizacion?: string;
  tipo?: string;
  porcentaje_recambio?: number;
  muestreo_plancton?: string;
  temperatura?: number;
  oxigeno?: number;
  salinidad?: number;
  ph?: number;
  tipo_alimento?: string;
  no_raciones_dia?: number;
  horario_1?: string;
  horario_2?: string;
  horario_3?: string;
  uso_indicadores?: boolean;
  indicadores_ha?: number;
  alimento_medicado?: boolean;
  desinfectantes?: boolean;
  otros?: string;
  aditivos?: string;
  no_bombas?: number;
  capacidad?: number;
  tiempo_bombeo?: number;
  estado_bombeo?: string;
  valoracion?: string;
  director_produccion?: string;
  gerente_produccion?: string;
  personal_campo?: string;
  observaciones?: string;
  fecha?: string;
  [key: string]: any;
}
