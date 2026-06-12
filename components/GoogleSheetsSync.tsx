
import React, { useState } from 'react';
import { GoogleSheetsConfig, StockingProgramRecord, PondRecord, HarvestRecord } from '../types';
import { Share2, Link as LinkIcon, CheckCircle2, AlertCircle, Copy, ExternalLink, RefreshCw } from 'lucide-react';

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

    if (!data.production || data.production.length === 0) {
      if (!window.confirm("No hay registros de producción actualmente. Si sincronizas ahora, se borrarán los datos de tu Google Sheet. ¿Deseas continuar?")) {
        return;
      }
    }

    setIsSyncing(true);
    setStatus('idle');

    try {
      const payload = {
        action: 'sync_data',
        stocking: data.stocking || [],
        production: data.production,
        evaluations: data.evaluations || [],
        harvests: data.harvests || [],
        timestamp: new Date().toISOString()
      };

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain'
        },
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

  const parseOldArrayFormat = (dataArray: any[]) => {
    if (!dataArray || dataArray.length < 2) return [];
    const headers = dataArray[0];
    const rows = dataArray.slice(1);
    return rows.map(row => {
        const obj: any = {};
        headers.forEach((h: string, i: number) => {
            let val = row[i];
            if (val === "SI") val = true;
            if (val === "NO") val = false;
            obj[h] = val;
        });
        return obj;
    });
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
        let importedProduction = [];
        let importedEvaluations = [];
        let importedHarvests = [];

        if (Array.isArray(result.data)) {
           // Old Apps script format (only production elements as 2D array)
           importedProduction = parseOldArrayFormat(result.data);
        } else if (result.data) {
           // New Apps script format
           importedProduction = result.data.production || [];
           importedEvaluations = result.data.evaluations || [];
           importedHarvests = result.data.harvests || [];
        }

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
        setErrorMessage('Error del script: ' + result.message);
      }
    } catch (error) {
      console.error('Error al importar:', error);
      setStatus('error');
      setErrorMessage('No se pudo leer de la hoja. Asegúrate de que el script esté publicado y actualizado.');
    } finally {
      setIsImporting(false);
    }
  };

  const appsScriptCode = `/**
 * CÓDIGO ACTUALIZADO PARA GOOGLE APPS SCRIPT (Soporta Ciclo de Cosechas)
 * Sigue estos pasos:
 * 1. Abre tu hoja de Google Sheets.
 * 2. Ve a Extensiones > Apps Script.
 * 3. Selecciona y borra todo el código existente.
 * 4. Pega este código completo.
 * 5. Haz clic en "Guardar proyecto" (icono de disquete).
 * 6. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 7. En el tipo, escoge "Aplicación Web".
 * 8. Configura de la siguiente forma:
 *    - Descripción: Versión con Ciclo de Cosechas
 *    - Ejecutar como: "Yo" (tu correo electrónico)
 *    - Quién tiene acceso: "Cualquier persona" (IMPORTANTE para que la app pueda conectarse)
 * 9. Haz clic en "Implementar", autoriza los accesos de tu cuenta y copia la URL de la web app resultante.
 * 10. Pega esa nueva URL en la sección de configuración de la app.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === 'sync_data') {
      // 1. Sincronizar Programa de Siembra
      var sheetStocking = ss.getSheetByName('Programa de Siembra') || ss.insertSheet('Programa de Siembra');
      sheetStocking.clear();
      
      if (data.stocking && data.stocking.length > 0) {
        var headersS = ["granja", "fechaCosecha", "fechaSiembra", "alimento", "laboratorio", "estanque", "hectareas", "organismosSembrados", "orgM2", "alimentadores", "aditivos"];
        sheetStocking.appendRow(headersS);
        data.stocking.forEach(function(row) {
          var vals = headersS.map(function(h) { return row[h] || ""; });
          sheetStocking.appendRow(vals);
        });
        sheetStocking.getRange(1, 1, 1, headersS.length).setFontWeight("bold").setBackground("#ffd966");
      }

      // 2. Sincronizar Producción
      var sheetProd = ss.getSheetByName('Produccion') || ss.insertSheet('Produccion');
      sheetProd.clear();
      if (data.production && data.production.length > 0) {
        var headersP = ["id", "granja", "orgMt2", "especie", "fecha", "fechaCosecha", "fechaSiembra", "alimento", "alimentadores", "aditivos", "laboratorio", "estanque", "hectareas", "pesoAnterior", "pesoActual", "incrementoSemanal", "diasCultivo", "sobrevivencia", "densidadInicial", "densidadActual", "biomasaHa", "biomasaTotal", "alimentoAcumulado", "fca", "camM2Inicial", "camM2Actual", "alimentoProyectadoDia", "alimentoProyectadoSemana"];
        sheetProd.appendRow(headersP);
        data.production.forEach(function(row) {
          var vals = headersP.map(function(h) { return row[h] || ""; });
          sheetProd.appendRow(vals);
        });
        sheetProd.getRange(1, 1, 1, headersP.length).setFontWeight("bold").setBackground("#9fc5e8");
      }
      
      // 3. Sincronizar Evaluación Técnica
      var sheetEval = ss.getSheetByName('Evaluacion Tecnica') || ss.insertSheet('Evaluacion Tecnica');
      sheetEval.clear();
      if (data.evaluations && data.evaluations.length > 0) {
        var headersE = ["id", "fecha", "granja", "localidad", "hectareas", "zona", "no_estanques", "precrias", "procedencia", "laboratorio", "fecha_siembra", "densidad_siembra", "race_ways", "especie", "dias_cultivo", "peso_cosecha", "rendimiento_ton_ha", "porcentaje_sobreviencia", "fca", "suelo", "kg_ha", "agua", "utilizacion_bolsos", "fertilizacion", "tipo", "porcentaje_recambio", "muestreo_plancton", "temperatura", "oxigeno", "salinidad", "ph", "tipo_alimento", "no_raciones_dia", "horario_1", "horario_2", "horario_3", "uso_indicadores", "indicadores_ha", "alimento_medicado", "desinfectantes", "otros", "aditivos", "no_bombas", "capacidad", "tiempo_bombeo", "estado_bombeo", "valoracion", "director_produccion", "gerente_produccion", "personal_campo", "observaciones"];
        sheetEval.appendRow(headersE);
        data.evaluations.forEach(function(row) {
          var vals = headersE.map(function(h) { 
              if (typeof row[h] === 'boolean') return row[h] ? 'SI' : 'NO';
              return row[h] || ""; 
          });
          sheetEval.appendRow(vals);
        });
        sheetEval.getRange(1, 1, 1, headersE.length).setFontWeight("bold").setBackground("#d9ead3");
      }

      // 4. Sincronizar Ciclo de Cosechas (NUEVO)
      var sheetHarvest = ss.getSheetByName('Ciclo de Cosechas') || ss.insertSheet('Ciclo de Cosechas');
      sheetHarvest.clear();
      if (data.harvests && data.harvests.length > 0) {
        var headersH = ["id", "granja", "estanque", "fecha", "pre1Kilos", "pre1Gramos", "pre1Organismos", "pre2Kilos", "pre2Gramos", "pre2Organismos", "finalKilos", "finalGramos", "finalOrganismos", "totalOrganismos", "totalKilos"];
        sheetHarvest.appendRow(headersH);
        data.harvests.forEach(function(row) {
          var vals = headersH.map(function(h) { return row[h] !== undefined ? row[h] : ""; });
          sheetHarvest.appendRow(vals);
        });
        sheetHarvest.getRange(1, 1, 1, headersH.length).setFontWeight("bold").setBackground("#c9daf8");
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
      var result = [];
      for (var i = 1; i < data.length; i++) {
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
            var val = data[i][j];
            if (val === "SI") val = true;
            if (val === "NO") val = false;
            obj[headers[j]] = val;
        }
        result.push(obj);
      }
      return result;
    }

    var production = sheetToObjects('Produccion');
    var evaluations = sheetToObjects('Evaluacion Tecnica');
    var harvests = sheetToObjects('Ciclo de Cosechas');

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success', 
      data: { production: production, evaluations: evaluations, harvests: harvests }
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput("Servicio CamaroneraPro activo");
}`;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Share2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Conexión con Google Sheets</h2>
            <p className="text-sm text-slate-500">Envía y recibe datos desde tu hoja de cálculo</p>
          </div>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-slate-400" />
              URL de la Web App de Google
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-green-500 outline-none"
              />
              <button 
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 gap-4">
            <div className="space-y-1 w-full sm:w-auto">
              <p className="text-sm font-medium text-slate-700">Estado de Sincronización</p>
              <div className="flex items-center gap-2">
                {status === 'idle' && (
                  <span className="text-xs text-slate-500">Listo para sincronizar</span>
                )}
                {status === 'success' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Sincronización Exitosa ({config.lastSync})</span>
                  </>
                )}
                {status === 'import_success' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Importación Exitosa</span>
                  </>
                )}
                {status === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600 font-medium">{errorMessage}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex w-full sm:w-auto gap-2">
              <button 
                onClick={handleImport}
                disabled={isImporting || !url}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm ${
                  isImporting || !url 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
                {isImporting ? 'Importando...' : 'Importar de Sheets'}
              </button>
              
              <button 
                onClick={handleSync}
                disabled={isSyncing || !url}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm ${
                  isSyncing || !url 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Share2 className="w-4 h-4" />
                {isSyncing ? 'Enviando...' : 'Enviar a Sheets'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
           <ExternalLink className="w-5 h-5 text-indigo-600" />
           Instrucciones de Configuración
        </h3>
        <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-[11px] leading-relaxed relative group overflow-x-auto">
          <pre>{appsScriptCode}</pre>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(appsScriptCode);
              alert('Código copiado al portapapeles');
            }}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
            title="Copiar Código"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-6 flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div className="text-sm text-indigo-900 leading-relaxed">
            <p className="font-bold mb-1">Nota importante sobre CORS:</p>
            <p>Debido a restricciones de seguridad del navegador, si el script de Google no tiene habilitado CORS explícitamente, la sincronización puede marcarse como exitosa pero no recibir confirmación del servidor (modo 'no-cors'). Verifica siempre tu Google Sheet después de sincronizar.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsSync;
