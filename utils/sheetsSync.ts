import { PondRecord, EvaluationRecord, HarvestRecord } from '../types';
import { cleanDateString } from '../utils';

export const sanitizeProductionRecord = (p: PondRecord): PondRecord => ({
  ...p,
  granja: p.granja ? String(p.granja).trim() : '',
  estanque: p.estanque !== undefined && p.estanque !== null ? String(p.estanque).trim() : '',
  fecha: cleanDateString(p.fecha) || p.fecha || '',
  fechaSiembra: cleanDateString(p.fechaSiembra) || p.fechaSiembra || '',
  fechaCosecha: cleanDateString(p.fechaCosecha) || p.fechaCosecha || ''
});

export const sanitizeEvaluationRecord = (e: EvaluationRecord): EvaluationRecord => ({
  ...e,
  granja: e.granja ? String(e.granja).trim() : '',
  fecha: cleanDateString(e.fecha) || (e.fecha ? String(e.fecha) : ''),
  fecha_siembra: cleanDateString(e.fecha_siembra) || (e.fecha_siembra ? String(e.fecha_siembra) : '')
});

export const sanitizeHarvestRecord = (h: HarvestRecord): HarvestRecord => ({
  ...h,
  granja: h.granja ? String(h.granja).trim() : '',
  estanque: h.estanque !== undefined && h.estanque !== null ? String(h.estanque).trim() : '',
  fecha: cleanDateString(h.fecha) || h.fecha || '',
  fecha1: cleanDateString(h.fecha1) || h.fecha1 || '',
  fecha2: cleanDateString(h.fecha2) || h.fecha2 || '',
  fecha3: cleanDateString(h.fecha3) || h.fecha3 || '',
  fecha4: cleanDateString(h.fecha4) || h.fecha4 || '',
  fecha5: cleanDateString(h.fecha5) || h.fecha5 || '',
  fechaFinal: cleanDateString(h.fechaFinal) || h.fechaFinal || ''
});

export interface SyncResult {
  ok: boolean;
  message?: string;
}

