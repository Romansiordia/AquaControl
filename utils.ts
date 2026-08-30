
import { PondRecord } from './types';

export const cleanDateString = (val: any): string => {
  if (val === undefined || val === null || val === '' || val === 'Invalid Date' || val === 'null' || val === 'undefined') {
    return '';
  }
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }
    return '';
  }
  if (typeof val === 'number') {
    // If it's a timestamp (epoch ms)
    if (val > 1000000000000) {
      const d = new Date(val);
      return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
    }
    // If it's Excel serial number (e.g. 45000-48000)
    if (val > 20000 && val < 70000) {
      const base = new Date(Date.UTC(1899, 11, 30));
      base.setUTCDate(base.getUTCDate() + Math.floor(val));
      return base.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  if (!str || str === 'Invalid Date') return '';

  // If format is ISO or contains T
  if (str.includes('T')) {
    const part = str.split('T')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  // If format is space separated YYYY-MM-DD HH:mm:ss
  if (str.includes(' ')) {
    const part = str.split(' ')[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  // Standard YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str)) {
    const parts = str.split(/[-/]/);
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
    const parts = str.split(/[-/]/);
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }

  // General fallback parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return '';
};

export const calculateDaysBetween = (startDateStr: any, endDateStr: any): number => {
  const start = cleanDateString(startDateStr);
  const end = cleanDateString(endDateStr);
  if (!start || !end) return 0;

  const p1 = start.split('-').map(Number);
  const p2 = end.split('-').map(Number);
  if (p1.length !== 3 || p2.length !== 3) return 0;
  if (isNaN(p1[0]) || isNaN(p1[1]) || isNaN(p1[2]) || isNaN(p2[0]) || isNaN(p2[1]) || isNaN(p2[2])) return 0;

  const utc1 = Date.UTC(p1[0], p1[1] - 1, p1[2]);
  const utc2 = Date.UTC(p2[0], p2[1] - 1, p2[2]);

  const diffDays = Math.round(Math.abs(utc2 - utc1) / (1000 * 60 * 60 * 24));
  return isNaN(diffDays) ? 0 : diffDays;
};

// Based on standard %BW table for L. Vannamei
export const getFeedingRatePercentage = (peso: number): number => {
  if (peso <= 0.1) return 15.0;
  if (peso <= 1.0) return 6.0 + ((1.0 - peso) / 0.9) * (15.0 - 6.0);
  if (peso <= 2.0) return 5.5 + ((2.0 - peso) / 1.0) * (6.0 - 5.5);
  if (peso <= 3.0) return 5.0 + ((3.0 - peso) / 1.0) * (5.5 - 5.0);
  if (peso <= 4.0) return 4.5 + ((4.0 - peso) / 1.0) * (5.0 - 4.5);
  if (peso <= 5.0) return 4.3 + ((5.0 - peso) / 1.0) * (4.5 - 4.3);
  if (peso <= 6.0) return 4.0 + ((6.0 - peso) / 1.0) * (4.3 - 4.0);
  if (peso <= 7.0) return 3.8 + ((7.0 - peso) / 1.0) * (4.0 - 3.8);
  if (peso <= 8.0) return 3.5 + ((8.0 - peso) / 1.0) * (3.8 - 3.5);
  if (peso <= 9.0) return 3.2 + ((9.0 - peso) / 1.0) * (3.5 - 3.2);
  if (peso <= 10.0) return 3.0 + ((10.0 - peso) / 1.0) * (3.2 - 3.0);
  if (peso <= 11.0) return 2.8 + ((11.0 - peso) / 1.0) * (3.0 - 2.8);
  if (peso <= 12.0) return 2.7 + ((12.0 - peso) / 1.0) * (2.8 - 2.7);
  if (peso <= 13.0) return 2.6 + ((13.0 - peso) / 1.0) * (2.7 - 2.6);
  if (peso <= 14.0) return 2.5 + ((14.0 - peso) / 1.0) * (2.6 - 2.5);
  if (peso <= 15.0) return 2.4 + ((15.0 - peso) / 1.0) * (2.5 - 2.4);
  if (peso <= 16.0) return 2.3 + ((16.0 - peso) / 1.0) * (2.4 - 2.3);
  if (peso <= 17.0) return 2.2 + ((17.0 - peso) / 1.0) * (2.3 - 2.2);
  if (peso <= 18.0) return 2.1 + ((18.0 - peso) / 1.0) * (2.2 - 2.1);
  if (peso <= 19.0) return 2.0 + ((19.0 - peso) / 1.0) * (2.1 - 2.0);
  if (peso <= 20.0) return 2.0;
  if (peso <= 25.0) return 1.8 + ((25.0 - peso) / 5.0) * (2.0 - 1.8);
  if (peso <= 30.0) return 1.6 + ((30.0 - peso) / 5.0) * (1.8 - 1.6);
  return 1.5; // Default for > 30g
};

export const calculatePondMetrics = (record: Partial<PondRecord>): PondRecord => {
  const pesoActual = record.pesoActual || 0;
  const pesoAnterior = record.pesoAnterior || 0;
  let densidadInicial = record.densidadInicial || 0;
  const sobrevivencia = record.sobrevivencia || 0;
  const hectareas = record.hectareas || 1;
  const alimentoAcumulado = record.alimentoAcumulado || 0;

  const rawOrgMt2 = record.orgMt2 || record.camM2Inicial || 0;
  if (densidadInicial === 0 && rawOrgMt2 > 0 && hectareas > 0) {
    densidadInicial = Math.round(rawOrgMt2 * (hectareas * 10000));
  }

  const incrementoSemanal = parseFloat((pesoActual - pesoAnterior).toFixed(2));
  const densidadActual = Math.round(densidadInicial * (sobrevivencia / 100));
  const biomasaTotal = parseFloat(((densidadActual * pesoActual) / 1000).toFixed(2));
  const biomasaHa = hectareas > 0 ? parseFloat((biomasaTotal / hectareas).toFixed(2)) : 0;
  const fca = biomasaTotal > 0 ? parseFloat((alimentoAcumulado / biomasaTotal).toFixed(2)) : 0;
  
  const camM2Inicial = hectareas > 0 && densidadInicial > 0 ? parseFloat((densidadInicial / (hectareas * 10000)).toFixed(2)) : (rawOrgMt2 || 0);
  const camM2Actual = hectareas > 0 && densidadActual > 0 ? parseFloat((densidadActual / (hectareas * 10000)).toFixed(2)) : 0;
  const orgMt2 = camM2Inicial > 0 ? camM2Inicial : (rawOrgMt2 || 0);

  // Feeding Projection based on %BW table interpolation
  let alimentoProyectadoDia = 0;
  let alimentoProyectadoSemana = 0;
  if (biomasaTotal > 0 && pesoActual > 0) {
    const bwPercentage = getFeedingRatePercentage(pesoActual);
    alimentoProyectadoDia = parseFloat(((biomasaTotal * bwPercentage) / 100).toFixed(2));
    alimentoProyectadoSemana = parseFloat((alimentoProyectadoDia * 7).toFixed(2));
  }

  // Clean all dates
  let fecha = cleanDateString(record.fecha);
  const fechaSiembra = cleanDateString(record.fechaSiembra);
  const fechaCosecha = cleanDateString(record.fechaCosecha);
  let diasCultivo = 0;

  if (record.diasCultivo !== undefined && record.diasCultivo !== null && !isNaN(Number(record.diasCultivo)) && Number(record.diasCultivo) >= 0) {
    diasCultivo = Number(record.diasCultivo);
  }

  if (fechaSiembra && fecha) {
    diasCultivo = calculateDaysBetween(fechaSiembra, fecha);
  } else if (fechaSiembra && diasCultivo > 0 && !fecha) {
    try {
      const parts = fechaSiembra.split('-').map(Number);
      const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      d.setUTCDate(d.getUTCDate() + diasCultivo);
      fecha = d.toISOString().split('T')[0];
    } catch (e) {
      fecha = fechaSiembra;
    }
  }

  if (!fecha) {
    fecha = new Date().toISOString().split('T')[0];
  }

  return {
    id: record.id || Math.random().toString(36).substr(2, 9),
    granja: record.granja || '',
    orgMt2: orgMt2,
    especie: record.especie || 'L. Vannamei',
    fecha: fecha,
    fechaSiembra: fechaSiembra,
    fechaCosecha: fechaCosecha,
    alimento: record.alimento || '',
    laboratorio: record.laboratorio || '',
    estanque: record.estanque || '',
    hectareas: hectareas,
    pesoAnterior: pesoAnterior,
    pesoActual: pesoActual,
    incrementoSemanal: incrementoSemanal,
    diasCultivo: isNaN(diasCultivo) ? 0 : diasCultivo,
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
    alimentoProyectadoDia: alimentoProyectadoDia,
    alimentoProyectadoSemana: alimentoProyectadoSemana
  };
};

export const formatNumber = (num: number) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(num);
};

export const formatDate = (dateStr: string) => {
  const clean = cleanDateString(dateStr);
  if (!clean) {
    return 'S/F';
  }
  try {
    const parts = clean.split('-').map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });
  } catch (e) {
    return clean;
  }
};

export const normalizeEstanque = (val: any): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (!str) return '';
  // Strip common pond prefixes case-insensitively: "estanque", "est.", "est", "tanque", "pond", "e-", "e", "#"
  const cleaned = str
    .replace(/^(estanque|est\.|est|tanque|pond|e-?|#)\s*/i, '')
    .replace(/^#\s*/, '')
    .trim();
  const num = Number(cleaned);
  if (!isNaN(num) && cleaned !== '') {
    return num.toString();
  }
  return cleaned.toLowerCase();
};