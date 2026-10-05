import React, { useState } from 'react';
import { GoogleSheetsConfig, StockingProgramRecord, PondRecord, HarvestRecord } from '../types';
import { Share2, Link as LinkIcon, CheckCircle2, AlertCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { cleanDateString } from '../utils';

interface Props {
  config: GoogleSheetsConfig;
  onUpdateConfig: (config: GoogleSheetsConfig) => void;
  onImportData?: (data: { production?: PondRecord[], evaluations?: any[], harvests?: HarvestRecord[] }) => void;
  data: {
    stocking?: StockingProgramRecord[];
    production: PondRecord[];
    evaluations?: any[];
    harvests?: HarvestRecord[];
  };
}

const GoogleSheetsSync: React.FC<Props> = ({ config, onUpdateConfig, onImportData, data }) => {
  const [url, setUrl] = useState(config.webAppUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'import_success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveConfig = () => {
    onUpdateConfig({ ...config, webAppUrl: url });
    alert('Configuración guardada correctamente.');
  };

  const handleSync = async () => {
    if (!url) {
      setStatus('error');
      setErrorMessage('Por favor, ingresa una URL de Web App válida.');
      return;
    }

    setIsSyncing(true);
    setStatus('idle');

    try {
      const sanitizedProd = (data.production || []).map(p => ({
        ...p,
        fecha: cleanDateString(p.fecha) || p.fecha,
        fechaSiembra: cleanDateString(p.fechaSiembra) || p.fechaSiembra,
        fechaCosecha: cleanDateString(p.fechaCosecha) || p.fechaCosecha
      }));

      const sanitizedEvals = (data.evaluations || []).map(e => ({
        ...e,
        fecha: cleanDateString(e.fecha) || e.fecha,
        fecha_siembra: cleanDateString(e.fecha_siembra) || e.fecha_siembra
      }));

      const sanitizedHarvests = (data.harvests || []).map(h => ({
        ...h,
        fecha: cleanDateString(h.fecha) || h.fecha
      }));

      const payload = {
        action: 'sync_data',
        stocking: data.stocking || [],
        production: sanitizedProd,
        evaluations: sanitizedEvals,
        harvests: sanitizedHarvests,
        timestamp: new Date().toISOString()
      };

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      setStatus('success');
      onUpdateConfig({ ...config, lastSync: new Date().toLocaleTimeString() });
    } catch (error) {
      console.error('Error syncing with Google Sheets:', error);
      setStatus('error');
      setErrorMessage('Error de conexión. Verifica la URL y los permisos del script.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!url) {
      setStatus('error');
      setErrorMessage('Por favor, ingresa una URL de Web App válida.');
      return;
    }
    setIsImporting(true);
    setStatus('idle');
    try {
      const response = await fetch(`${url}?action=get_data`);
      const result = await response.json();
      if (result.status === 'success') {
        const importedProduction = result.data?.production || [];
        const importedEvaluations = result.data?.evaluations || [];
        const importedHarvests = result.data?.harvests || [];

        if (onImportData) {
          onImportData({
            production: importedProduction,
            evaluations: importedEvaluations,
            harvests: importedHarvests
          });
        }

        setStatus('import_success');
        onUpdateConfig({ ...config, lastSync: new Date().toLocaleTimeString() });
        alert(`Se importaron ${importedProduction.length} registros de producción, ${importedEvaluations.length} evaluaciones y ${importedHarvests.length} cosechas.`);
      } else {
        setStatus('error');
        setErrorMessage('Error del script: ' + (result.message || 'Desconocido'));
      }
    } catch (error) {
      console.error('Error al importar:', error);
      setStatus('error');
      setErrorMessage('No se pudo leer de la hoja. Asegúrate de que el script esté publicado como aplicación web.');
    } finally {
      setIsImporting(false);
    }
  };

  const appsScriptCode = `/**
 * CÓDIGO GOOGLE APPS SCRIPT PARA AQUACONTROL (Soporta Ciclo de Cosechas)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.action === 'sync_data') {
      // 1. Sincronizar Produccion
      var sheetProd = ss.getSheetByName('Produccion') || ss.insertSheet('Produccion');
      sheetProd.clear();
      if (data.production && data.production.length > 0) {
        var headersP = ["id", "granja", "estanque", "fecha", "hectareas", "pesoAnterior", "pesoActual", "incrementoSemanal", "diasCultivo", "sobrevivencia", "densidadActual", "biomasaTotal", "alimentoAcumulado", "fca"];
        sheetProd.appendRow(headersP);
        data.production.forEach(function(row) {
          var vals = headersP.map(function(h) { return (row[h] !== undefined && row[h] !== null) ? row[h] : ""; });
          sheetProd.appendRow(vals);
        });
      }

      // 2. Sincronizar Ciclo de Cosechas
      var sheetHarvest = ss.getSheetByName('Ciclo de Cosechas') || ss.insertSheet('Ciclo de Cosechas');
      sheetHarvest.clear();
      if (data.harvests && data.harvests.length > 0) {
        var headersH = ["id", "granja", "estanque", "fecha", "pre1Kilos", "pre1Gramos", "pre1Organismos", "pre2Kilos", "pre2Gramos", "pre2Organismos", "finalKilos", "finalGramos", "finalOrganismos", "totalOrganismos", "totalKilos", "pesoPromedioPrecosechado"];
        sheetHarvest.appendRow(headersH);
        data.harvests.forEach(function(row) {
          var vals = headersH.map(function(h) { return row[h] !== undefined ? row[h] : ""; });
          sheetHarvest.appendRow(vals);
        });
      }

      return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e.parameter.action;
  if (action === 'get_data') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    function sheetToObjects(sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return [];
      var headers = data[0];
      return data.slice(1).map(function(row) {
        var obj = {};
        headers.forEach(function(h, i) { obj[h] = row[i]; });
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-[#093661] p-6 rounded-2xl border border-[#125699] shadow-lg">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <Share2 className="w-6 h-6 text-green-400" />
          <span>Sincronización con Google Sheets</span>
        </h2>
        <p className="text-xs text-blue-200 mt-1">
          Conecta tu hoja de Google Sheets en la nube para sincronizar la producción y el ciclo de cosechas en tiempo real.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">
              URL de la Web App de Google Apps Script:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-[#0B4075] text-white border border-[#125699] rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-400 focus:outline-none"
              />
              <button
                onClick={handleSaveConfig}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
              >
                Guardar URL
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSync}
              disabled={isSyncing || !url}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Enviar Datos a Google Sheets'}</span>
            </button>

            <button
              onClick={handleImport}
              disabled={isImporting || !url}
              className="bg-[#0B4075] hover:bg-[#125699] disabled:opacity-50 text-blue-100 border border-[#1B5CB3] font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
              <span>{isImporting ? 'Importando...' : 'Descargar Datos de Google Sheets'}</span>
            </button>
          </div>

          {config.lastSync && (
            <p className="text-xs text-blue-300">
              Última sincronización: <span className="font-semibold text-white">{config.lastSync}</span>
            </p>
          )}

          {status === 'success' && (
            <div className="p-3 bg-emerald-900/30 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>¡Datos enviados con éxito a tu hoja de Google Sheets!</span>
            </div>
          )}

          {status === 'import_success' && (
            <div className="p-3 bg-cyan-900/30 border border-cyan-500/50 rounded-xl text-cyan-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>¡Datos importados con éxito desde Google Sheets!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0B4075] p-6 rounded-2xl border border-[#125699] shadow-lg">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
          <span>Código para Google Apps Script</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(appsScriptCode);
              alert('Código copiado al portapapeles');
            }}
            className="text-xs text-blue-200 hover:text-white flex items-center gap-1 bg-[#072C52] px-3 py-1.5 rounded-lg border border-[#125699]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Código</span>
          </button>
        </h3>
        <pre className="p-4 bg-[#051C33] rounded-xl text-[11px] text-blue-100 font-mono overflow-x-auto max-h-60 border border-[#125699]/60">
          {appsScriptCode}
        </pre>
      </div>
    </div>
  );
};

export default GoogleSheetsSync;
