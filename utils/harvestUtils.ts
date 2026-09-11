import { HarvestRecord } from '../types';
import { cleanDateString, parseFlexibleNumber } from '../utils';

/**
 * Calculates organism count given kilos and grams, or falls back to rawOrg if provided and valid.
 * Formula: Math.round((kilos * 1000) / grams)
 */
export const calculateStageOrganismos = (
  kilos?: number | string | null,
  grams?: number | string | null,
  rawOrg?: number | string | null
): number => {
  const parsedOrg = parseFlexibleNumber(rawOrg);
  if (parsedOrg > 0) return parsedOrg;

  const parsedK = parseFlexibleNumber(kilos);
  const parsedG = parseFlexibleNumber(grams);
  if (parsedK > 0 && parsedG > 0) {
    return Math.round((parsedK * 1000) / parsedG);
  }

  return 0;
};

/**
 * Robust helper to extract a value from a row object with multiple possible key names.
 * Supports case-insensitive matching and stripping punctuation/spaces.
 */
export const getRowValue = (row: any, ...keys: string[]): any => {
  if (!row || typeof row !== 'object') return undefined;

  // 1. Direct match
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
      return row[k];
    }
  }

  // 2. Normalized key match (lowercase, no spaces, no underscores, no dashes, no parentheses)
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const cleanTarget = k.toLowerCase().replace(/[\s_()\-.]/g, '');
    const foundKey = rowKeys.find(rk => rk.toLowerCase().replace(/[\s_()\-.]/g, '') === cleanTarget);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      return row[foundKey];
    }
  }

  return undefined;
};

/**
 * Normalizes an arbitrary object (from Excel or JSON) into a strongly-typed HarvestRecord.
 * Automatically computes organisms for any stage where kilos and grams exist,
 * and ensures numbers are properly parsed from comma-formatted strings.
 */
