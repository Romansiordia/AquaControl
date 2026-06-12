
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

  // Calculate days of cultivation and exact fecha if missing
  let fecha = record.fecha;
  let diasCultivo = record.diasCultivo || 0;

  // Clean invalid date strings
  if (fecha === 'Invalid Date' || !fecha || isNaN(new Date(fecha).getTime())) {
    fecha = undefined;
  }

  if (record.fechaSiembra && record.fechaSiembra !== 'Invalid Date' && !isNaN(new Date(record.fechaSiembra).getTime())) {
    const cleanSiembra = record.fechaSiembra;
    if (!fecha && diasCultivo) {
      try {
        const d = new Date(cleanSiembra + 'T12:00:00');
        d.setDate(d.getDate() + Number(diasCultivo));
        fecha = d.toISOString().split('T')[0];
      } catch (e) {
        fecha = cleanSiembra;
      }
    } else if (fecha) {
      // standard YYYY-MM-DD parsing and cleanup
      fecha = String(fecha).split('T')[0];
    } else {
      fecha = new Date().toISOString().split('T')[0];
    }

    try {
      const siembra = new Date(cleanSiembra + 'T12:00:00');
      const hoy = new Date(fecha + 'T12:00:00');
      
      // Ignorar la parte del tiempo para un cálculo de días más exacto
      const utc1 = Date.UTC(siembra.getFullYear(), siembra.getMonth(), siembra.getDate());
      const utc2 = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      
      diasCultivo = Math.round(Math.abs(utc2 - utc1) / (1000 * 60 * 60 * 24));
    } catch (e) {
      // fallback
    }
  } else {
    // If we have no seed date, try fallback options
    fecha = fecha ? String(fecha).split('T')[0] : new Date().toISOString().split('T')[0];
  }

  return {
    id: record.id || Math.random().toString(36).substr(2, 9),
    granja: record.granja || '',
    orgMt2: orgMt2,
    especie: record.especie || 'L. Vannamei',
    fecha: fecha,
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
  if (!dateStr || dateStr === 'Invalid Date' || isNaN(new Date(dateStr).getTime())) {
    return 'S/F';
  }
  try {
    const cleanStr = dateStr.split('T')[0];
    const d = new Date(cleanStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return 'S/F';
  }
};