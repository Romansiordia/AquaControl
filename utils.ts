
import { PondRecord, HarvestRecord, PondExtractionStage, PondHarvestSummary, PondNetMetrics } from './types';

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
  let densidadInicial = record.densidadInicial || record.organismosSembrados || 0;
  let sobrevivencia = record.sobrevivencia || 0;
  if (sobrevivencia > 0 && sobrevivencia <= 1) {
    sobrevivencia = Number((sobrevivencia * 100).toFixed(2));
  }
  const hectareas = record.hectareas || 1;
  const alimentoAcumulado = record.alimentoAcumulado || 0;

  const rawOrgMt2 = record.orgMt2 || record.camM2Inicial || 0;
  if (densidadInicial === 0 && rawOrgMt2 > 0 && hectareas > 0) {
    densidadInicial = Math.round(rawOrgMt2 * (hectareas * 10000));
  }

  // Preserve explicit weekly growth from file (e.g. incrementoSeman = 0.25, 0.38) or calculate from difference
  const incrementoSemanal = record.incrementoSemanal !== undefined && record.incrementoSemanal !== null && !isNaN(Number(record.incrementoSemanal)) && Number(record.incrementoSemanal) !== 0
    ? Number(Number(record.incrementoSemanal).toFixed(2))
    : parseFloat((pesoActual - pesoAnterior).toFixed(2));

  // If Densidad Actual is already provided in file (e.g. 2333103, 2099793), use it directly, or calculate
  const densidadActual = record.densidadActual && record.densidadActual > 0
    ? record.densidadActual
    : Math.round(densidadInicial * (sobrevivencia / 100));

  const rawBiomasaActual = record.biomasaActual !== undefined && record.biomasaActual !== null && record.biomasaActual !== ''
    ? parseFlexibleNumber(record.biomasaActual)
    : undefined;
  const rawBiomasaTotal = record.biomasaTotal !== undefined && record.biomasaTotal !== null && record.biomasaTotal !== ''
    ? parseFlexibleNumber(record.biomasaTotal)
    : undefined;
  const rawPrecosechas = record.precosechas !== undefined && record.precosechas !== null && record.precosechas !== ''
    ? parseFlexibleNumber(record.precosechas)
    : 0;

  const calculatedBio = (densidadActual > 0 && pesoActual > 0)
    ? parseFloat(((densidadActual * pesoActual) / 1000).toFixed(2))
    : 0;

  // biomasaActual: la biomasa viva en agua
  const biomasaActual = rawBiomasaActual !== undefined && rawBiomasaActual > 0
    ? rawBiomasaActual
    : calculatedBio;

  // precosechas
  let precosechas = rawPrecosechas;
  if (precosechas === 0 && rawBiomasaTotal && rawBiomasaActual && rawBiomasaTotal > rawBiomasaActual) {
    precosechas = parseFloat((rawBiomasaTotal - rawBiomasaActual).toFixed(2));
  }

  // biomasaTotal: biomasa viva en agua + precosechas acumuladas
  const biomasaTotal = rawBiomasaTotal !== undefined && rawBiomasaTotal > 0
    ? rawBiomasaTotal
    : parseFloat((biomasaActual + precosechas).toFixed(2));

  const biomasaHa = record.biomasaHa && record.biomasaHa > 0
    ? record.biomasaHa
    : (hectareas > 0 ? parseFloat((biomasaTotal / hectareas).toFixed(2)) : 0);

  // FCA del Excel (columna X = alimentoAcumulado / biomasaTotal)
  const fca = record.fca && record.fca > 0
    ? record.fca
    : (biomasaTotal > 0 ? parseFloat((alimentoAcumulado / biomasaTotal).toFixed(3)) : 0);

  // FCA en agua (sin precosechas = alimentoAcumulado / biomasaActual)
  const fcaEnAgua = biomasaActual > 0
    ? parseFloat((alimentoAcumulado / biomasaActual).toFixed(3))
    : fca;
  
  const camM2Inicial = hectareas > 0 && densidadInicial > 0 ? parseFloat((densidadInicial / (hectareas * 10000)).toFixed(2)) : (rawOrgMt2 || 0);
  const camM2Actual = hectareas > 0 && densidadActual > 0 ? parseFloat((densidadActual / (hectareas * 10000)).toFixed(2)) : 0;
  const orgMt2 = camM2Inicial > 0 ? camM2Inicial : (rawOrgMt2 || 0);

  // Feeding Projection based on %BW table interpolation using live biomass in water
  const bioForFeeding = biomasaActual > 0 ? biomasaActual : biomasaTotal;
  let alimentoProyectadoDia = 0;
  let alimentoProyectadoSemana = 0;
  if (bioForFeeding > 0 && pesoActual > 0) {
    const bwPercentage = getFeedingRatePercentage(pesoActual);
    alimentoProyectadoDia = parseFloat(((bioForFeeding * bwPercentage) / 100).toFixed(2));
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
    biomasaActual: biomasaActual,
    biomasaTotal: biomasaTotal,
    precosechas: precosechas,
    hasExplicitPrecosecha: record.hasExplicitPrecosecha !== undefined ? record.hasExplicitPrecosecha : (rawPrecosechas > 0),
    isPreharvestRow: record.isPreharvestRow || (rawPrecosechas > 0 && (alimentoAcumulado === 0 || fca === 0)),
    alimentoSemanal: record.alimentoSemanal || 0,
    alimentoAcumulado: alimentoAcumulado,
    fca: fca,
    fcaEnAgua: fcaEnAgua,
    camM2Inicial: camM2Inicial,
    camM2Actual: camM2Actual,
    organismosSembrados: record.organismosSembrados || densidadInicial,
    alimentadores: record.alimentadores || '',
    aditivos: record.aditivos || '',
    alimentoProyectadoDia: alimentoProyectadoDia,
    alimentoProyectadoSemana: alimentoProyectadoSemana
  };
};

