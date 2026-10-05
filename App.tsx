import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PondRecord, NewPondRecord, EvaluationRecord, EvaluationFormData, HarvestRecord, GoogleSheetsConfig } from './types';
import { INITIAL_DATA } from './constants';
import { calculatePondMetrics, formatNumber, normalizeEstanque, cleanDateString, parseFlexibleNumber } from './utils';
import { normalizeHarvestRecord, parseHarvestWorksheet } from './utils/harvestUtils';
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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
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
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationFormData | null>(null);
  const [selectedPond, setSelectedPond] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        alert("Hubo un error al leer el archivo. Asegúrate de que sea el formato correcto.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleImportData = (importedData: { production?: PondRecord[], evaluations?: EvaluationRecord[], harvests?: HarvestRecord[] }, isLocal = false) => {
    if (importedData.production && importedData.production.length > 0) {
      const parsedRecords = importedData.production.map(r => calculatePondMetrics(r));
      if (isLocal) {
        setLocalRecords(parsedRecords);
      } else {
        setRecords(parsedRecords);
        localStorage.setItem('camaronera_records', JSON.stringify(parsedRecords));
      }
    }

    if (importedData.evaluations && importedData.evaluations.length > 0) {
      if (isLocal) {
        setLocalEvaluations(importedData.evaluations);
      } else {
        setEvaluations(importedData.evaluations);
        localStorage.setItem('camaronera_evaluations', JSON.stringify(importedData.evaluations));
      }
    }

    if (importedData.harvests && importedData.harvests.length > 0) {
      const normalizedH = importedData.harvests.map(h => normalizeHarvestRecord(h) || h);
      if (isLocal) {
        setLocalHarvests(normalizedH);
      } else {
        setHarvests(normalizedH);
        localStorage.setItem('camaronera_harvests', JSON.stringify(normalizedH));
      }
    }
  };

  // Synchronize data to Google Sheets
  const syncDataToSheets = async (currentRecords: PondRecord[], currentEvals: EvaluationRecord[], currentHarvests: HarvestRecord[]) => {
    if (!googleSheetsConfig.webAppUrl || isLocalMode) return;
    try {
      await fetch(googleSheetsConfig.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'sync_data',
          production: currentRecords,
          evaluations: currentEvals,
          harvests: currentHarvests,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.error("Auto sync failed:", e);
    }
  };

  // Harvest record actions
  const handleAddHarvest = (newHarvest: HarvestRecord) => {
    if (isLocalMode) return;
    const updated = [newHarvest, ...harvests.filter(h => h.id !== newHarvest.id)];
    setHarvests(updated);
    syncDataToSheets(records, evaluations, updated);
  };

  const handleEditHarvest = (editedHarvest: HarvestRecord) => {
    if (isLocalMode) return;
    const updated = harvests.map(h => h.id === editedHarvest.id ? editedHarvest : h);
    setHarvests(updated);
    syncDataToSheets(records, evaluations, updated);
  };

  const handleDeleteHarvest = (id: string) => {
    if (isLocalMode) return;
    const updated = harvests.filter(h => h.id !== id);
    setHarvests(updated);
    syncDataToSheets(records, evaluations, updated);
  };

  const handleClearAllHarvests = () => {
    if (isLocalMode) return;
    setHarvests([]);
    syncDataToSheets(records, evaluations, []);
  };

  const handleImportHarvests = (newHarvests: HarvestRecord[]) => {
    if (isLocalMode) {
      setLocalHarvests(newHarvests);
    } else {
      setHarvests(newHarvests);
      syncDataToSheets(records, evaluations, newHarvests);
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
    setShowForm(false);
    setEditingRecord(null);
    syncDataToSheets(updated, evaluations, harvests);
  };

  const handleDeleteRecord = (id: string) => {
    if (isLocalMode) return;
    const updated = actualRecords.filter(r => r.id !== id);
    setRecords(updated);
    syncDataToSheets(updated, evaluations, harvests);
  };

  // Evaluation actions
  const handleSaveEvaluation = (formData: EvaluationFormData) => {
    if (isLocalMode) return;
    const newEval: EvaluationRecord = {
      ...formData,
      id: `eval_${Date.now()}`,
      submissionDate: new Date().toISOString()
    };
    const updated = [newEval, ...actualEvaluations];
    setEvaluations(updated);
    setActiveView('evaluationsList');
    syncDataToSheets(records, updated, harvests);
  };

  const handleDeleteEvaluation = (id: string) => {
    if (isLocalMode) return;
    const updated = actualEvaluations.filter(e => e.id !== id);
    setEvaluations(updated);
    syncDataToSheets(records, updated, harvests);
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
      alert("Error al exportar PDF.");
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
          <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-center text-xs font-bold shadow-md relative z-50 flex items-center justify-center gap-2">
            <span>⚠️ Modo Local: Viendo datos de archivo. Edición bloqueada. Recarga la página para volver a la nube.</span>
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
              googleSheetsConfig={googleSheetsConfig}
              onSyncNow={() => syncDataToSheets(records, evaluations, harvests)}
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
              onUpdateConfig={isLocalMode ? () => alert("Modo local activo. Configuración bloqueada.") : setGoogleSheetsConfig}
              onImportData={isLocalMode ? () => alert("Modo local activo. Importación bloqueada.") : handleImportData}
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