export const normalizeHarvestRecord = (row: any): HarvestRecord | null => {
  if (!row || typeof row !== 'object') return null;

  const getVal = (...keys: string[]) => getRowValue(row, ...keys);

  const granja = String(getVal('granja', 'Granja', 'Empresa', 'farm') || '').trim();
  const estanque = String(getVal('estanque', 'Estanque', 'Pond', 'tanque') || '').trim();

  // Stage 1
  const fecha1 = cleanDateString(getVal('Fecha 1', 'Fecha1', 'fecha 1', 'fecha1', '1ra Pre-Cosecha Fecha', '1RA PRE-COSECHA Fecha'));
  const pre1Kilos = parseFlexibleNumber(getVal('Biomasa 1 (Kg)', 'Biomasa 1', 'Biomasa1', 'pre1Kilos', 'Kilos 1', 'kilos1', 'Biomasa (Kg) 1', '1ra Pre-Cosecha Biomasa (Kg)'));
  const pre1Gramos = parseFlexibleNumber(getVal('Peso 1 (g)', 'Peso 1', 'Peso1', 'pre1Gramos', 'Gramos 1', 'gramos1', 'Peso (g) 1', '1ra Pre-Cosecha Peso (g)'));
  const rawOrg1 = getVal('Org Totales 1', 'Org. Totales 1', 'Org Totales1', 'Org.Totales 1', 'pre1Organismos', 'Organismos 1', 'Organismos Totales 1', 'Org 1', '1ra Pre-Cosecha Org Totales');
  const pre1Organismos = calculateStageOrganismos(pre1Kilos, pre1Gramos, rawOrg1);

  // Stage 2
  const fecha2 = cleanDateString(getVal('Fecha 2', 'Fecha2', 'fecha 2', 'fecha2', '2da Pre-Cosecha Fecha', '2DA PRE-COSECHA Fecha'));
  const pre2Kilos = parseFlexibleNumber(getVal('Biomasa 2 (Kg)', 'Biomasa 2', 'Biomasa2', 'pre2Kilos', 'Kilos 2', 'kilos2', 'Biomasa (Kg) 2', '2da Pre-Cosecha Biomasa (Kg)'));
  const pre2Gramos = parseFlexibleNumber(getVal('Peso 2 (g)', 'Peso 2', 'Peso2', 'pre2Gramos', 'Gramos 2', 'gramos2', 'Peso (g) 2', '2da Pre-Cosecha Peso (g)'));
  const rawOrg2 = getVal('Org Totales 2', 'Org. Totales 2', 'Org Totales2', 'Org.Totales 2', 'pre2Organismos', 'Organismos 2', 'Organismos Totales 2', 'Org 2', '2da Pre-Cosecha Org Totales');
  const pre2Organismos = calculateStageOrganismos(pre2Kilos, pre2Gramos, rawOrg2);

  // Stage 3
  const fecha3 = cleanDateString(getVal('Fecha 3', 'Fecha3', 'fecha 3', 'fecha3', '3ra Pre-Cosecha Fecha', '3RA PRE-COSECHA Fecha'));
  const pre3Kilos = parseFlexibleNumber(getVal('Biomasa 3 (Kg)', 'Biomasa 3', 'Biomasa3', 'pre3Kilos', 'Kilos 3', 'kilos3', 'Biomasa (Kg) 3', '3ra Pre-Cosecha Biomasa (Kg)'));
  const pre3Gramos = parseFlexibleNumber(getVal('Peso 3 (g)', 'Peso 3', 'Peso3', 'pre3Gramos', 'Gramos 3', 'gramos3', 'Peso (g) 3', '3ra Pre-Cosecha Peso (g)'));
  const rawOrg3 = getVal('Org Totales 3', 'Org. Totales 3', 'Org Totales3', 'Org.Totales 3', 'pre3Organismos', 'Organismos 3', 'Organismos Totales 3', 'Org 3', '3ra Pre-Cosecha Org Totales');
  const pre3Organismos = calculateStageOrganismos(pre3Kilos, pre3Gramos, rawOrg3);

  // Stage 4
  const fecha4 = cleanDateString(getVal('Fecha 4', 'Fecha4', 'fecha 4', 'fecha4', '4ta Pre-Cosecha Fecha', '4TA PRE-COSECHA Fecha'));
  const pre4Kilos = parseFlexibleNumber(getVal('Biomasa 4 (Kg)', 'Biomasa 4', 'Biomasa4', 'pre4Kilos', 'Kilos 4', 'kilos4', 'Biomasa (Kg) 4', '4ta Pre-Cosecha Biomasa (Kg)'));
  const pre4Gramos = parseFlexibleNumber(getVal('Peso 4 (g)', 'Peso 4', 'Peso4', 'pre4Gramos', 'Gramos 4', 'gramos4', 'Peso (g) 4', '4ta Pre-Cosecha Peso (g)'));
  const rawOrg4 = getVal('Org Totales 4', 'Org. Totales 4', 'Org Totales4', 'Org.Totales 4', 'pre4Organismos', 'Organismos 4', 'Organismos Totales 4', 'Org 4', '4ta Pre-Cosecha Org Totales');
  const pre4Organismos = calculateStageOrganismos(pre4Kilos, pre4Gramos, rawOrg4);

  // Stage 5
  const fecha5 = cleanDateString(getVal('Fecha 5', 'Fecha5', 'fecha 5', 'fecha5', '5ta Pre-Cosecha Fecha', '5TA PRE-COSECHA Fecha'));
  const pre5Kilos = parseFlexibleNumber(getVal('Biomasa 5 (Kg)', 'Biomasa 5', 'Biomasa5', 'pre5Kilos', 'Kilos 5', 'kilos5', 'Biomasa (Kg) 5'));
  const pre5Gramos = parseFlexibleNumber(getVal('Peso 5 (g)', 'Peso 5', 'Peso5', 'pre5Gramos', 'Gramos 5', 'gramos5', 'Peso (g) 5'));
  const rawOrg5 = getVal('Org Totales 5', 'Org. Totales 5', 'Org Totales5', 'Org.Totales 5', 'pre5Organismos', 'Organismos 5', 'Organismos Totales 5', 'Org 5');
  const pre5Organismos = calculateStageOrganismos(pre5Kilos, pre5Gramos, rawOrg5);

  // Cosecha Final
  const fechaFinal = cleanDateString(getVal('Fecha Final', 'Fecha Cosecha', 'fechaFinal', 'Cosecha Final Fecha'));
  const finalKilos = parseFlexibleNumber(getVal('Biomasa Cosechada (Kg)', 'Biomasa Cosechada', 'finalKilos', 'Kilos Final', 'Cosecha Final Biomasa'));
  const finalGramos = parseFlexibleNumber(getVal('Peso Final (g)', 'Peso Final', 'finalGramos', 'Gramos Final', 'Cosecha Final Peso'));
  const rawOrgFinal = getVal('Org Cosechados', 'finalOrganismos', 'Organismos Final', 'Cosecha Final Org');
  const finalOrganismos = calculateStageOrganismos(finalKilos, finalGramos, rawOrgFinal);

  // Check if row has any useful data
  const hasData = granja !== '' || estanque !== '' || pre1Kilos > 0 || pre2Kilos > 0 || finalKilos > 0;
  if (!hasData) return null;

  // Totals
  let totalKilos = parseFlexibleNumber(getVal('Biomasa Precosechada Kg', 'Biomasa Precosechada', 'totalKilos', 'Total Kilos', 'total_kilos', 'Biomasa Total'));
  if (totalKilos === 0) {
    totalKilos = pre1Kilos + pre2Kilos + pre3Kilos + pre4Kilos + pre5Kilos + finalKilos;
  }

  let totalOrganismos = parseFlexibleNumber(getVal('Organismos Precosechados', 'Org Precosechados', 'totalOrganismos', 'Total Organismos', 'total_organismos', 'Org Totales'));
  if (totalOrganismos === 0) {
    totalOrganismos = pre1Organismos + pre2Organismos + pre3Organismos + pre4Organismos + pre5Organismos + finalOrganismos;
  }

  let pesoPromedioPrecosechado = parseFlexibleNumber(getVal('Peso Promedio Precosechado', 'Peso Promedio', 'pesoPromedioPrecosechado'));
  if (pesoPromedioPrecosechado === 0 && totalKilos > 0 && totalOrganismos > 0) {
    pesoPromedioPrecosechado = Number(((totalKilos * 1000) / totalOrganismos).toFixed(2));
  }

  let sobrevivenciaFinal = parseFlexibleNumber(getVal('Sobrevocencia Final', 'Sobrevivencia Final', 'Sobrevivencia', 'sobrevivenciaFinal'));
  if (sobrevivenciaFinal > 0 && sobrevivenciaFinal <= 1) {
    sobrevivenciaFinal = Number((sobrevivenciaFinal * 100).toFixed(1));
  }

  const id = String(getVal('id', 'ID') || `harvest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const fecha = fecha5 || fecha4 || fecha3 || fecha2 || fecha1 || fechaFinal || cleanDateString(getVal('fecha', 'Fecha')) || new Date().toISOString().split('T')[0];

  return {
    id,
    granja: granja || 'Granja',
    estanque: estanque || 'Estanque',
    fecha,
    fecha1: fecha1 || undefined,
    pre1Kilos: pre1Kilos > 0 ? pre1Kilos : undefined,
    pre1Gramos: pre1Gramos > 0 ? pre1Gramos : undefined,
    pre1Organismos: pre1Organismos > 0 ? pre1Organismos : undefined,
    fecha2: fecha2 || undefined,
    pre2Kilos: pre2Kilos > 0 ? pre2Kilos : undefined,
    pre2Gramos: pre2Gramos > 0 ? pre2Gramos : undefined,
    pre2Organismos: pre2Organismos > 0 ? pre2Organismos : undefined,
    fecha3: fecha3 || undefined,
    pre3Kilos: pre3Kilos > 0 ? pre3Kilos : undefined,
    pre3Gramos: pre3Gramos > 0 ? pre3Gramos : undefined,
    pre3Organismos: pre3Organismos > 0 ? pre3Organismos : undefined,
    fecha4: fecha4 || undefined,
    pre4Kilos: pre4Kilos > 0 ? pre4Kilos : undefined,
    pre4Gramos: pre4Gramos > 0 ? pre4Gramos : undefined,
    pre4Organismos: pre4Organismos > 0 ? pre4Organismos : undefined,
    fecha5: fecha5 || undefined,
    pre5Kilos: pre5Kilos > 0 ? pre5Kilos : undefined,
    pre5Gramos: pre5Gramos > 0 ? pre5Gramos : undefined,
    pre5Organismos: pre5Organismos > 0 ? pre5Organismos : undefined,
    fechaFinal: fechaFinal || undefined,
    finalKilos: finalKilos > 0 ? finalKilos : undefined,
    finalGramos: finalGramos > 0 ? finalGramos : undefined,
    finalOrganismos: finalOrganismos > 0 ? finalOrganismos : undefined,
    totalKilos,
    totalOrganismos,
    pesoPromedioPrecosechado: pesoPromedioPrecosechado > 0 ? pesoPromedioPrecosechado : undefined,
    sobrevivenciaFinal: sobrevivenciaFinal > 0 ? sobrevivenciaFinal : undefined,
  };
};

/**
 * Parses an Excel worksheet intelligently, handling:
 * 1. Multi-level headers (e.g., Row 0 group headers + Row 1 sub-headers)
 * 2. Split headers (e.g. Row 0 has 'Peso 1 (g)', 'Biomasa 1 (Kg)', 'Org Totales 1' and Row 1 has 'Fecha 1')
 * 3. Standard single-row headers
 */
export const parseHarvestWorksheet = (sheet: any, XLSX: any): HarvestRecord[] => {
  if (!sheet) return [];

  // Read as 2D array
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  if (!rawMatrix || rawMatrix.length === 0) return [];

  // Find where the header starts
  let headerRowIndex = 0;
  for (let r = 0; r < Math.min(6, rawMatrix.length); r++) {
    const rowStr = rawMatrix[r].map((c: any) => String(c || '').toLowerCase()).join(' ');
    if (rowStr.includes('granja') || rowStr.includes('estanque') || rowStr.includes('peso') || rowStr.includes('biomasa') || rowStr.includes('precosecha') || rowStr.includes('cosecha')) {
      headerRowIndex = r;
      break;
    }
  }

  const row0 = rawMatrix[headerRowIndex] || [];
  const row1 = rawMatrix[headerRowIndex + 1] || [];

  // Check if row0 and row1 are a 2-level header
  const row0Str = row0.map((c: any) => String(c || '').toLowerCase()).join(' ');
  const row1Str = row1.map((c: any) => String(c || '').toLowerCase()).join(' ');

  const hasSubHeadersInRow1 = row1Str.includes('fecha') || row1Str.includes('peso') || row1Str.includes('biomasa') || row1Str.includes('totales') || row1Str.includes('org');
  const isTwoLevel = hasSubHeadersInRow1 && (
    row0Str.includes('pre-cosecha') || row0Str.includes('precosecha') || row0Str.includes('cosecha') ||
    row0Str.includes('peso') || row0Str.includes('biomasa') || row0Str.includes('granja')
  );

  let headers: string[] = [];
  let dataStartIndex = headerRowIndex + 1;

  if (isTwoLevel) {
    dataStartIndex = headerRowIndex + 2;
    const maxCols = Math.max(row0.length, row1.length);
    let currentGroup = '';

    for (let c = 0; c < maxCols; c++) {
      const val0 = String(row0[c] || '').trim();
      const val1 = String(row1[c] || '').trim();

      if (val0 && !val0.match(/^(col_\d+|\d+)$/)) {
        currentGroup = val0;
      }

      let h = '';
      if (val0 && !val1) {
        h = val0;
      } else if (!val0 && val1) {
        // If val1 has a stage number like 'Fecha 1', keep it
        if (val1.match(/[1-5]/)) {
          h = val1;
        } else if (currentGroup && currentGroup.match(/[1-5]|primera|segunda|tercera|cuarta|1ra|2da|3ra|4ta|final/i)) {
          const matchNum = currentGroup.match(/([1-5])|1ra|2da|3ra|4ta|5ta/i);
          let num = '1';
          if (matchNum) {
            if (matchNum[1]) num = matchNum[1];
            else if (matchNum[0].toLowerCase().startsWith('1')) num = '1';
            else if (matchNum[0].toLowerCase().startsWith('2')) num = '2';
            else if (matchNum[0].toLowerCase().startsWith('3')) num = '3';
            else if (matchNum[0].toLowerCase().startsWith('4')) num = '4';
            else if (matchNum[0].toLowerCase().startsWith('5')) num = '5';
          }
          h = `${val1} ${num}`;
        } else {
          h = val1;
        }
      } else if (val0 && val1) {
        if (val0 === val1) {
          h = val0;
        } else {
          h = `${val0} ${val1}`;
        }
      } else {
        h = `col_${c}`;
      }
      headers.push(h);
    }
  } else {
    // Single row header
    headers = row0.map((c: any, idx: number) => String(c || '').trim() || `col_${idx}`);
  }

  // Convert remaining rows into objects
  const records: HarvestRecord[] = [];
  for (let r = dataStartIndex; r < rawMatrix.length; r++) {
    const rawRow = rawMatrix[r];
    if (!rawRow || rawRow.length === 0) continue;

    // Check if entire row is empty
    const hasContent = rawRow.some((c: any) => c !== undefined && c !== null && String(c).trim() !== '');
    if (!hasContent) continue;

    const rowObj: any = {};
    headers.forEach((h, idx) => {
      rowObj[h] = rawRow[idx];
    });

    const normalized = normalizeHarvestRecord(rowObj);
    if (normalized) {
      records.push(normalized);
    }
  }

  return records;
};