/**
 * Determina si un registro corresponde a un evento de pre-cosecha o raleo/extracción
 */
export const isExtractionRecord = (record: PondRecord): boolean => {
  if (!record) return false;
  if (record.isPreharvestRow) return true;
  const pre = Number(record.precosechas) || 0;
  if (pre > 0) return true;
  if (record.hasExplicitPrecosecha) return true;

  // Detección complementaria para filas de extracción según la estructura acuícola:
  // días de cultivo avanzados, alimento acumulado en 0, fca en 0 y peso actual > 0
  const alim = Number(record.alimentoAcumulado) || 0;
  const fca = Number(record.fca) || 0;
  const doc = Number(record.diasCultivo) || 0;
  const pAct = Number(record.pesoActual) || 0;
  if (doc > 0 && alim === 0 && fca === 0 && pAct > 0) {
    return true;
  }
  return false;
};

export const parseFlexibleNumber = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    // Remove comma thousands separators (e.g. 149,434 or 1,980.50)
    const noComma = trimmed.replace(/,/g, '');
    if (!isNaN(Number(noComma))) return Number(noComma);
    // Remove period as thousands separators (e.g. 149.434,50)
    const euroClean = trimmed.replace(/\./g, '').replace(/,/g, '.');
    if (!isNaN(Number(euroClean))) return Number(euroClean);
    // Catch 1899 or 1900 dates which are numbers formatted as dates in Excel
    if (trimmed.startsWith('1899-') || trimmed.startsWith('1900-')) {
      const d = new Date(trimmed);
      const base = new Date('1899-12-30T00:00:00.000Z');
      const diffDays = (d.getTime() - base.getTime()) / (1000 * 3600 * 24);
      if (Math.abs(diffDays - Math.round(diffDays)) < 0.05) return Math.round(diffDays);
      return Number(diffDays.toFixed(2));
    }
  }
  return 0;
};

