
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PondRecord, NewPondRecord, EvaluationRecord, EvaluationFormData } from './types';
import { INITIAL_DATA } from './constants';
import { calculatePondMetrics, formatNumber } from './utils';
import DashboardStats from './components/DashboardStats';
import PondForm from './components/PondForm';
import FilterPanel, { FilterState } from './components/FilterPanel';
import StatisticsTable from './components/StatisticsTable';
import EstadisticasView from './components/EstadisticasView';
import Sidebar from './components/Sidebar';
import FarmEvaluationForm from './components/FarmEvaluationForm';
import PondDetailModal from './components/PondDetailModal';
import EvaluationList from './components/EvaluationList';
import ProductionProgram from './components/ProductionProgram';
import GoogleSheetsSync from './components/GoogleSheetsSync';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

type View = 'dashboard' | 'estadisticas' | 'farmEvaluation' | 'evaluationsList' | 'productionProgram' | 'googleSync';

const App: React.FC = () => {
  const [records, setRecords] = useState<PondRecord[]>(() => {
    const saved = localStorage.getItem('camaronera_records');
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PondRecord | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationRecord | null>(null);
  const [selectedPond, setSelectedPond] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [filters, setFilters] = useState<FilterState>({
    fechaDesde: '',
    fechaHasta: '',
    alimento: '',
    laboratorio: '',
    estanque: '',
    granja: ''
  });
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>(() => {
    const saved = localStorage.getItem('camaronera_evaluations');
    return saved ? JSON.parse(saved) : [];
  });
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('camaronera_sheet_config');
    return saved ? JSON.parse(saved) : {
      webAppUrl: '',
      isAutoSync: false
    };
  });

  const handleImportData = (importedData: { production?: PondRecord[], evaluations?: EvaluationRecord[] }) => {
    const fixNumberFromDate = (val: any) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        if (!isNaN(Number(val)) && val.trim() !== '') return Number(val);
        // Catch 1899 or 1900 dates which are likely numbers formatted as dates
        if (val.startsWith('1899-') || val.startsWith('1900-')) {
          const d = new Date(val);
          const base = new Date('1899-12-30T00:00:00.000Z');
          // Approximating the number since timezones might shift it slightly
          const diffDays = (d.getTime() - base.getTime()) / (1000 * 3600 * 24);
          // If it's close to an integer, round it
          if (Math.abs(diffDays - Math.round(diffDays)) < 0.05) return Math.round(diffDays);
          return Number(diffDays.toFixed(2));
        }
      }
      return val || 0;
    };

    if (importedData.production && importedData.production.length > 0) {
      const fixedProd = importedData.production.map(p => ({
        ...p,
        orgMt2: fixNumberFromDate(p.orgMt2),
        // Fix other numeric fields just in case they suffer from the same issue
        pesoAnterior: fixNumberFromDate(p.pesoAnterior),
        pesoActual: fixNumberFromDate(p.pesoActual),
        incrementoSemanal: fixNumberFromDate(p.incrementoSemanal),
        diasCultivo: fixNumberFromDate(p.diasCultivo),
        sobrevivencia: fixNumberFromDate(p.sobrevivencia),
        densidadInicial: fixNumberFromDate(p.densidadInicial),
        densidadActual: fixNumberFromDate(p.densidadActual),
        biomasaHa: fixNumberFromDate(p.biomasaHa),
        biomasaTotal: fixNumberFromDate(p.biomasaTotal),
        alimentoAcumulado: fixNumberFromDate(p.alimentoAcumulado),
        fca: fixNumberFromDate(p.fca),
        camM2Inicial: fixNumberFromDate(p.camM2Inicial),
        camM2Actual: fixNumberFromDate(p.camM2Actual),
        alimentoProyectadoDia: fixNumberFromDate(p.alimentoProyectadoDia),
        alimentoProyectadoSemana: fixNumberFromDate(p.alimentoProyectadoSemana)
      }));
      setRecords(fixedProd);
    }
    if (importedData.evaluations && importedData.evaluations.length > 0) {
      setEvaluations(importedData.evaluations);
    }
  };

  useEffect(() => {
    localStorage.setItem('camaronera_sheet_config', JSON.stringify(googleSheetsConfig));
  }, [googleSheetsConfig]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('camaronera_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('camaronera_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    // Only load initial data if the records list is empty
    if (records.length === 0) {
      const historicalData = [
        ...INITIAL_DATA,
        { ...INITIAL_DATA[0], id: '1a', diasCultivo: 47, pesoAnterior: 3.1, pesoActual: 4.29, incrementoSemanal: 1.19, fca: 0.65 },
        { ...INITIAL_DATA[0], id: '1b', diasCultivo: 40, pesoAnterior: 2.0, pesoActual: 3.1, incrementoSemanal: 1.1, fca: 0.60 },
      ];
      setRecords(historicalData);
    }
  }, []);
  
  const handlePondSelect = (pondId: number) => {
    setSelectedPond(pondId);
  };

  const handleCloseModal = () => {
    setSelectedPond(null);
  };

  const syncDataToSheets = async (
    currentRecords: PondRecord[], 
    currentEvaluations: EvaluationRecord[]
  ) => {
    if (!googleSheetsConfig.webAppUrl) return;

    try {
      const payload = {
        action: 'sync_data',
        stocking: [],
        production: currentRecords,
        evaluations: currentEvaluations,
        timestamp: new Date().toISOString()
      };

      await fetch(googleSheetsConfig.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      setGoogleSheetsConfig(prev => ({ ...prev, lastSync: new Date().toLocaleTimeString() }));
    } catch (error) {
      console.error('Error syncing to sheets:', error);
    }
  };

  const handleAddRecord = (newRecord: Partial<PondRecord>) => {
    const calculated = calculatePondMetrics(newRecord);
    
    let updatedRecords: PondRecord[];
    if (newRecord.id && records.some(r => r.id === newRecord.id)) {
      updatedRecords = records.map(r => r.id === newRecord.id ? { ...calculated, id: newRecord.id as string } : r);
    } else {
      updatedRecords = [calculated, ...records];
    }
    
    setRecords(updatedRecords);
    setShowForm(false);
    setEditingRecord(null);
    syncDataToSheets(updatedRecords, evaluations);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      const updatedRecords = records.filter(r => r.id !== id);
      setRecords(updatedRecords);
      syncDataToSheets(updatedRecords, evaluations);
    }
  };

  const handleSaveEvaluation = (formData: EvaluationFormData) => {
    let updatedEvaluations: EvaluationRecord[];
    
    if (editingEvaluation) {
      const updatedEvaluation = {
        ...editingEvaluation,
        ...formData
      };
      updatedEvaluations = evaluations.map(e => e.id === editingEvaluation.id ? updatedEvaluation : e);
      setEditingEvaluation(null);
      alert('Evaluación actualizada correctamente.');
    } else {
      const newEvaluation: EvaluationRecord = {
        ...formData,
        id: new Date().toISOString(),
        submissionDate: new Date().toISOString(),
      };
      updatedEvaluations = [newEvaluation, ...evaluations];
      alert('Evaluación guardada correctamente.');
    }
    
    setEvaluations(updatedEvaluations);
    setActiveView('evaluationsList'); // Navigate to the list after saving
    syncDataToSheets(records, updatedEvaluations);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const newRecords: PondRecord[] = json.map((row) => {
          const newRecord: NewPondRecord = {
            fechaSiembra: row.fechaSiembra ? new Date((Number(row.fechaSiembra) - 25569) * 86400 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            alimento: String(row.alimento || ''),
            laboratorio: String(row.laboratorio || ''),
            estanque: Number(row.estanque || 0),
            hectareas: Number(row.hectareas || 0),
            pesoAnterior: Number(row.pesoAnterior || 0),
            pesoActual: Number(row.pesoActual || 0),
            diasCultivo: Number(row.diasCultivo || 0),
            porcentajeSobrevivencia: Number(row.porcentajeSobrevivencia || 0),
            densidadInicial: Number(row.densidadInicial || 0),
            densidadActual: Number(row.densidadActual || 0),
            alimentoSemanal: Number(row.alimentoSemanal || 0),
            alimentoAcumulado: Number(row.alimentoAcumulado || 0),
            camM2Inicial: Number(row.camM2Inicial || 0),
            camM2Actual: Number(row.camM2Actual || 0)
          };

          const calculated = calculatePondMetrics(newRecord);
          return { ...calculated, id: Math.random().toString(36).substr(2, 9) };
        });

        setRecords(prev => [...newRecords, ...prev]);
        alert(`${newRecords.length} registros importados correctamente.`);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Error al procesar el archivo. Asegúrate de que el formato y las columnas son correctas.");
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };
  
  const handleExportPDF = async () => {
    setIsExporting(true);
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-MX');
    let yPos = 22;

    // Title
    doc.setFontSize(20);
    doc.text('Reporte de Producción - AquaControl', 14, yPos);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${today}`, 14, yPos + 8);
    yPos += 20;

    // Dashboard Stats
    const statsEl = document.getElementById('dashboard-stats');
    if (statsEl) {
      const canvas = await html2canvas(statsEl, { backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth() - 28;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(imgData, 'PNG', 14, yPos, pdfWidth, pdfHeight);
      yPos += pdfHeight + 10;
    }

    // Charts
    const chartsEl = document.getElementById('charts-container');
    if (chartsEl) {
      const canvas = await html2canvas(chartsEl, { backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth() - 28;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(imgData, 'PNG', 14, yPos, pdfWidth, pdfHeight);
      yPos += pdfHeight + 10;
    }

    // Statistics Table built from filteredRecords
    const statKeys = [
      { label: 'Peso Actual', key: 'pesoActual', unit: 'g' },
      { label: 'Incremento Semanal', key: 'incrementoSemanal', unit: 'g' },
      { label: 'Supervivencia', key: 'sobrevivencia', unit: '%' },
      { label: 'Biomasa Total', key: 'biomasaTotal', unit: 'kg' },
      { label: 'FCA', key: 'fca', unit: '' },
      { label: 'Densidad Actual', key: 'densidadActual', unit: 'ind' },
    ];
    
    const calculateStats = (key: string) => {
      const values = filteredRecords.map(r => r[key as keyof PondRecord] as number).filter(v => typeof v === 'number');
      if (values.length === 0) return { avg: 0, max: 0, min: 0, std: 0 };
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      const squareDiffs = values.map(v => Math.pow(v - avg, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(avgSquareDiff);
      return { avg, max, min, std };
    };

    const statsBody = statKeys.map(row => {
      const s = calculateStats(row.key);
      return [row.label, `${formatNumber(s.avg)} ${row.unit}`, `${formatNumber(s.max)} ${row.unit}`, `${formatNumber(s.min)} ${row.unit}`, `± ${formatNumber(s.std)}`];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Variable', 'Promedio', 'Máximo', 'Mínimo', 'Desv. Estándar']],
      body: statsBody,
      headStyles: { fillColor: '#475569' }
    });

    yPos = ((doc as any).lastAutoTable?.finalY || yPos) + 10;

    // Pond Records Table built from filteredRecords
    const pondBody = filteredRecords.map(record => [
      record.granja?.toString() || '',
      record.estanque?.toString() || '',
      (record.pesoActual || 0).toString() + 'g',
      (record.incrementoSemanal || 0).toString() + 'g',
      (record.diasCultivo || 0).toString(),
      (record.sobrevivencia || 0).toString() + '%',
      formatNumber(record.densidadActual || 0),
      formatNumber(record.biomasaTotal || 0),
      (record.fca || 0).toString()
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Granja', 'Est.', 'P.Act', 'Inc.S', 'Días', '% Sobr', 'Dens.A', 'Bio.Tot', 'FCA']],
      body: pondBody,
      headStyles: { fillColor: '#475569' }
    });

    doc.save(`reporte-produccion-${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExporting(false);
  };

  const uniqueAlimentos = useMemo(() => Array.from(new Set(records.map(r => r.alimento))), [records]);
  const uniqueLaboratorios = useMemo(() => Array.from(new Set(records.map(r => r.laboratorio))), [records]);
  const uniqueEstanques = useMemo(() => Array.from(new Set(records.map(r => r.estanque))).sort((a, b) => a - b), [records]);
  const uniqueGranjas = useMemo(() => Array.from(new Set(records.map(r => r.granja))), [records]);

  const latestRecordsByPond = useMemo(() => {
      const latest = new Map<string, PondRecord>();
      records.forEach(record => {
          const key = `${record.granja}-${record.estanque}`;
          const current = latest.get(key);
          if (!current || record.diasCultivo > current.diasCultivo) {
              latest.set(key, record);
          }
      });
      return Array.from(latest.values()).sort((a, b) => {
          if (a.granja === b.granja) return a.estanque - b.estanque;
          return a.granja.localeCompare(b.granja);
      });
  }, [records]);

  const filteredRecords = useMemo(() => {
    return latestRecordsByPond.filter(record => {
      const matchGranja = filters.granja === '' || record.granja === filters.granja;
      const matchEstanque = filters.estanque === '' || record.estanque.toString() === filters.estanque;
      const matchAlimento = filters.alimento === '' || record.alimento === filters.alimento;
      const matchLab = filters.laboratorio === '' || record.laboratorio === filters.laboratorio;
      const recordDate = new Date(record.fechaSiembra).getTime();
      const matchDesde = filters.fechaDesde === '' || recordDate >= new Date(filters.fechaDesde).getTime();
      const matchHasta = filters.fechaHasta === '' || recordDate <= new Date(filters.fechaHasta).getTime();
      return matchGranja && matchEstanque && matchAlimento && matchLab && matchDesde && matchHasta;
    });
  }, [latestRecordsByPond, filters]);

  const chartData = useMemo(() => 
    // FIX: Explicitly cast properties to Number to prevent type errors during arithmetic operations in the sort function.
    [...filteredRecords].sort((a, b) => Number(a.estanque) - Number(b.estanque)),
  [filteredRecords]);

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        activeView={activeView} 
        onNavigate={(view) => {
          setActiveView(view);
          if (view === 'farmEvaluation') {
            setEditingEvaluation(null);
          }
        }}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
      />

      <div className="flex-1 flex flex-col w-full">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .csv" />
        <nav className="bg-[#093661] border-b border-[#125699] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                 <h1 className="text-xl font-bold text-white">
                    {activeView === 'dashboard' && 'Dashboard de Producción'}
                    {activeView === 'estadisticas' && 'Análisis Estadístico'}
                    {activeView === 'farmEvaluation' && 'Evaluación Técnica de Granja'}
                    {activeView === 'evaluationsList' && 'Historial de Evaluaciones'}
                    {activeView === 'productionProgram' && 'Control de Producción'}
                    {activeView === 'googleSync' && 'Sincronización con Google Sheets'}
                 </h1>
              </div>
              <div className="flex items-center gap-4">
                {activeView === 'dashboard' && (
                  <>
                    <button 
                      onClick={handleExportPDF} 
                      disabled={isExporting}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
                    >
                      {isExporting ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      )}
                      <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar a PDF'}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-[#0B4075] border border-[#1B66B0] hover:bg-[#0F4C8A] text-blue-100 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="hidden sm:inline">Cargar Archivo</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8 w-full">
          {activeView === 'dashboard' && (
            <>
              <FilterPanel filters={filters} onFilterChange={setFilters} uniqueAlimentos={uniqueAlimentos} uniqueLaboratorios={uniqueLaboratorios} uniqueEstanques={uniqueEstanques} uniqueGranjas={uniqueGranjas} />
              <div id="dashboard-stats"><DashboardStats records={filteredRecords} /></div>
              
              <div id="charts-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-blue-500">⚖️</span> Peso Actual (g)</h2>
                  <div className="flex-1 min-h-0">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} g`, 'Peso']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="pesoActual" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.pesoActual > 6 ? '#2563eb' : '#3b82f6'} />))}</Bar></BarChart></ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
                  </div>
                </div>
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-indigo-500">📈</span> Incremento Semanal (g)</h2>
                  <div className="flex-1 min-h-0">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`+${formatNumber(value)} g`, 'Incremento']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="incrementoSemanal" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-inc-${index}`} fill={entry.incrementoSemanal > 1.2 ? '#6366f1' : '#818cf8'} />))}</Bar></BarChart></ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
                  </div>
                </div>
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-emerald-500">🛡️</span> Supervivencia (%)</h2>
                  <div className="flex-1 min-h-0">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)}%`, 'Supervivencia']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="sobrevivencia" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-surv-${index}`} fill={entry.sobrevivencia > 75 ? '#10b981' : entry.sobrevivencia > 50 ? '#f59e0b' : '#ef4444'} />))}</Bar></BarChart></ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'estadisticas' && (
             <div className="space-y-8">
                <FilterPanel filters={filters} onFilterChange={setFilters} uniqueAlimentos={uniqueAlimentos} uniqueLaboratorios={uniqueLaboratorios} uniqueEstanques={uniqueEstanques} uniqueGranjas={uniqueGranjas} />
                <EstadisticasView records={filteredRecords} />
             </div>
          )}

          {activeView === 'farmEvaluation' && <FarmEvaluationForm initialData={editingEvaluation || undefined} onSave={handleSaveEvaluation} />}
          {activeView === 'evaluationsList' && <EvaluationList evaluations={evaluations} onEdit={(evalData) => { setEditingEvaluation(evalData); setActiveView('farmEvaluation'); }} />}
          {activeView === 'productionProgram' && (
            <ProductionProgram 
              records={records} 
              onAdd={() => { setEditingRecord(null); setShowForm(true); }}
              onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
              onDelete={handleDeleteRecord}
            />
          )}
          {activeView === 'googleSync' && (
            <GoogleSheetsSync 
              config={googleSheetsConfig} 
              onUpdateConfig={setGoogleSheetsConfig}
              onImportData={handleImportData}
              data={{
                  production: records,
                  evaluations: evaluations
              }}
            />
          )}
        </main>

        {showForm && <PondForm initialData={editingRecord || undefined} existingRecords={records} onAdd={handleAddRecord} onCancel={() => { setShowForm(false); setEditingRecord(null); }} />}
        
        {selectedPond && <PondDetailModal pondId={selectedPond} records={records} onClose={handleCloseModal} />}

        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8 pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
            <p>AquaControl ©RSS 2026</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-blue-600 transition-colors">Soporte</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Documentación</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