export const postToAppsScript = async (webAppUrl: string, payload: Record<string, any>): Promise<SyncResult> => {
  if (!webAppUrl) {
    return { ok: false, message: 'No hay URL de Google Sheets configurada.' };
  }

  try {
    const response = await fetch(webAppUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let result: any = null;
    try {
      result = JSON.parse(text);
    } catch {
      return {
        ok: false,
        message: 'Google Sheets no devolvió una respuesta JSON válida. Verifica que el script esté actualizado e implementado para "Cualquiera".'
      };
    }

    if (result?.status === 'success') {
      return { ok: true };
    }

    return {
      ok: false,
      message: result?.message || 'El script de Google Sheets reportó un error al guardar.'
    };
  } catch (error: any) {
    console.error('Error communicating with Google Apps Script:', error);
    return {
      ok: false,
      message: 'No se pudo confirmar el guardado con Google Sheets. Revisa tu conexión o actualiza el Google Apps Script.'
    };
  }
};

export interface FetchSheetsDataResult {
  ok: boolean;
  data?: {
    production: PondRecord[];
    evaluations: EvaluationRecord[];
    harvests: HarvestRecord[];
  };
  message?: string;
}

export const fetchFromAppsScript = async (webAppUrl: string): Promise<FetchSheetsDataResult> => {
  if (!webAppUrl) {
    return { ok: false, message: 'Por favor, ingresa una URL de Web App válida.' };
  }

  try {
    const cleanUrl = webAppUrl.trim();
    const separator = cleanUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${cleanUrl}${separator}action=get_data&_t=${Date.now()}`);
    const text = await response.text();
    let result: any = null;
    try {
      result = JSON.parse(text);
    } catch {
      return {
        ok: false,
        message: 'No se pudo leer de la hoja. Asegúrate de que el script esté publicado como aplicación web con acceso para "Cualquiera".'
      };
    }

    if (result?.status === 'success') {
      return {
        ok: true,
        data: {
          production: Array.isArray(result.data?.production) ? result.data.production : [],
          evaluations: Array.isArray(result.data?.evaluations) ? result.data.evaluations : [],
          harvests: Array.isArray(result.data?.harvests) ? result.data.harvests : []
        }
      };
    }

    return {
      ok: false,
      message: 'Error del script: ' + (result?.message || 'Desconocido')
    };
  } catch (error) {
    console.error('Error al importar de Google Sheets:', error);
    return {
      ok: false,
      message: 'No se pudo leer de la hoja. Verifica tu conexión a internet y la URL de la Web App.'
    };
  }
};

export const UNIFIED_APPS_SCRIPT_CODE = `/**
 * CÓDIGO GOOGLE APPS SCRIPT UNIFICADO PARA AQUACONTROL
 * Soporta las 3 hojas: Produccion, Ciclo de Cosechas y Evaluacion Tecnica
 * - Actualización/Inserción/Eliminación fila por fila (UPDATE_OR_ADD / DELETE)
 * - Respaldo completo (sync_data)
 * - Auto-creación de hojas y columnas faltantes para evitar pérdida de parámetros
 */

var DEFAULT_HEADERS = {
  'Produccion': [
    "id", "granja", "orgMt2", "especie", "fecha", "fechaCosecha", "fechaSiembra",
    "alimento", "alimentadores", "aditivos", "laboratorio", "estanque", "hectareas",
    "pesoAnterior", "pesoActual", "incrementoSemanal", "diasCultivo", "sobrevivencia",
    "densidadInicial", "densidadActual", "biomasaHa", "biomasaActual", "biomasaTotal",
    "precosechas", "alimentoSemanal", "alimentoAcumulado", "fca", "fcaEnAgua",
    "camM2Inicial", "camM2Actual", "organismosSembrados", "alimentoProyectadoDia",
    "alimentoProyectadoSemana"
  ],
  'Ciclo de Cosechas': [
    "id", "granja", "estanque", "fecha",
    "fecha1", "pre1Kilos", "pre1Gramos", "pre1Organismos",
    "fecha2", "pre2Kilos", "pre2Gramos", "pre2Organismos",
    "fecha3", "pre3Kilos", "pre3Gramos", "pre3Organismos",
    "fecha4", "pre4Kilos", "pre4Gramos", "pre4Organismos",
    "fecha5", "pre5Kilos", "pre5Gramos", "pre5Organismos",
    "fechaFinal", "finalKilos", "finalGramos", "finalOrganismos",
    "totalKilos", "totalOrganismos", "pesoPromedioPrecosechado", "sobrevivenciaFinal"
  ],
  'Evaluacion Tecnica': [
    "id", "fecha", "granja", "localidad", "hectareas", "zona", "no_estanques", "precrias",
    "procedencia", "laboratorio", "fecha_siembra", "densidad_siembra", "race_ways", "especie",
    "dias_cultivo", "peso_cosecha", "rendimiento_ton_ha", "porcentaje_sobreviencia", "fca",
    "suelo", "kg_ha", "agua", "utilizacion_bolsos", "fertilizacion", "tipo", "porcentaje_recambio",
    "muestreo_plancton", "temperatura", "oxigeno", "salinidad", "ph", "tipo_alimento",
    "no_raciones_dia", "horario_1", "horario_2", "horario_3", "uso_indicadores", "indicadores_ha",
    "alimento_medicado", "desinfectantes", "otros", "aditivos", "no_bombas", "capacidad",
    "tiempo_bombeo", "estado_bombeo", "valoracion", "director_produccion", "gerente_produccion",
    "personal_campo", "observaciones", "submissionDate"
  ]
};

function ensureSheetAndHeaders(ss, sheetName, extraKeys) {
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  var defaults = DEFAULT_HEADERS[sheetName] || [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    var initHeaders = defaults.slice();
    if (extraKeys) {
      extraKeys.forEach(function(k) {
        if (k && initHeaders.indexOf(k) === -1) initHeaders.push(k);
      });
    }
    if (initHeaders.length > 0) {
      sheet.getRange(1, 1, 1, initHeaders.length).setValues([initHeaders]);
    }
    return { sheet: sheet, headers: initHeaders };
  }

  var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim();
  });

  var missing = [];
  defaults.forEach(function(h) {
    if (existingHeaders.indexOf(h) === -1 && missing.indexOf(h) === -1) missing.push(h);
  });
  if (extraKeys) {
    extraKeys.forEach(function(k) {
      if (k && existingHeaders.indexOf(k) === -1 && missing.indexOf(k) === -1) missing.push(k);
    });
  }

  if (missing.length > 0) {
    var startCol = existingHeaders.length + 1;
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
    existingHeaders = existingHeaders.concat(missing);
  }

  return { sheet: sheet, headers: existingHeaders };
}

function recordToRow(headers, record) {
  return headers.map(function(h) {
    var val = record[h];
    return (val !== undefined && val !== null) ? val : "";
  });
}

function upsertRecord(ss, sheetName, record) {
  var info = ensureSheetAndHeaders(ss, sheetName, Object.keys(record || {}));
  var sheet = info.sheet;
  var headers = info.headers;
  var idColIndex = headers.indexOf('id');
  var vals = recordToRow(headers, record);

  if (idColIndex === -1 || !record.id) {
    sheet.appendRow(vals);
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    sheet.appendRow(vals);
    return;
  }

  var idValues = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();
  var foundRow = -1;
  for (var i = 0; i < idValues.length; i++) {
    if (String(idValues[i][0]) === String(record.id)) {
      foundRow = i + 2;
      break;
    }
  }

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, vals.length).setValues([vals]);
  } else {
    sheet.appendRow(vals);
  }
}