export const formatNumber = (num: number | string | undefined | null) => {
  const val = parseFlexibleNumber(num);
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(val);
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

export const matchPondAndHarvest = (
  pondGranja: string | undefined, 
  pondEstanque: any, 
  harvestGranja: string | undefined, 
  harvestEstanque: any
): boolean => {
  const normPondEst = normalizeEstanque(pondEstanque);
  const normHarvEst = normalizeEstanque(harvestEstanque);
  if (!normPondEst || normPondEst !== normHarvEst) return false;

  const gP = (pondGranja || '').toString().trim().toLowerCase();
  const gH = (harvestGranja || '').toString().trim().toLowerCase();
  
  if (!gP || !gH) return true;
  if (gP === gH) return true;
  if (gP.includes(gH) || gH.includes(gP)) return true;

  return false;
};

export const getPondExtractions = (
  granja: string | undefined,
  estanque: any,
  harvests: HarvestRecord[]
): PondHarvestSummary => {
  if (!harvests || harvests.length === 0) {
    return {
      totalKilos: 0,
      totalOrganismos: 0,
      stages: [],
      pesoPromedio: 0,
      tieneExtracciones: false
    };
  }

  const matching = harvests.filter(h => matchPondAndHarvest(granja, estanque, h.granja, h.estanque));
  let totalK = 0;
  let totalOrg = 0;
  let weightedGrams = 0;
  const stages: PondExtractionStage[] = [];
  let finalSurv: number | undefined = undefined;

  // Si existen múltiples registros para el mismo estanque, tomar el más completo/representativo
  // para evitar sumar dos veces el mismo ciclo de cosechas/precosechas.
  const targetHarvests = matching.length <= 1 ? matching : [
    matching.reduce((best, curr) => {
      const bestK = parseFlexibleNumber(best.totalKilos) || (parseFlexibleNumber(best.pre1Kilos) + parseFlexibleNumber(best.pre2Kilos));
      const currK = parseFlexibleNumber(curr.totalKilos) || (parseFlexibleNumber(curr.pre1Kilos) + parseFlexibleNumber(curr.pre2Kilos));
      return currK >= bestK ? curr : best;
    }, matching[0])
  ];

  targetHarvests.forEach(h => {
    const rawStages: { name: string; dateStr?: string; kilos: number; gramos: number; org: number }[] = [];
    const checkStage = (name: string, dateStr: string | undefined, kilos: any, gramos: any, rawOrg: any) => {
      const k = parseFlexibleNumber(kilos);
      const g = parseFlexibleNumber(gramos);
      let org = parseFlexibleNumber(rawOrg);
      if (org === 0 && k > 0 && g > 0) {
        org = Math.round((k * 1000) / g);
      }
      if (k > 0 || org > 0) {
        rawStages.push({ name, dateStr, kilos: k, gramos: g, org });
      }
    };

    checkStage('Pre-Cosecha 1', h.fecha1 || h.fecha, h.pre1Kilos, h.pre1Gramos, h.pre1Organismos);
    checkStage('Pre-Cosecha 2', h.fecha2, h.pre2Kilos, h.pre2Gramos, h.pre2Organismos);
    checkStage('Pre-Cosecha 3', h.fecha3, h.pre3Kilos, h.pre3Gramos, h.pre3Organismos);
    checkStage('Pre-Cosecha 4', h.fecha4, h.pre4Kilos, h.pre4Gramos, h.pre4Organismos);
    checkStage('Pre-Cosecha 5', h.fecha5, h.pre5Kilos, h.pre5Gramos, h.pre5Organismos);
    checkStage('Cosecha Final', h.fechaFinal || h.fecha, h.finalKilos, h.finalGramos, h.finalOrganismos);

    const declaredKilos = parseFlexibleNumber(h.totalKilos);
    const declaredOrg = parseFlexibleNumber(h.totalOrganismos);

    // Detectar si las etapas registradas fueron acumulativas o repetidas por muestreos semanales
    let processedStages = [...rawStages];
    if (rawStages.length > 1 && declaredKilos > 0) {
      const rawSum = rawStages.reduce((s, st) => s + st.kilos, 0);
      if (rawSum > declaredKilos) {
        // Caso A: Detección de etapas repetidas por arrastre en muestreos semanales (e.g. cuatro etapas de 840kg y una de 2927kg)
        const deduped: typeof rawStages = [];
        rawStages.forEach(st => {
          const already = deduped.find(d => Math.abs(d.kilos - st.kilos) < 1);
          if (!already) {
            deduped.push(st);
          }
        });
        const dedupedSum = deduped.reduce((s, st) => s + st.kilos, 0);
        if (Math.abs(dedupedSum - declaredKilos) < 2) {
          processedStages = deduped;
        } else {
          // Caso B: Verificar si los valores fueron guardados como totales acumulados
          let isCumulative = true;
          for (let i = 1; i < rawStages.length; i++) {
            if (rawStages[i].kilos < rawStages[i - 1].kilos) {
              isCumulative = false;
              break;
            }
          }
          if (isCumulative && Math.abs(rawStages[rawStages.length - 1].kilos - declaredKilos) < 1) {
            // Convertir a incrementos reales
            let prev = 0;
            processedStages = rawStages.map(st => {
              const delta = st.kilos - prev;
              prev = st.kilos;
              const org = st.gramos > 0 ? Math.round((delta * 1000) / st.gramos) : 0;
              return { ...st, kilos: Math.max(0, delta), org };
            }).filter(st => st.kilos > 0);
          }
        }
      }
    }

    processedStages.forEach((st, idx) => {
      const stageLabel = st.name.includes('Cosecha Final') 
        ? 'Cosecha Final' 
        : `Pre-Cosecha ${idx + 1}`;
      stages.push({
        etapa: stageLabel,
        fecha: cleanDateString(st.dateStr) || cleanDateString(h.fecha),
        kilos: st.kilos,
        gramos: st.gramos,
        organismos: st.org
      });
      totalK += st.kilos;
      totalOrg += st.org;
      if (st.kilos > 0 && st.gramos > 0) {
        weightedGrams += st.kilos * st.gramos;
      }
    });

    if (stages.length === 0 && (declaredKilos > 0 || declaredOrg > 0)) {
      totalK += declaredKilos;
      totalOrg += declaredOrg;
      stages.push({
        etapa: 'Cosecha Total',
        fecha: cleanDateString(h.fecha),
        kilos: declaredKilos,
        gramos: declaredOrg > 0 && declaredKilos > 0 ? Number(((declaredKilos * 1000) / declaredOrg).toFixed(2)) : 0,
        organismos: declaredOrg
      });
    }

    if (h.sobrevivenciaFinal) {
      finalSurv = parseFlexibleNumber(h.sobrevivenciaFinal);
    }
  });

  const pesoPromedio = totalK > 0 && totalOrg > 0 
    ? Number(((totalK * 1000) / totalOrg).toFixed(2)) 
    : (totalK > 0 && weightedGrams > 0 ? Number((weightedGrams / totalK).toFixed(2)) : 0);

  return {
    totalKilos: Number(totalK.toFixed(2)),
    totalOrganismos: Math.round(totalOrg),
    stages,
    pesoPromedio,
    sobrevivenciaFinal: finalSurv,
    tieneExtracciones: totalK > 0 || totalOrg > 0
  };
};

export const calculatePondNetMetrics = (
  pond: PondRecord, 
  harvests: HarvestRecord[],
  options?: { asOfDate?: string; isHistorical?: boolean }
): PondNetMetrics => {
  const summary = getPondExtractions(pond.granja, pond.estanque, harvests);
  const hectareas = Number(pond.hectareas) || 0;
  const pesoActual = Number(pond.pesoActual) || 0;
  const alimentoAcumulado = Number(pond.alimentoAcumulado) || 0;
  const poblacionTeorica = Number(pond.densidadActual) || 0;

  const pondPrecosechas = Number(pond.precosechas) || 0;
  const rawBioActual = pond.biomasaActual !== undefined && pond.biomasaActual !== null && Number(pond.biomasaActual) > 0 
    ? Number(pond.biomasaActual) 
    : undefined;
  const rawBioTotal = Number(pond.biomasaTotal) || 0;

  const recordDate = options?.asOfDate || cleanDateString(pond.fecha) || cleanDateString(pond.fechaSiembra);
  const isHistorical = options?.isHistorical ?? false;

  // Extractions to date:
  // Si se evalúa históricamente a lo largo del tiempo, únicamente contar las etapas ocurridas
  // en o antes de la fecha del muestreo actual.
  let stageKilosToDate = 0;
  let stageOrgToDate = 0;
  let hasStageDates = false;

  if (summary.stages && summary.stages.length > 0) {
    summary.stages.forEach(st => {
      const stDate = cleanDateString(st.fecha);
      if (stDate) {
        hasStageDates = true;
        if (!isHistorical || !recordDate || stDate <= recordDate) {
          stageKilosToDate += st.kilos;
          stageOrgToDate += st.organismos;
        }
      } else {
        if (!isHistorical) {
          stageKilosToDate += st.kilos;
          stageOrgToDate += st.organismos;
        }
      }
    });
  }

  let kilosExtraidos = 0;
  let organismosExtraidos = 0;

  if (isHistorical && hasStageDates) {
    // Si estamos graficando en línea de tiempo y las etapas tienen fechas específicas:
    // Sólo contar los kilos acumulados a esa fecha
    if (pondPrecosechas > 0) {
      kilosExtraidos = Math.max(pondPrecosechas, stageKilosToDate);
    } else if (rawBioTotal > 0 && rawBioActual !== undefined && rawBioTotal > rawBioActual) {
      kilosExtraidos = Math.max(parseFloat((rawBioTotal - rawBioActual).toFixed(2)), stageKilosToDate);
    } else {
      kilosExtraidos = stageKilosToDate;
    }
  } else {
    // Modo estándar / corte actual:
    if (pondPrecosechas > 0) {
      kilosExtraidos = pondPrecosechas;
    } else if (rawBioTotal > 0 && rawBioActual !== undefined && rawBioTotal > rawBioActual) {
      kilosExtraidos = parseFloat((rawBioTotal - rawBioActual).toFixed(2));
    } else if (!isHistorical && summary.totalKilos > 0) {
      kilosExtraidos = summary.totalKilos;
    } else if (isHistorical) {
      kilosExtraidos = stageKilosToDate;
    }
  }

  // Organismos extraídos
  if (stageOrgToDate > 0 && Math.abs(kilosExtraidos - stageKilosToDate) < 1) {
    organismosExtraidos = stageOrgToDate;
  } else if (summary.totalOrganismos > 0 && Math.abs(summary.totalKilos - kilosExtraidos) < 0.5) {
    organismosExtraidos = summary.totalOrganismos;
  } else if (kilosExtraidos > 0 && pesoActual > 0) {
    organismosExtraidos = Math.round((kilosExtraidos * 1000) / pesoActual);
  }

  // Biomasa viva que queda en el agua
  const biomasaEnAgua = rawBioActual !== undefined
    ? rawBioActual
    : Math.max(0, Number((rawBioTotal - kilosExtraidos).toFixed(2)));

  // Biomasa Total producida en el ciclo (Biomasa viva en agua + Kilos extraídos en pre-cosechas)
  const biomasaTotal = (rawBioTotal > 0 && rawBioTotal >= biomasaEnAgua + kilosExtraidos)
    ? rawBioTotal
    : parseFloat((biomasaEnAgua + kilosExtraidos).toFixed(2));

  const biomasaTeorica = biomasaTotal;
  const biomasaHaEnAgua = hectareas > 0 ? Number((biomasaEnAgua / hectareas).toFixed(2)) : 0;
  
  const poblacionEnAgua = Math.max(0, Math.round(poblacionTeorica - organismosExtraidos));
  const camM2EnAgua = hectareas > 0 ? Number((poblacionEnAgua / (hectareas * 10000)).toFixed(2)) : 0;

  let alimentoProyectadoDiaAjustado = 0;
  let alimentoProyectadoSemanaAjustado = 0;
  if (biomasaEnAgua > 0 && pesoActual > 0) {
    const bwPercentage = getFeedingRatePercentage(pesoActual);
    alimentoProyectadoDiaAjustado = parseFloat(((biomasaEnAgua * bwPercentage) / 100).toFixed(2));
    alimentoProyectadoSemanaAjustado = parseFloat((alimentoProyectadoDiaAjustado * 7).toFixed(2));
  }

  const porcentajeExtraidoBiomasa = biomasaTotal > 0 ? Number(((kilosExtraidos / biomasaTotal) * 100).toFixed(1)) : 0;
  const porcentajeRestanteBiomasa = biomasaTotal > 0 ? Number(((biomasaEnAgua / biomasaTotal) * 100).toFixed(1)) : 100;
  const tieneExtracciones = kilosExtraidos > 0 || summary.tieneExtracciones;

  // 1. FCA Sin Pre-cosecha (FCA en Agua):
  // Evalúa el consumo de alimento contra la biomasa viva que permanece en el agua.
  // Ejemplo Excel: 13,548 kg alimento / 6,405 kg en agua = 2.115
  const fcaSinPrecosecha = biomasaEnAgua > 0 
    ? parseFloat((alimentoAcumulado / biomasaEnAgua).toFixed(3)) 
    : (biomasaTotal > 0 ? parseFloat((alimentoAcumulado / biomasaTotal).toFixed(3)) : Number(pond.fca || 0));

  // 2. FCA Poscosecha / Ajustado (FCA Total Producido):
  // Evalúa el consumo contra la Biomasa Total biológica producida (Agua + Pre-cosechas extraídas).
  // Ejemplo Excel: 13,548 kg alimento / 10,172 kg biomasa total = 1.332
  const fcaPoscosecha = biomasaTotal > 0 
    ? parseFloat((alimentoAcumulado / biomasaTotal).toFixed(3)) 
    : (pond.fca && pond.fca > 0 ? Number(pond.fca) : fcaSinPrecosecha);

  const fcaEnAgua = fcaSinPrecosecha;
  const fcaAjustado = fcaPoscosecha;
  const diferenciaFca = parseFloat((fcaSinPrecosecha - fcaPoscosecha).toFixed(3));

  // Enriquecer cada etapa de extracción con el impacto acumulado en el FCA
  let enrichedStages: PondExtractionStage[] = summary.stages;
  if (enrichedStages.length === 0 && kilosExtraidos > 0) {
    enrichedStages = [{
      etapa: 'Pre-Cosecha',
      fecha: pond.fecha,
      kilos: kilosExtraidos,
      gramos: pesoActual,
      organismos: organismosExtraidos,
      kilosAcumulados: kilosExtraidos,
      fcaEtapa: fcaPoscosecha
    }];
  }

  let cumKilos = 0;
  enrichedStages = enrichedStages.map((stg) => {
    cumKilos += stg.kilos;
    const bioAcum = biomasaEnAgua + cumKilos;
    const fcaEtapa = bioAcum > 0 && alimentoAcumulado > 0 
      ? parseFloat((alimentoAcumulado / bioAcum).toFixed(3)) 
      : fcaAjustado;
    return {
      ...stg,
      kilosAcumulados: Number(cumKilos.toFixed(2)),
      fcaEtapa
    };
  });

  return {
    kilosExtraidos,
    organismosExtraidos,
    biomasaTeorica,
    biomasaActual: biomasaEnAgua,
    biomasaTotal,
    biomasaEnAgua,
    biomasaHaEnAgua,
    poblacionTeorica,
    poblacionEnAgua,
    camM2EnAgua,
    alimentoProyectadoDiaAjustado,
    alimentoProyectadoSemanaAjustado,
    porcentajeExtraidoBiomasa,
    porcentajeRestanteBiomasa,
    tieneExtracciones,
    stages: enrichedStages,
    alimentoAcumulado,
    fcaSinPrecosecha,
    fcaEnAgua,
    fcaAjustado,
    fcaPoscosecha,
    diferenciaFca
  };
};
