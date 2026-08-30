
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PondRecord, NewPondRecord, EvaluationRecord, EvaluationFormData, HarvestRecord } from './types';
import { INITIAL_DATA } from './constants';
import { calculatePondMetrics, formatNumber, normalizeEstanque, cleanDateString } from './utils';
import PondForm from './components/PondForm';
import FilterPanel, { FilterState } from './components/FilterPanel';
import StatisticsTable from './components/StatisticsTable';
import EstadisticasView from './components/EstadisticasView';
import Sidebar from './components/Sidebar';
import FarmEvaluationForm from './components/FarmEvaluationForm';
import PondDetailModal from './components/PondDetailModal';
import EvaluationList from './components/EvaluationList';
import ProductionProgram from './components/ProductionProgram';
import HarvestsModule from './components/HarvestsModule';
import GoogleSheetsSync from './components/GoogleSheetsSync';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

type View = 'estadisticas' | 'farmEvaluation' | 'evaluationsList' | 'productionProgram' | 'googleSync' | 'harvests';

const App: React.FC = () => {
  const [actualRecords, setRecords] = useState<PondRecord[]>(() => {
    const saved = localStorage.getItem('camaronera_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((r: any) => calculatePondMetrics(r));
        }
      } catch (e) {
        console.error("Error parsing camaronera_records:", e);
      }
    }
    return [];
  });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PondRecord | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationRecord | null>(null);
  const [selectedPond, setSelectedPond] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
    const [activeView, setActiveView] = useState<'estadisticas' | 'farmEvaluation' | 'evaluationsList' | 'productionProgram' | 'googleSync' | 'harvests'>('estadisticas');
  const [filters, setFilters] = useState<FilterState>({
    fechaDesde: '',
    fechaHasta: '',
    alimento: '',
    laboratorio: '',
    estanque: '',
    granja: ''
  });
  const [actualEvaluations, setEvaluations] = useState<EvaluationRecord[]>(() => {
    const saved = localStorage.getItem('camaronera_evaluations');
    return saved ? JSON.parse(saved) : [];
  });
  const [actualHarvests, setHarvests] = useState<HarvestRecord[]>(() => {
    const saved = localStorage.getItem('camaronera_harvests');
    return saved ? JSON.parse(saved) : [];
  });

  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localRecords, setLocalRecords] = useState<PondRecord[]>([]);
  const [localEvaluations, setLocalEvaluations] = useState<EvaluationRecord[]>([]);
  const [localHarvests, setLocalHarvests] = useState<HarvestRecord[]>([]);

  const records = isLocalMode ? localRecords : actualRecords;
  const evaluations = isLocalMode ? localEvaluations : actualEvaluations;
  const harvests = isLocalMode ? localHarvests : actualHarvests;

  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('camaronera_sheet_config');
    return saved ? JSON.parse(saved) : {
      webAppUrl: '',
      isAutoSync: false
    };
  });

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        const prodName = workbook.SheetNames.find(n => n.toLowerCase().includes('produccion') || n.toLowerCase().includes('producción'));
        const evalsName = workbook.SheetNames.find(n => n.toLowerCase().includes('evaluacion') || n.toLowerCase().includes('evaluación'));
        const harvestsName = workbook.SheetNames.find(n => n.toLowerCase().includes('cosechas'));

        const importedProduction = prodName ? XLSX.utils.sheet_to_json<PondRecord>(workbook.Sheets[prodName], { raw: false }) : undefined;
        const importedEvaluations = evalsName ? XLSX.utils.sheet_to_json<EvaluationRecord>(workbook.Sheets[evalsName], { raw: false }) : undefined;
        const importedHarvests = harvestsName ? XLSX.utils.sheet_to_json<HarvestRecord>(workbook.Sheets[harvestsName], { raw: false }) : undefined;

        handleImportData({
          production: importedProduction,
          evaluations: importedEvaluations,
          harvests: importedHarvests
        }, true);
        
        setIsLocalMode(true);
      } catch (error) {
        console.error("Error parsing Excel file", error);
        alert("Hubo un error al leer el archivo. Asegúrate de que sea el formato correcto.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  const handleImportData = (importedData: { production?: PondRecord[], evaluations?: EvaluationRecord[], harvests?: HarvestRecord[] }, isLocal = false) => {
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
      const fixedProd = importedData.production.map(p => {
        const cleaned: Partial<PondRecord> = {
          ...p,
          fecha: cleanDateString(p.fecha),
          fechaSiembra: cleanDateString(p.fechaSiembra),
          fechaCosecha: cleanDateString(p.fechaCosecha),
          orgMt2: fixNumberFromDate(p.orgMt2),
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
          alimentoProyectadoSemana: fixNumberFromDate(p.alimentoProyectadoSemana),
          hectareas: fixNumberFromDate(p.hectareas) || (p.hectareas ? Number(p.hectareas) : 1)
        };
        return calculatePondMetrics(cleaned);
      });
      if (isLocal) {
        setLocalRecords(fixedProd);
      } else {
        setRecords(fixedProd);
      }
    }
    if (importedData.evaluations && importedData.evaluations.length > 0) {
      const fixedEvals = importedData.evaluations.map(ev => ({
        ...ev,
        fecha: cleanDateString(ev.fecha) || ev.fecha,
        fecha_siembra: cleanDateString(ev.fecha_siembra) || ev.fecha_siembra
      }));
      if (isLocal) {
        setLocalEvaluations(fixedEvals);
      } else {
        setEvaluations(fixedEvals);
      }
    }
    if (importedData.harvests && importedData.harvests.length > 0) {
      const fixedHarvests = importedData.harvests.map(h => ({
        ...h,
        fecha: cleanDateString(h.fecha) || h.fecha,
        pre1Kilos: h.pre1Kilos ? fixNumberFromDate(h.pre1Kilos) : undefined,
        pre1Gramos: h.pre1Gramos ? fixNumberFromDate(h.pre1Gramos) : undefined,
        pre1Organismos: h.pre1Organismos ? fixNumberFromDate(h.pre1Organismos) : undefined,
        pre2Kilos: h.pre2Kilos ? fixNumberFromDate(h.pre2Kilos) : undefined,
        pre2Gramos: h.pre2Gramos ? fixNumberFromDate(h.pre2Gramos) : undefined,
        pre2Organismos: h.pre2Organismos ? fixNumberFromDate(h.pre2Organismos) : undefined,
        pre3Kilos: h.pre3Kilos ? fixNumberFromDate(h.pre3Kilos) : undefined,
        pre3Gramos: h.pre3Gramos ? fixNumberFromDate(h.pre3Gramos) : undefined,
        pre3Organismos: h.pre3Organismos ? fixNumberFromDate(h.pre3Organismos) : undefined,
        pre4Kilos: h.pre4Kilos ? fixNumberFromDate(h.pre4Kilos) : undefined,
        pre4Gramos: h.pre4Gramos ? fixNumberFromDate(h.pre4Gramos) : undefined,
        pre4Organismos: h.pre4Organismos ? fixNumberFromDate(h.pre4Organismos) : undefined,
        pre5Kilos: h.pre5Kilos ? fixNumberFromDate(h.pre5Kilos) : undefined,
        pre5Gramos: h.pre5Gramos ? fixNumberFromDate(h.pre5Gramos) : undefined,
        pre5Organismos: h.pre5Organismos ? fixNumberFromDate(h.pre5Organismos) : undefined,
        finalKilos: h.finalKilos ? fixNumberFromDate(h.finalKilos) : undefined,
        finalGramos: h.finalGramos ? fixNumberFromDate(h.finalGramos) : undefined,
        finalOrganismos: h.finalOrganismos ? fixNumberFromDate(h.finalOrganismos) : undefined,
        totalOrganismos: fixNumberFromDate(h.totalOrganismos) || 0,
        totalKilos: fixNumberFromDate(h.totalKilos) || 0,
      }));
      if (isLocal) {
        setLocalHarvests(fixedHarvests);
      } else {
        setHarvests(fixedHarvests);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('camaronera_sheet_config', JSON.stringify(googleSheetsConfig));
  }, [googleSheetsConfig]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('camaronera_records', JSON.stringify(actualRecords));
  }, [actualRecords]);

  useEffect(() => {
    localStorage.setItem('camaronera_evaluations', JSON.stringify(actualEvaluations));
  }, [actualEvaluations]);

  useEffect(() => {
    localStorage.setItem('camaronera_harvests', JSON.stringify(actualHarvests));
  }, [actualHarvests]);

  useEffect(() => {
    // Only load initial data if the records list is empty
    if (actualRecords.length === 0) {
      const historicalData = [
        ...INITIAL_DATA,
        { ...INITIAL_DATA[0], id: '1a', diasCultivo: 47, pesoAnterior: 3.1, pesoActual: 4.29, incrementoSemanal: 1.19, fca: 0.65 },
        { ...INITIAL_DATA[0], id: '1b', diasCultivo: 40, pesoAnterior: 2.0, pesoActual: 3.1, incrementoSemanal: 1.1, fca: 0.60 },
      ].map(rec => calculatePondMetrics(rec));
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
    currentRecords?: PondRecord[], 
    currentEvaluations?: EvaluationRecord[],
    currentHarvests?: HarvestRecord[]
  ) => {
    if (!googleSheetsConfig.webAppUrl) return;

    try {
      const recsToSync = (currentRecords || records).map(r => ({
        ...r,
        fecha: cleanDateString(r.fecha) || r.fecha,
        fechaSiembra: cleanDateString(r.fechaSiembra) || r.fechaSiembra,
        fechaCosecha: cleanDateString(r.fechaCosecha) || r.fechaCosecha
      }));

      const evalsToSync = (currentEvaluations || evaluations).map(e => ({
        ...e,
        fecha: cleanDateString(e.fecha) || e.fecha,
        fecha_siembra: cleanDateString(e.fecha_siembra) || e.fecha_siembra
      }));

      const harvestsToSync = (currentHarvests || harvests).map(h => ({
        ...h,
        fecha: cleanDateString(h.fecha) || h.fecha
      }));

      const payload = {
        action: 'sync_data',
        stocking: [],
        production: recsToSync,
        evaluations: evalsToSync,
        harvests: harvestsToSync,
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

  const checkLocalModeBlock = () => {
    if (isLocalMode) {
      alert("Operación bloqueada. Estás en Modo Local de solo lectura. Recarga la página para salir del modo local.");
      return true;
    }
    return false;
  };

  const handleAddHarvest = (newHarvest: HarvestRecord) => {
    if (checkLocalModeBlock()) return;
    let updatedHarvests: HarvestRecord[];
    if (harvests.some(h => h.id === newHarvest.id)) {
      updatedHarvests = harvests.map(h => h.id === newHarvest.id ? newHarvest : h);
    } else {
      updatedHarvests = [newHarvest, ...harvests];
    }
    setHarvests(updatedHarvests);
    syncDataToSheets(records, evaluations, updatedHarvests);
  };

  const handleEditHarvest = (editedHarvest: HarvestRecord) => {
    if (checkLocalModeBlock()) return;
    const updatedHarvests = harvests.map(h => h.id === editedHarvest.id ? editedHarvest : h);
    setHarvests(updatedHarvests);
    syncDataToSheets(records, evaluations, updatedHarvests);
  };

  const handleDeleteHarvest = (id: string) => {
    if (checkLocalModeBlock()) return;
    const updatedHarvests = harvests.filter(h => h.id !== id);
    setHarvests(updatedHarvests);
    syncDataToSheets(records, evaluations, updatedHarvests);
  };

  const handleAddRecord = (newRecord: Partial<PondRecord>) => {
    if (checkLocalModeBlock()) return;
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
    syncDataToSheets(updatedRecords, evaluations, harvests);
  };

  const handleDeleteRecord = (id: string) => {
    if (checkLocalModeBlock()) return;
    const updatedRecords = records.filter(r => r.id !== id);
    setRecords(updatedRecords);
    syncDataToSheets(updatedRecords, evaluations, harvests);
  };

  const handleSaveEvaluation = (formData: EvaluationFormData) => {
    if (checkLocalModeBlock()) return;
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
    syncDataToSheets(records, updatedEvaluations, harvests);
  };

  const handleDeleteEvaluation = (id: string) => {
    if (checkLocalModeBlock()) return;
    const updatedEvaluations = evaluations.filter(e => e.id !== id);
    setEvaluations(updatedEvaluations);
    syncDataToSheets(records, updatedEvaluations, harvests);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const parseImportedDate = (val: any): string | undefined => {
      if (!val) return undefined;
      if (val === 'Invalid Date') return undefined;

      if (typeof val === 'number') {
        try {
          const date = new Date((val - 25569) * 86400 * 1000);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {}
      }

      const strVal = String(val).trim();
      if (/^\d+(\.\d+)?$/.test(strVal)) {
        try {
          const num = Number(strVal);
          const date = new Date((num - 25569) * 86400 * 1000);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {}
      }

      try {
        const d = new Date(strVal.includes('T') ? strVal : strVal + 'T12:00:00');
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
        const dAlt = new Date(strVal);
        if (!isNaN(dAlt.getTime())) {
          return dAlt.toISOString().split('T')[0];
        }
      } catch (e) {}

      return undefined;
    };

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
            fecha: parseImportedDate(row.fecha) as any,
            fechaSiembra: parseImportedDate(row.fechaSiembra) || new Date().toISOString().split('T')[0],
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

        const combined = [...newRecords, ...records];
        setRecords(combined);
        syncDataToSheets(combined, evaluations, harvests);
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
    
    yPos += 8;
    
    const identityText = [];
    if (filters.granja) identityText.push(`Granja: ${filters.granja}`);
    if (filters.estanque) identityText.push(`Estanque: ${filters.estanque}`);
    
    if (identityText.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(11, 64, 117); // Match brand dark blue #0B4075
      doc.text(identityText.join(' | '), 14, yPos);
      yPos += 8;
    }

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${today}`, 14, yPos);
    yPos += 14;

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

    // Statistics Table built from filteredRawRecords
    const statKeys = [
      { label: 'Peso Actual', key: 'pesoActual', unit: 'g' },
      { label: 'Incremento Semanal', key: 'incrementoSemanal', unit: 'g' },
      { label: 'Supervivencia', key: 'sobrevivencia', unit: '%' },
      { label: 'Biomasa Total', key: 'biomasaTotal', unit: 'kg' },
      { label: 'FCA', key: 'fca', unit: '' },
      { label: 'Densidad Actual', key: 'densidadActual', unit: 'ind' },
      { label: 'Alimento Proy. Diario', key: 'alimentoProyectadoDia', unit: 'kg' },
      { label: 'Alimento Proy. Semanal', key: 'alimentoProyectadoSemana', unit: 'kg' },
    ];
    
    const calculateStats = (key: string) => {
      const values = filteredRawRecords.map(r => Number(r[key as keyof PondRecord])).filter(v => typeof v === 'number' && !isNaN(v));
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

    // Pond Records Table built from filteredRawRecords
    const pondBody = filteredRawRecords.map(record => [
      record.granja?.toString() || '',
      record.estanque?.toString() || '',
      (record.pesoActual || 0).toString() + 'g',
      (record.incrementoSemanal || 0).toString() + 'g',
      (record.diasCultivo || 0).toString(),
      (record.sobrevivencia || 0).toString() + '%',
      formatNumber(record.densidadActual || 0),
      formatNumber(record.biomasaTotal || 0),
      (record.fca || 0).toString(),
      formatNumber(record.alimentoProyectadoDia || 0) + ' kg'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Granja', 'Est.', 'P.Act', 'Inc.S', 'Días', '% Sobr', 'Dens.A', 'Bio.Tot', 'FCA', 'Proy.Dia']],
      body: pondBody,
      headStyles: { fillColor: '#475569' }
    });

    doc.save(`reporte-produccion-${new Date().toISOString().split('T')[0]}.pdf`);
    setIsExporting(false);
  };

  const uniqueAlimentos = useMemo(() => Array.from(new Set(records.map(r => r.alimento))), [records]);
  const uniqueLaboratorios = useMemo(() => Array.from(new Set(records.map(r => r.laboratorio))), [records]);
  const uniqueEstanques = useMemo(() => {
    const set = new Set<string>();
    const source = filters.granja 
      ? records.filter(r => r.granja?.toString().trim().toLowerCase() === filters.granja.trim().toLowerCase())
      : records;
    source.forEach(r => {
      const norm = normalizeEstanque(r.estanque);
      if (norm) set.add(norm);
    });
    return Array.from(set).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [records, filters.granja]);
  const uniqueGranjas = useMemo(() => Array.from(new Set(records.map(r => r.granja))).filter(Boolean), [records]);

  // All individual sampling/production records matching active filters (granja, estanque, dates, etc.)
  const filteredRawRecords = useMemo(() => {
    return records.filter(record => {
      const matchGranja = !filters.granja || record.granja?.toString().trim().toLowerCase() === filters.granja.trim().toLowerCase();
      const matchEstanque = !filters.estanque || normalizeEstanque(record.estanque) === normalizeEstanque(filters.estanque);
      const matchAlimento = !filters.alimento || record.alimento === filters.alimento;
      const matchLab = !filters.laboratorio || record.laboratorio === filters.laboratorio;

      const rDate = cleanDateString(record.fecha) || cleanDateString(record.fechaSiembra);
      const matchDesde = !filters.fechaDesde || (rDate ? rDate >= filters.fechaDesde : true);
      const matchHasta = !filters.fechaHasta || (rDate ? rDate <= filters.fechaHasta : true);

      return matchGranja && matchEstanque && matchAlimento && matchLab && matchDesde && matchHasta;
    });
  }, [records, filters]);

  // Latest status per pond within the filtered dataset (for summary cards, tables, and pond bar charts)
  const filteredRecords = useMemo(() => {
    const latest = new Map<string, PondRecord>();
    filteredRawRecords.forEach(record => {
      const normalizedGranja = String(record.granja || '').trim().toLowerCase();
      const key = `${normalizedGranja}-${normalizeEstanque(record.estanque)}`;
      const current = latest.get(key);
      const rDate = cleanDateString(record.fecha) || cleanDateString(record.fechaSiembra);
      const cDate = current ? (cleanDateString(current.fecha) || cleanDateString(current.fechaSiembra)) : '';

      if (!current || rDate > cDate || (rDate === cDate && Number(record.diasCultivo) >= Number(current.diasCultivo))) {
        latest.set(key, record);
      }
    });

    return Array.from(latest.values()).sort((a, b) => {
      if (a.granja === b.granja) {
        const numA = Number(normalizeEstanque(a.estanque));
        const numB = Number(normalizeEstanque(b.estanque));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return String(a.estanque).localeCompare(String(b.estanque), undefined, { numeric: true });
      }
      return a.granja.localeCompare(b.granja);
    });
  }, [filteredRawRecords]);

  const chartData = useMemo(() => 
    [...filteredRecords].sort((a, b) => {
      const numA = Number(normalizeEstanque(a.estanque));
      const numB = Number(normalizeEstanque(b.estanque));
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a.estanque).localeCompare(String(b.estanque), undefined, { numeric: true });
    }),
  [filteredRecords]);

  const historicalChartData = useMemo(() => {
    const byDate = new Map<string, any>();
    filteredRawRecords.forEach(record => {
      let dateStr = cleanDateString(record.fecha) || cleanDateString(record.fechaSiembra);
      if (!dateStr) {
        dateStr = new Date().toISOString().split('T')[0];
      }

      if (!byDate.has(dateStr)) {
        let formattedDate = dateStr;
        try {
          const parts = dateStr.split('-').map(Number);
          if (parts.length === 3) {
            const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
            formattedDate = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', timeZone: 'UTC' });
          }
        } catch (e) {
          formattedDate = dateStr;
        }
        byDate.set(dateStr, { 
          fechaRaw: dateStr, 
          fecha: formattedDate 
        });
      }
      const entry = byDate.get(dateStr);
      const pondLabel = filters.granja ? `Estanque ${normalizeEstanque(record.estanque)}` : `${record.granja} - E${normalizeEstanque(record.estanque)}`;
      
      entry[`${pondLabel}_peso`] = Number(record.pesoActual) || 0;
      entry[`${pondLabel}_inc`] = Number(record.incrementoSemanal) || 0;
      entry[`${pondLabel}_surv`] = Number(record.sobrevivencia) || 0;
      entry[`${pondLabel}_biomasa`] = Number(record.biomasaTotal) || 0;
    });

    return Array.from(byDate.values())
      .sort((a, b) => (a.fechaRaw || '').localeCompare(b.fechaRaw || ''));
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
    return Array.from(estanques).sort((a, b) => {
      const numA = Number(a.replace(/[^0-9]/g, ''));
      const numB = Number(b.replace(/[^0-9]/g, ''));
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [historicalChartData]);

  const filteredHarvestsForChart = useMemo(() => {
    return harvests.filter(h => {
      const matchGranja = !filters.granja || h.granja?.toString().trim().toLowerCase() === filters.granja.trim().toLowerCase();
      const matchEstanque = !filters.estanque || normalizeEstanque(h.estanque) === normalizeEstanque(filters.estanque);
      const hDate = cleanDateString(h.fecha);
      const matchDesde = !filters.fechaDesde || (hDate ? hDate >= filters.fechaDesde : true);
      const matchHasta = !filters.fechaHasta || (hDate ? hDate <= filters.fechaHasta : true);
      return matchGranja && matchEstanque && matchDesde && matchHasta;
    });
  }, [harvests, filters]);

  const harvestChartData = useMemo(() => {
    return [...filteredHarvestsForChart]
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map(h => {
        const formattedDate = h.fecha ? new Date(h.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '';
        return {
          id: h.id,
          granja: h.granja,
          estanque: h.estanque,
          label: `Est. ${h.estanque} (${formattedDate})`,
          fecha: formattedDate,
          totalKilos: Number(h.totalKilos) || 0,
          totalOrganismos: Number(h.totalOrganismos) || 0,
          pre1Kilos: Number(h.pre1Kilos) || 0,
          pre2Kilos: Number(h.pre2Kilos) || 0,
          finalKilos: Number(h.finalKilos) || 0,
          pre1Gramos: Number(h.pre1Gramos) || 0,
          pre2Gramos: Number(h.pre2Gramos) || 0,
          finalGramos: Number(h.finalGramos) || 0,
        };
      });
  }, [filteredHarvestsForChart]);

  const lineColors = ['#3b82f6', '#10b981', '#fb923c', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#eab308'];

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
        onLocalFileUpload={handleLocalFileUpload}
      />

      <div className="flex-1 flex flex-col w-full">
        {isLocalMode && (
          <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-bold shadow-md relative z-50">
            ⚠️ Modo Local: Viendo datos de archivo. Los cambios y la sincronización con Google Sheets están deshabilitados. Recarga la página para volver.
          </div>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .csv" />
        <nav className="bg-[#093661] border-b border-[#125699] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                 <h1 className="text-xl font-bold text-white">
                    
                    {activeView === 'estadisticas' && 'Análisis Estadístico'}
                    {activeView === 'farmEvaluation' && 'Evaluación Técnica de Granja'}
                    {activeView === 'evaluationsList' && 'Historial de Evaluaciones'}
                    {activeView === 'productionProgram' && 'Control de Producción'}
                    {activeView === 'googleSync' && 'Sincronización con Google Sheets'}
                 </h1>
              </div>
              <div className="flex items-center gap-4">
                {activeView === 'estadisticas' && (
                  <>
                    <button 
                      onClick={handleExportPDF} 
                      disabled={isExporting}
                      className="bg-[#0B4075] border border-[#125699] hover:bg-indigo-600 hover:border-indigo-500 hover:text-white disabled:opacity-50 text-blue-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                    >
                      {isExporting ? (
                        <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      )}
                      <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar a PDF'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8 w-full">

          {activeView === 'estadisticas' && (
             <div className="space-y-8">
                <FilterPanel filters={filters} onFilterChange={setFilters} uniqueAlimentos={uniqueAlimentos} uniqueLaboratorios={uniqueLaboratorios} uniqueEstanques={uniqueEstanques} uniqueGranjas={uniqueGranjas} />
                <EstadisticasView 
                  records={filteredRecords} 
                  allRecords={filteredRawRecords} 
                  chartData={chartData}
                  historicalChartData={historicalChartData}
                  harvestChartData={harvestChartData}
                  uniqueEstanquesInHistory={uniqueEstanquesInHistory}
                  lineColors={lineColors}
                />
             </div>
          )}

          {activeView === 'farmEvaluation' && <FarmEvaluationForm initialData={editingEvaluation || undefined} onSave={handleSaveEvaluation} />}
          {activeView === 'evaluationsList' && <EvaluationList evaluations={evaluations} onEdit={(evalData) => { setEditingEvaluation(evalData); setActiveView('farmEvaluation'); }} onDelete={handleDeleteEvaluation} />}
          {activeView === 'productionProgram' && (
            <ProductionProgram 
              records={records} 
              onAdd={() => { setEditingRecord(null); setShowForm(true); }}
              onEdit={(record) => { setEditingRecord(record); setShowForm(true); }}
              onDelete={handleDeleteRecord}
              googleSheetsConfig={googleSheetsConfig}
              onSyncNow={() => syncDataToSheets(records, evaluations, harvests)}
              onOpenSyncConfig={() => setActiveView('googleSync')}
            />
          )}
          {activeView === 'harvests' && (
            <HarvestsModule 
              records={records}
              harvests={harvests}
              onAddHarvest={handleAddHarvest}
              onEditHarvest={handleEditHarvest}
              onDeleteHarvest={handleDeleteHarvest}
            />
          )}
          {activeView === 'googleSync' && (
            <GoogleSheetsSync 
              config={googleSheetsConfig} 
              onUpdateConfig={isLocalMode ? () => alert("Estás en modo local. Configuración bloqueada.") : setGoogleSheetsConfig}
              onImportData={isLocalMode ? () => alert("Estás en modo local. Sincronización bloqueada.") : handleImportData}
              data={{
                  production: records,
                  evaluations: evaluations,
                  harvests: harvests
              }}
            />
          )}
        </main>

        {showForm && <PondForm initialData={editingRecord || undefined} existingRecords={records} evaluations={evaluations} onAdd={handleAddRecord} onCancel={() => { setShowForm(false); setEditingRecord(null); }} />}
        
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
