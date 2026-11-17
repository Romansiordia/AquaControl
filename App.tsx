import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PondRecord, NewPondRecord, EvaluationRecord, EvaluationFormData, HarvestRecord, GoogleSheetsConfig } from './types';
import { INITIAL_DATA } from './constants';
import { calculatePondMetrics, formatNumber, normalizeEstanque, cleanDateString, parseFlexibleNumber } from './utils';
import { normalizeHarvestRecord, parseHarvestWorksheet } from './utils/harvestUtils';
import {
  postToAppsScript,
  fetchFromAppsScript,
  sanitizeProductionRecord,
  sanitizeEvaluationRecord,
  sanitizeHarvestRecord
} from './utils/sheetsSync';
import { RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import PondForm from './components/PondForm';
import FilterPanel, { FilterState } from './components/FilterPanel';
import EstadisticasView from './components/EstadisticasView';
import Sidebar, { View } from './components/Sidebar';
import FarmEvaluationForm from './components/FarmEvaluationForm';
import PondDetailModal from './components/PondDetailModal';
import EvaluationList from './components/EvaluationList';
import ProductionProgram from './components/ProductionProgram';
import HarvestsModule from './components/HarvestsModule';
import TendenciasView from './components/TendenciasView';
import GoogleSheetsSync from './components/GoogleSheetsSync';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [actualRecords, setRecords] = useState<PondRecord[]>(() => {
    const saved = localStorage.getItem('camaronera_records');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((r: any) => calculatePondMetrics(r));
        }
      } catch (e) {
        console.error("Error reading camaronera_records", e);
      }
    }
    return INITIAL_DATA.map(r => calculatePondMetrics(r as any));
  });

  const [actualEvaluations, setEvaluations] = useState<EvaluationRecord[]>(() => {
    const saved = localStorage.getItem('camaronera_evaluations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Error parsing camaronera_evaluations:", e);
      }
    }
    return [];
  });

  const [actualHarvests, setHarvests] = useState<HarvestRecord[]>(() => {
    const saved = localStorage.getItem('camaronera_harvests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((r: any) => normalizeHarvestRecord(r) || r);
        }
      } catch (e) {
        console.error("Error parsing camaronera_harvests:", e);
      }
    }
    return [];
  });

  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localRecords, setLocalRecords] = useState<PondRecord[]>([]);
  const [localEvaluations, setLocalEvaluations] = useState<EvaluationRecord[]>([]);
  const [localHarvests, setLocalHarvests] = useState<HarvestRecord[]>([]);

  const records = isLocalMode ? localRecords : actualRecords;
  const evaluations = isLocalMode ? localEvaluations : actualEvaluations;
  const harvests = isLocalMode ? localHarvests : actualHarvests;

  const [activeView, setActiveView] = useState<View>('estadisticas');
  const [editingRecord, setEditingRecord] = useState<PondRecord | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<Partial<EvaluationRecord> | null>(null);
  const [selectedPond, setSelectedPond] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'syncing' | 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncStatusTimeoutRef = useRef<number | null>(null);

  const showSyncStatus = (type: 'syncing' | 'success' | 'error', message: string, autoClearMs?: number) => {
    if (syncStatusTimeoutRef.current) {
      window.clearTimeout(syncStatusTimeoutRef.current);
      syncStatusTimeoutRef.current = null;
    }
    setSyncStatus({ type, message });
    if (autoClearMs) {
      syncStatusTimeoutRef.current = window.setTimeout(() => {
        setSyncStatus(null);
        syncStatusTimeoutRef.current = null;
      }, autoClearMs);
    }
  };

  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('camaronera_google_sheets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return { webAppUrl: '' };
  });

  useEffect(() => {
    if (!isLocalMode) {
      localStorage.setItem('camaronera_records', JSON.stringify(actualRecords));
    }
  }, [actualRecords, isLocalMode]);

  useEffect(() => {
    if (!isLocalMode) {
      localStorage.setItem('camaronera_evaluations', JSON.stringify(actualEvaluations));
    }
  }, [actualEvaluations, isLocalMode]);

  useEffect(() => {
    if (!isLocalMode) {
      localStorage.setItem('camaronera_harvests', JSON.stringify(actualHarvests));
    }
  }, [actualHarvests, isLocalMode]);

  useEffect(() => {
    localStorage.setItem('camaronera_google_sheets', JSON.stringify(googleSheetsConfig));
  }, [googleSheetsConfig]);

  useEffect(() => {
    const url = googleSheetsConfig.webAppUrl?.trim();
    if (!url || isLocalMode) return;

    let isCancelled = false;
    const syncOnStartup = async () => {
      showSyncStatus('syncing', 'Sincronizando datos con Google Sheets...');
      const res = await fetchFromAppsScript(url);
      if (isCancelled) return;

      if (res.ok && res.data) {
        const prod = res.data.production || [];
        const evals = res.data.evaluations || [];
        const harvs = res.data.harvests || [];
        const hasCloudData = prod.length > 0 || evals.length > 0 || harvs.length > 0;

        if (hasCloudData) {
          handleImportData(res.data, false);
        }

        setGoogleSheetsConfig(prev => ({ ...prev, lastSync: new Date().toLocaleTimeString() }));
        showSyncStatus(
          'success',
          hasCloudData
            ? `Datos actualizados desde Google Sheets (${prod.length} producción, ${evals.length} evaluaciones, ${harvs.length} cosechas).`
            : 'Conectado a Google Sheets (hoja vacía lista para recibir registros).',
          4000
        );
      } else {
        showSyncStatus('error', res.message || 'No se pudo cargar automáticamente desde Google Sheets. Mostrando copia local.');
      }
    };

    syncOnStartup();
    return () => {
      isCancelled = true;
    };
  }, [googleSheetsConfig.webAppUrl, isLocalMode]);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    granja: '',
    alimento: '',
    laboratorio: '',
    estanque: ''
  });

  const uniqueGranjas = useMemo(() => {
    const gSet = new Set<string>();
    records.forEach(r => { if (r.granja) gSet.add(r.granja); });
    return Array.from(gSet).sort();
  }, [records]);

  const uniqueAlimentos = useMemo(() => {
    const aSet = new Set<string>();
    records.forEach(r => { if (r.alimento) aSet.add(r.alimento); });
    return Array.from(aSet).sort();
  }, [records]);

  const uniqueLaboratorios = useMemo(() => {
    const lSet = new Set<string>();
    records.forEach(r => { if (r.laboratorio) lSet.add(r.laboratorio); });
    return Array.from(lSet).sort();
  }, [records]);

  const uniqueEstanques = useMemo(() => {
    const eSet = new Set<string>();
    records.forEach(r => { if (r.estanque) eSet.add(normalizeEstanque(r.estanque)); });
    return Array.from(eSet).sort((a, b) => Number(a) - Number(b));
  }, [records]);

  // Filtered raw records
  const filteredRawRecords = useMemo(() => {
    return records.filter(record => {
      const matchGranja = !filters.granja || record.granja?.toLowerCase().trim() === filters.granja.toLowerCase().trim();
      const matchAlimento = !filters.alimento || record.alimento === filters.alimento;
      const matchLab = !filters.laboratorio || record.laboratorio === filters.laboratorio;
      const matchEstanque = !filters.estanque || normalizeEstanque(record.estanque) === normalizeEstanque(filters.estanque);
      return matchGranja && matchAlimento && matchLab && matchEstanque;
    });
  }, [records, filters]);

  // Latest snapshot per pond for statistics
  const filteredRecords = useMemo(() => {
    const latestMap = new Map<string, PondRecord>();
    const sorted = [...filteredRawRecords].sort((a, b) => {
      const da = new Date(cleanDateString(a.fecha) || a.fecha).getTime();
      const db = new Date(cleanDateString(b.fecha) || b.fecha).getTime();
      return da - db;
    });

    sorted.forEach(r => {
      const key = `${r.granja?.toLowerCase().trim()}_${normalizeEstanque(r.estanque)}`;
      latestMap.set(key, r);
    });

    return Array.from(latestMap.values());
  }, [filteredRawRecords]);

  // Chart data
  const chartData = useMemo(() => {
    return filteredRecords.map(r => ({
      name: `E${normalizeEstanque(r.estanque)}`,
      granja: r.granja,
      peso: Number(r.pesoActual) || 0,
      incremento: Number(r.incrementoSemanal) || 0,
      sobrevivencia: Number(r.sobrevivencia) || 0,
      biomasaTotal: Number(r.biomasaTotal) || 0,
      fca: Number(r.fca) || 0
    }));
  }, [filteredRecords]);

  // Historical temporal trend data
  const historicalChartData = useMemo(() => {
    const byDate = new Map<string, any>();
    filteredRawRecords.forEach(record => {
      const dateStr = cleanDateString(record.fecha) || record.fecha || '';
      if (!dateStr) return;

      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, { fechaRaw: dateStr, fecha: dateStr });
      }
      const entry = byDate.get(dateStr);
      const pondKey = filters.granja ? `Estanque ${normalizeEstanque(record.estanque)}` : `${record.granja} E${normalizeEstanque(record.estanque)}`;
      entry[`${pondKey}_peso`] = Number(record.pesoActual) || 0;
      entry[`${pondKey}_biomasa`] = Number(record.biomasaTotal) || 0;
      entry[`${pondKey}_surv`] = Number(record.sobrevivencia) || 0;
    });

    return Array.from(byDate.values()).sort((a, b) => a.fechaRaw.localeCompare(b.fechaRaw));
  }, [filteredRawRecords, filters.granja]);

  const uniqueEstanquesInHistory = useMemo(() => {
    const estanques = new Set<string>();
    historicalChartData.forEach(entry => {
      Object.keys(entry).forEach(k => {
        if (k.endsWith('_peso')) {
          estanques.add(k.replace('_peso', ''));
        }
      });
    });
    return Array.from(estanques).sort();
  }, [historicalChartData]);

  const lineColors = ['#3b82f6', '#10b981', '#fb923c', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#eab308'];

  // Handle local excel upload
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        let prodName = workbook.SheetNames.find(n => n.toLowerCase().includes('produccion') || n.toLowerCase().includes('producción'));
        const evalsName = workbook.SheetNames.find(n => n.toLowerCase().includes('evaluacion') || n.toLowerCase().includes('evaluación'));
        const harvestsName = workbook.SheetNames.find(n => n.toLowerCase().includes('cosecha') || n.toLowerCase().includes('precosecha') || n.toLowerCase().includes('raleo'));

        if (!prodName && !evalsName && !harvestsName && workbook.SheetNames.length > 0) {
          prodName = workbook.SheetNames[0];
        }

        const importedProduction = prodName ? XLSX.utils.sheet_to_json<PondRecord>(workbook.Sheets[prodName], { raw: false }) : undefined;
        const importedEvaluations = evalsName ? XLSX.utils.sheet_to_json<EvaluationRecord>(workbook.Sheets[evalsName], { raw: false }) : undefined;
        const importedHarvests = harvestsName ? parseHarvestWorksheet(workbook.Sheets[harvestsName], XLSX) : undefined;

        handleImportData({
          production: importedProduction,
          evaluations: importedEvaluations,
          harvests: importedHarvests
        }, true);

        setIsLocalMode(true);
      } catch (error) {
        console.error("Error reading local Excel", error);
        showSyncStatus('error', 'Hubo un error al leer el archivo local. Asegúrate de que sea el formato correcto.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleImportData = (importedData: { production?: PondRecord[], evaluations?: EvaluationRecord[], harvests?: HarvestRecord[] }, isLocal = false) => {
    if (importedData.production !== undefined) {
      const parsedRecords = (importedData.production || []).map(r => calculatePondMetrics(r));
      if (isLocal) {
        setLocalRecords(parsedRecords);
      } else {
        setRecords(parsedRecords);
        localStorage.setItem('camaronera_records', JSON.stringify(parsedRecords));
      }
    }

    if (importedData.evaluations !== undefined) {
      const evals: EvaluationRecord[] = (importedData.evaluations || []).map((ev: any, idx: number) => ({
        ...ev,
        id: ev.id || `eval_${Date.now()}_${idx}`,
        granja: ev.granja ? String(ev.granja).trim() : '',
        fecha: cleanDateString(ev.fecha) || (ev.fecha ? String(ev.fecha) : ''),
        fecha_siembra: cleanDateString(ev.fecha_siembra) || (ev.fecha_siembra ? String(ev.fecha_siembra) : ''),
        submissionDate: ev.submissionDate || new Date().toISOString()
      }));
      if (isLocal) {
        setLocalEvaluations(evals);
      } else {
        setEvaluations(evals);
        localStorage.setItem('camaronera_evaluations', JSON.stringify(evals));
      }
    }

    if (importedData.harvests !== undefined) {
      const normalizedH = (importedData.harvests || []).map(h => normalizeHarvestRecord(h) || h);
      if (isLocal) {
        setLocalHarvests(normalizedH);
      } else {
        setHarvests(normalizedH);
        localStorage.setItem('camaronera_harvests', JSON.stringify(normalizedH));
      }
    }
  };

  // Synchronize a single record change to Google Sheets with real confirmation
  const syncRecordToSheets = async (action: 'UPDATE_OR_ADD' | 'DELETE', sheetName: string, recordOrId: any): Promise<boolean> => {
    if (!googleSheetsConfig.webAppUrl || isLocalMode) return false;

    let sanitizedRecord = recordOrId;
    if (action === 'UPDATE_OR_ADD' && recordOrId) {
      if (sheetName === 'Produccion') sanitizedRecord = sanitizeProductionRecord(recordOrId);
      else if (sheetName === 'Evaluacion Tecnica') sanitizedRecord = sanitizeEvaluationRecord(recordOrId);
      else if (sheetName === 'Ciclo de Cosechas') sanitizedRecord = sanitizeHarvestRecord(recordOrId);
    }

    showSyncStatus('syncing', `Guardando en Google Sheets (${sheetName})...`);
    const payload = {
      operation: action,
      sheetName,
      record: action === 'UPDATE_OR_ADD' ? sanitizedRecord : undefined,
      id: action === 'DELETE' ? recordOrId : undefined,
      timestamp: new Date().toISOString()
    };

    const res = await postToAppsScript(googleSheetsConfig.webAppUrl, payload);
    if (res.ok) {
      setGoogleSheetsConfig(prev => ({ ...prev, lastSync: new Date().toLocaleTimeString() }));
      showSyncStatus('success', `Guardado y confirmado en Google Sheets (${sheetName}).`, 3500);
      return true;
    } else {
      showSyncStatus('error', res.message || `No se pudo confirmar el guardado en Google Sheets (${sheetName}).`);
      return false;
    }
  };

  // Synchronize entire datasets (Bulk Sync) with real confirmation
  const syncBulkToSheets = async (
    currentRecords: PondRecord[],
    currentEvals: EvaluationRecord[],
    currentHarvests: HarvestRecord[]
  ): Promise<boolean> => {
    if (!googleSheetsConfig.webAppUrl || isLocalMode) return false;

    showSyncStatus('syncing', 'Sincronizando respaldo completo con Google Sheets...');
    const payload = {
      action: 'sync_data',
      production: currentRecords.map(sanitizeProductionRecord),
      evaluations: currentEvals.map(sanitizeEvaluationRecord),
      harvests: currentHarvests.map(sanitizeHarvestRecord),
      timestamp: new Date().toISOString()
    };

    const res = await postToAppsScript(googleSheetsConfig.webAppUrl, payload);
    if (res.ok) {
      setGoogleSheetsConfig(prev => ({ ...prev, lastSync: new Date().toLocaleTimeString() }));
      showSyncStatus('success', 'Respaldo completo guardado y confirmado en Google Sheets.', 3500);
      return true;
    } else {
      showSyncStatus('error', res.message || 'No se pudo confirmar el respaldo con Google Sheets.');
      return false;
    }
  };

  // Harvest record actions
  const handleAddHarvest = (newHarvest: HarvestRecord) => {
    if (isLocalMode) return;
    const updated = [newHarvest, ...actualHarvests.filter(h => h.id !== newHarvest.id)];
    setHarvests(updated);
    localStorage.setItem('camaronera_harvests', JSON.stringify(updated));
    syncRecordToSheets('UPDATE_OR_ADD', 'Ciclo de Cosechas', newHarvest);
  };

  const handleEditHarvest = (editedHarvest: HarvestRecord) => {
    if (isLocalMode) return;
    const updated = actualHarvests.map(h => h.id === editedHarvest.id ? editedHarvest : h);
    setHarvests(updated);
    localStorage.setItem('camaronera_harvests', JSON.stringify(updated));
    syncRecordToSheets('UPDATE_OR_ADD', 'Ciclo de Cosechas', editedHarvest);
  };

  const handleDeleteHarvest = (id: string) => {
    if (isLocalMode) {
      setLocalHarvests(prev => prev.filter(h => h.id !== id));
      return;
    }
    const updated = actualHarvests.filter(h => h.id !== id);
    setHarvests(updated);
    localStorage.setItem('camaronera_harvests', JSON.stringify(updated));
    syncRecordToSheets('DELETE', 'Ciclo de Cosechas', id);
  };

  const handleClearAllHarvests = () => {
    showSyncStatus('error', 'Para evitar pérdida de datos, por favor borra los registros de cosecha uno a uno.', 4500);
  };

  const handleImportHarvests = (newHarvests: HarvestRecord[]) => {
    if (isLocalMode) {
      setLocalHarvests(newHarvests);
    } else {
      setHarvests(newHarvests);
      localStorage.setItem('camaronera_harvests', JSON.stringify(newHarvests));
      syncBulkToSheets(records, evaluations, newHarvests);
    }
  };

  // Production record actions
  const handleAddRecord = (recordData: NewPondRecord) => {
    if (isLocalMode) return;
    const newRecord = calculatePondMetrics({
      ...recordData,
      id: editingRecord ? editingRecord.id : `rec_${Date.now()}`
    } as any);

    let updated: PondRecord[];
    if (editingRecord) {
      updated = actualRecords.map(r => r.id === editingRecord.id ? newRecord : r);
    } else {
      updated = [newRecord, ...actualRecords];
    }
    setRecords(updated);
    localStorage.setItem('camaronera_records', JSON.stringify(updated));
    setShowForm(false);
    setEditingRecord(null);
    syncRecordToSheets('UPDATE_OR_ADD', 'Produccion', newRecord);
  };

  const handleDeleteRecord = (id: string) => {
    if (isLocalMode) {
      setLocalRecords(prev => prev.filter(r => r.id !== id));
      return;
    }
    const updated = actualRecords.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem('camaronera_records', JSON.stringify(updated));
    syncRecordToSheets('DELETE', 'Produccion', id);
  };

  const handleClearAllRecords = () => {
    if (isLocalMode) {
      setLocalRecords([]);
      return;
    }
    setRecords([]);
    localStorage.setItem('camaronera_records', JSON.stringify([]));
    syncBulkToSheets([], evaluations, harvests);
  };

  const handleResetAllData = () => {
    setLocalRecords([]);
    setLocalEvaluations([]);
    setLocalHarvests([]);
    setRecords([]);
    setEvaluations([]);
    setHarvests([]);
    localStorage.setItem('camaronera_records', JSON.stringify([]));
    localStorage.setItem('camaronera_evaluations', JSON.stringify([]));
    localStorage.setItem('camaronera_harvests', JSON.stringify([]));
    syncBulkToSheets([], [], []);
  };

  // Evaluation actions
  const handleSaveEvaluation = (formData: EvaluationFormData) => {
    if (isLocalMode) return;
    const isEditing = Boolean(editingEvaluation?.id);
    const newEval: EvaluationRecord = sanitizeEvaluationRecord({
      ...formData,
      id: editingEvaluation?.id || `eval_${Date.now()}`,
      submissionDate: editingEvaluation?.submissionDate || new Date().toISOString()
    } as EvaluationRecord);

    const updated = isEditing && actualEvaluations.some(e => e.id === newEval.id)
      ? actualEvaluations.map(e => e.id === newEval.id ? newEval : e)
      : [newEval, ...actualEvaluations];

    setEvaluations(updated);
    localStorage.setItem('camaronera_evaluations', JSON.stringify(updated));
    setEditingEvaluation(null);
    setActiveView('evaluationsList');
    syncRecordToSheets('UPDATE_OR_ADD', 'Evaluacion Tecnica', newEval);
  };

  const handleDeleteEvaluation = (id: string) => {
    if (isLocalMode) {
      setLocalEvaluations(prev => prev.filter(e => e.id !== id));
      return;
    }
    const updated = actualEvaluations.filter(e => e.id !== id);
    setEvaluations(updated);
    localStorage.setItem('camaronera_evaluations', JSON.stringify(updated));
    syncRecordToSheets('DELETE', 'Evaluacion Tecnica', id);
  };


  // PDF Export
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      doc.setFontSize(18);
      doc.text('AquaControl - Reporte Ejecutivo de Producción', 14, 20);
      doc.setFontSize(10);
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`, 14, 28);

      const target = document.getElementById('report-content') || document.querySelector('main');
      if (target) {
        const canvas = await html2canvas(target as HTMLElement, { scale: 1.5, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 180;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 35;

        doc.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      doc.save(`AquaControl_Reporte_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error("Export PDF error:", e);
      showSyncStatus('error', 'Error al exportar el reporte PDF.', 4500);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#041D38] text-slate-100 font-sans">
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          if (view === 'farmEvaluation') setEditingEvaluation(null);
        }}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
        onLocalFileUpload={handleLocalFileUpload}
      />

      <div className="flex-1 flex flex-col w-full min-w-0">
        {isLocalMode && (
          <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-center text-xs font-bold shadow-md relative z-50 flex items-center justify-center gap-3">
            <span>⚠️ Modo Local: Viendo datos cargados desde archivo local.</span>
            <button
              onClick={() => {
                setIsLocalMode(false);
                setLocalRecords([]);
                setLocalEvaluations([]);
                setLocalHarvests([]);
              }}
              className="bg-yellow-900 hover:bg-yellow-950 text-white px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Salir de Modo Local (Volver a Datos de Nube)
            </button>
          </div>
        )}

        <nav className="bg-[#093661] border-b border-[#125699] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-xl font-black text-white">
                {activeView === 'estadisticas' && 'Análisis Estadístico de Producción'}
                {activeView === 'productionProgram' && 'Control de Producción'}
                {activeView === 'tendencias' && 'Tendencias de Producción y Pre-cosechas'}
                {activeView === 'harvests' && 'Ciclo de Cosechas y Pre-cosechas'}
                {activeView === 'farmEvaluation' && 'Evaluación Técnica de Granja'}
                {activeView === 'evaluationsList' && 'Historial de Evaluaciones Técnicas'}
                {activeView === 'googleSync' && 'Sincronización con Google Sheets'}
              </h1>

              <div className="flex items-center gap-3">
                {activeView === 'estadisticas' && (
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="bg-[#0B4075] border border-[#125699] hover:bg-blue-600 text-blue-200 hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    <span>{isExporting ? 'Generando PDF...' : 'Exportar Reporte a PDF'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-12 space-y-6 w-full flex-1" id="report-content">
          {syncStatus && (
            <div
              className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 shadow-sm ${
                syncStatus.type === 'syncing'
                  ? 'bg-blue-950/70 border-blue-500/40 text-blue-200'
                  : syncStatus.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/80 border-red-500/50 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {syncStatus.type === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />}
                {syncStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {syncStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                <span>{syncStatus.message}</span>
              </div>
              <button
                onClick={() => setSyncStatus(null)}
                className="text-current opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeView === 'estadisticas' && (
            <div className="space-y-6">
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                uniqueAlimentos={uniqueAlimentos}
                uniqueLaboratorios={uniqueLaboratorios}
                uniqueEstanques={uniqueEstanques}
                uniqueGranjas={uniqueGranjas}
              />
              <EstadisticasView
                records={filteredRecords}
                allRecords={filteredRawRecords}
                chartData={chartData}
                historicalChartData={historicalChartData}
                uniqueEstanquesInHistory={uniqueEstanquesInHistory}
                lineColors={lineColors}
                harvests={harvests}
                onSelectPond={(pondId) => setSelectedPond(pondId)}
              />
            </div>
          )}

          {activeView === 'productionProgram' && (
            <ProductionProgram
              records={records}
              onAdd={() => { setEditingRecord(null); setShowForm(true); }}
              onEdit={(rec) => { setEditingRecord(rec); setShowForm(true); }}
              onDelete={handleDeleteRecord}
              onClearAll={handleClearAllRecords}
              googleSheetsConfig={googleSheetsConfig}
              onSyncNow={async () => {
                const ok = await syncBulkToSheets(records, evaluations, harvests);
                if (!ok) throw new Error('Error al sincronizar con Google Sheets');
              }}
              onOpenSyncConfig={() => setActiveView('googleSync')}
            />
          )}

          {activeView === 'tendencias' && (
            <TendenciasView
              records={filteredRecords}
              allRecords={filteredRawRecords}
              harvests={harvests}
            />
          )}

          {activeView === 'harvests' && (
            <HarvestsModule
              records={records}
              harvests={harvests}
              onAddHarvest={handleAddHarvest}
              onEditHarvest={handleEditHarvest}
              onDeleteHarvest={handleDeleteHarvest}
              onClearAllHarvests={handleClearAllHarvests}
              onImportHarvests={handleImportHarvests}
            />
          )}

          {activeView === 'farmEvaluation' && (
            <FarmEvaluationForm
              initialData={editingEvaluation || undefined}
              onSave={handleSaveEvaluation}
            />
          )}

          {activeView === 'evaluationsList' && (
            <EvaluationList
              evaluations={evaluations}
              onEdit={(evalData) => {
                setEditingEvaluation(evalData);
                setActiveView('farmEvaluation');
              }}
              onDelete={handleDeleteEvaluation}
            />
          )}

          {activeView === 'googleSync' && (
            <GoogleSheetsSync
              config={googleSheetsConfig}
              onUpdateConfig={isLocalMode ? () => showSyncStatus('error', 'Modo local activo. Configuración bloqueada.') : setGoogleSheetsConfig}
              onImportData={isLocalMode ? () => showSyncStatus('error', 'Modo local activo. Importación bloqueada.') : handleImportData}
              onClearAllLocalData={handleResetAllData}
              data={{
                production: records,
                evaluations: evaluations,
                harvests: harvests
              }}
            />
          )}
        </main>

        {showForm && (
          <PondForm
            initialData={editingRecord || undefined}
            existingRecords={records}
            evaluations={evaluations}
            onAdd={handleAddRecord}
            onCancel={() => { setShowForm(false); setEditingRecord(null); }}
          />
        )}

        {selectedPond && (
          <PondDetailModal
            pondId={selectedPond}
            records={records}
            harvests={harvests}
            onClose={() => setSelectedPond(null)}
          />
        )}

        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-[#125699]/40 text-center text-xs text-blue-300">
          AquaControl ©RSS 2026 - Sistema Integral de Monitoreo Acuícola y Cosechas
        </footer>
      </div>
    </div>
  );
};

export default App;
