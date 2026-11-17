import React, { useState, useEffect } from 'react';
import { GoogleSheetsConfig, StockingProgramRecord, PondRecord, HarvestRecord, EvaluationRecord } from '../types';
import { Share2, CheckCircle2, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import {
  postToAppsScript,
  fetchFromAppsScript,
  sanitizeProductionRecord,
  sanitizeEvaluationRecord,
  sanitizeHarvestRecord,
  UNIFIED_APPS_SCRIPT_CODE
} from '../utils/sheetsSync';

interface Props {
  config: GoogleSheetsConfig;
  onUpdateConfig: (config: GoogleSheetsConfig) => void;
  onImportData?: (data: { production?: PondRecord[], evaluations?: EvaluationRecord[], harvests?: HarvestRecord[] }) => void;
  onClearAllLocalData?: () => void;
  data: {
    stocking?: StockingProgramRecord[];
    production: PondRecord[];
    evaluations?: EvaluationRecord[];
    harvests?: HarvestRecord[];
  };
}

const GoogleSheetsSync: React.FC<Props> = ({ config, onUpdateConfig, onImportData, onClearAllLocalData, data }) => {
  const [url, setUrl] = useState(config.webAppUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'import_success'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(config.webAppUrl || '');
  }, [config.webAppUrl]);

  const handleSaveConfig = () => {
    const trimmed = url.trim();
    setUrl(trimmed);
    onUpdateConfig({ ...config, webAppUrl: trimmed });
    setStatus('success');
    setStatusMessage('URL guardada correctamente.');
  };

  const handleSync = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setStatus('error');
      setErrorMessage('Por favor, ingresa una URL de Web App válida.');
      return;
    }

    setIsSyncing(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const payload = {
        action: 'sync_data',
        stocking: data.stocking || [],
        production: (data.production || []).map(sanitizeProductionRecord),
        evaluations: (data.evaluations || []).map(sanitizeEvaluationRecord),
        harvests: (data.harvests || []).map(sanitizeHarvestRecord),
        timestamp: new Date().toISOString()
      };

      const res = await postToAppsScript(trimmed, payload);
      if (res.ok) {
        setStatus('success');
        setStatusMessage(
          `¡Respaldo completado! Se enviaron ${payload.production.length} registros de producción, ${payload.evaluations.length} evaluaciones y ${payload.harvests.length} cosechas a Google Sheets.`
        );
        onUpdateConfig({ ...config, webAppUrl: trimmed, lastSync: new Date().toLocaleTimeString() });
      } else {
        setStatus('error');
        setErrorMessage(res.message || 'No se pudo confirmar el envío con Google Sheets.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setStatus('error');
      setErrorMessage('Por favor, ingresa una URL de Web App válida.');
      return;
    }

    setIsImporting(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetchFromAppsScript(trimmed);
      if (res.ok && res.data) {
        const importedProduction = res.data.production || [];
        const importedEvaluations = res.data.evaluations || [];
        const importedHarvests = res.data.harvests || [];

        if (importedProduction.length === 0 && importedHarvests.length === 0 && importedEvaluations.length === 0) {
          const confirmEmpty = confirm("En tu Google Sheets no hay registros (las hojas están vacías). ¿Deseas vaciar los datos del app para que coincidan con la hoja?");
          if (confirmEmpty && onImportData) {
            onImportData({
              production: [],
              evaluations: [],
              harvests: []
            });
            setStatus('import_success');
            setStatusMessage('Se vaciaron los datos de la aplicación para coincidir con Google Sheets.');
            onUpdateConfig({ ...config, webAppUrl: trimmed, lastSync: new Date().toLocaleTimeString() });
            return;
          }
          setIsImporting(false);
          return;
        }

        if (onImportData) {
          onImportData({
            production: importedProduction,
            evaluations: importedEvaluations,
            harvests: importedHarvests
          });
        }

        setStatus('import_success');
        setStatusMessage(
          `¡Sincronizado desde Google Sheets! (${importedProduction.length} producción, ${importedEvaluations.length} evaluaciones y ${importedHarvests.length} cosechas).`
        );
        onUpdateConfig({ ...config, webAppUrl: trimmed, lastSync: new Date().toLocaleTimeString() });
      } else {
        setStatus('error');
        setErrorMessage(res.message || 'No se pudo leer de la hoja.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-[#093661] p-6 rounded-2xl border border-[#125699] shadow-lg">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">
          <Share2 className="w-6 h-6 text-green-400" />
          <span>Sincronización con Google Sheets</span>
        </h2>
        <p className="text-xs text-blue-200 mt-1">
          Conecta tu hoja de Google Sheets independiente para sincronizar Producción, Registro de Granjas (Evaluación Técnica) y Ciclo de Cosechas con confirmación real.
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

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleSync}
              disabled={isSyncing || !url}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Enviando...' : 'Enviar Datos a Google Sheets'}</span>
            </button>

            <button
              onClick={handleImport}
              disabled={isImporting || !url}
              className="bg-[#0B4075] hover:bg-[#125699] disabled:opacity-50 text-blue-100 border border-[#1B5CB3] font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
              title="Descargar datos actualizados desde tu hoja de Google Sheets"
            >
              <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
              <span>{isImporting ? 'Sincronizando...' : 'Sincronizar Datos'}</span>
            </button>

            {onClearAllLocalData && (
              <button
                onClick={() => {
                  if (confirm('¿Deseas vaciar completamente todos los datos locales del app (Producción, Cosechas y Evaluaciones)? Esta acción limpiará la memoria de la aplicación y la hoja conectada.')) {
                    onClearAllLocalData();
                    setStatus('success');
                    setStatusMessage('Se han vaciado todos los datos del app.');
                  }
                }}
                className="bg-red-950/40 hover:bg-red-900 text-red-300 border border-red-700/50 font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ml-auto"
                title="Vaciar la memoria del app para comenzar en blanco"
              >
                <span>Vaciar Memoria del App</span>
              </button>
            )}
          </div>

          {config.lastSync && (
            <p className="text-xs text-blue-300">
              Última sincronización: <span className="font-semibold text-white">{config.lastSync}</span>
            </p>
          )}

          {status === 'success' && (
            <div className="p-3 bg-emerald-900/30 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage || '¡Datos enviados con éxito a tu hoja de Google Sheets!'}</span>
            </div>
          )}

          {status === 'import_success' && (
            <div className="p-3 bg-cyan-900/30 border border-cyan-500/50 rounded-xl text-cyan-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{statusMessage || '¡Datos sincronizados con éxito desde Google Sheets!'}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0B4075] p-6 rounded-2xl border border-[#125699] shadow-lg">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
          <span>Código Unificado para Google Apps Script (Producción, Cosechas y Evaluaciones)</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(UNIFIED_APPS_SCRIPT_CODE);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            }}
            className="text-xs text-blue-200 hover:text-white flex items-center gap-1 bg-[#072C52] px-3 py-1.5 rounded-lg border border-[#125699]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
          </button>
        </h3>
        <p className="text-xs text-blue-200 mb-3">
          Pega este código en <strong>Extensiones &gt; Apps Script</strong> de tu hoja de Google Sheets, guarda e implementa como <strong>Aplicación web</strong> con acceso para <strong>Cualquiera</strong>.
        </p>
        <pre className="p-4 bg-[#051C33] rounded-xl text-[11px] text-blue-100 font-mono overflow-x-auto max-h-60 border border-[#125699]/60">
          {UNIFIED_APPS_SCRIPT_CODE}
        </pre>
      </div>
    </div>
  );
};

export default GoogleSheetsSync;