function deleteRecordById(ss, sheetName, id) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idColIndex = headers.indexOf('id');
  if (idColIndex === -1) return;

  var idValues = sheet.getRange(2, idColIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = idValues.length - 1; i >= 0; i--) {
    if (String(idValues[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
    }
  }
}

function syncFullSheet(ss, sheetName, records) {
  var extraKeys = [];
  if (records && records.length > 0) {
    Object.keys(records[0]).forEach(function(k) { extraKeys.push(k); });
  }
  var info = ensureSheetAndHeaders(ss, sheetName, extraKeys);
  var sheet = info.sheet;
  var headers = info.headers;

  var rows = [headers];
  if (records && records.length > 0) {
    records.forEach(function(rec) {
      rows.push(recordToRow(headers, rec));
    });
  }
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.operation === 'UPDATE_OR_ADD' && data.sheetName && data.record) {
      upsertRecord(ss, data.sheetName, data.record);
    } else if (data.operation === 'DELETE' && data.sheetName && data.id) {
      deleteRecordById(ss, data.sheetName, data.id);
    } else if (data.action === 'sync_data') {
      if (data.production !== undefined) syncFullSheet(ss, 'Produccion', data.production);
      if (data.harvests !== undefined) syncFullSheet(ss, 'Ciclo de Cosechas', data.harvests);
      if (data.evaluations !== undefined) syncFullSheet(ss, 'Evaluacion Tecnica', data.evaluations);
    } else {
      return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Operación no reconocida'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'get_data') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tz = ss.getSpreadsheetTimeZone();

    function sheetToObjects(sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() < 2) return [];
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      return data.slice(1).map(function(row) {
        var obj = {};
        headers.forEach(function(h, i) {
          var val = row[i];
          if (val instanceof Date) {
            obj[h] = Utilities.formatDate(val, tz, "yyyy-MM-dd");
          } else {
            obj[h] = val;
          }
        });
        return obj;
      });
    }

    var result = {
      status: 'success',
      data: {
        production: sheetToObjects('Produccion'),
        harvests: sheetToObjects('Ciclo de Cosechas'),
        evaluations: sheetToObjects('Evaluacion Tecnica')
      }
    };
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
