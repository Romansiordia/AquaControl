
import { PondRecord } from './types';

export const calculatePondMetrics = (record: Partial<PondRecord>): PondRecord => {
  const pesoActual = record.pesoActual || 0;
  const pesoAnterior = record.pesoAnterior || 0;
  const densidadInicial = record.densidadInicial || 0;
  const sobrevivencia = record.sobrevivencia || 0;
  const hectareas = record.hectareas || 1;
  const alimentoAcumulado = record.alimentoAcumulado || 0;

  const incrementoSemanal = parseFloat((pesoActual - pesoAnterior).toFixed(2));
  const densidadActual = Math.round(densidadInicial * (sobrevivencia / 100));
  const biomasaTotal = parseFloat(((densidadActual * pesoActual) / 1000).toFixed(2));
  const biomasaHa = hectareas > 0 ? parseFloat((biomasaTotal / hectareas).toFixed(2)) : 0;
  const fca = biomasaTotal > 0 ? parseFloat((alimentoAcumulado / biomasaTotal).toFixed(2)) : 0;
  
  const camM2Inicial = hectareas > 0 ? parseFloat((densidadInicial / (hectareas * 10000)).toFixed(2)) : 0;
  const camM2Actual = hectareas > 0 ? parseFloat((densidadActual / (hectareas * 10000)).toFixed(2)) : 0;
  const orgMt2 = record.orgMt2 || camM2Inicial;

  // Calculate days of cultivation if possible
  let diasCultivo = record.diasCultivo || 0;
  if (record.fechaSiembra) {
     const siembra = new Date(record.fechaSiembra);
     const hoy = record.fecha ? new Date(record.fecha) : new Date();
     
     // Ignorar la parte del tiempo para un cálculo de días más exacto
     const utc1 = Date.UTC(siembra.getFullYear(), siembra.getMonth(), siembra.getDate());
     const utc2 = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
     
     diasCultivo = Math.floor(Math.abs(utc2 - utc1) / (1000 * 60 * 60 * 24));
  }

  return {
    id: record.id || Math.random().toString(36).substr(2, 9),
    granja: record.granja || '',
    orgMt2: orgMt2,
    especie: record.especie || 'L. Vannamei',
    fecha: record.fecha || new Date().toISOString().split('T')[0],
    fechaSiembra: record.fechaSiembra || '',
    fechaCosecha: record.fechaCosecha || '',
    alimento: record.alimento || '',
    laboratorio: record.laboratorio || '',
    estanque: record.estanque || '',
    hectareas: hectareas,
    pesoAnterior: pesoAnterior,
    pesoActual: pesoActual,
    incrementoSemanal: incrementoSemanal,
    diasCultivo: diasCultivo,
    sobrevivencia: sobrevivencia,
    densidadInicial: densidadInicial,
    densidadActual: densidadActual,
    biomasaHa: biomasaHa,
    biomasaTotal: biomasaTotal,
    alimentoSemanal: record.alimentoSemanal || 0,
    alimentoAcumulado: alimentoAcumulado,
    fca: fca,
    camM2Inicial: camM2Inicial,
    camM2Actual: camM2Actual,
    organismosSembrados: record.organismosSembrados || densidadInicial,
    alimentadores: record.alimentadores || '',
    aditivos: record.aditivos || '',
    alimentoProyectadoDia: record.alimentoProyectadoDia || 0,
    alimentoProyectadoSemana: record.alimentoProyectadoSemana || 0
  };
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(num);
};

export const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};