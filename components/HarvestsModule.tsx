import React, { useState, useMemo, useRef } from 'react';
import { HarvestRecord, PondRecord } from '../types';
import { Plus, Save, X, Edit2, Trash2, ChevronLeft, ChevronRight, Scale, BarChart2, Hash, Sparkles, FileSpreadsheet, AlertTriangle, TrendingUp, Layers, Fish } from 'lucide-react';
import { formatNumber, formatDate, normalizeEstanque, cleanDateString, parseFlexibleNumber } from '../utils';
import { calculateStageOrganismos, parseHarvestWorksheet, normalizeHarvestRecord } from '../utils/harvestUtils';
import { ResponsiveContainer, BarChart, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';

interface HarvestsModuleProps {
  records: PondRecord[];
  harvests: HarvestRecord[];
  onAddHarvest: (harvest: HarvestRecord) => void;
  onEditHarvest: (harvest: HarvestRecord) => void;
  onDeleteHarvest: (id: string) => void;
  onClearAllHarvests?: () => void;
  onDeleteByGranja?: (granja: string) => void;
  onImportHarvests?: (newHarvests: HarvestRecord[]) => void;
}

const HarvestsModule: React.FC<HarvestsModuleProps> = ({
  records,
  harvests,
  onAddHarvest,
  onEditHarvest,
  onDeleteHarvest,
  onClearAllHarvests,
  onDeleteByGranja,
  onImportHarvests,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<HarvestRecord | null>(null);
  const harvestFileInputRef = useRef<HTMLInputElement>(null);

  // Filter States
  const [granjaFilter, setGranjaFilter] = useState('');
  const [estanqueFilter, setEstanqueFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 12;

  // Form Fields State
  const [formGranja, setFormGranja] = useState('');
  const [formEstanque, setFormEstanque] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]);

  const [fecha1, setFecha1] = useState('');
  const [pre1Kilos, setPre1Kilos] = useState('');
  const [pre1Gramos, setPre1Gramos] = useState('');
  const [pre1Organismos, setPre1Organismos] = useState('');

  const [fecha2, setFecha2] = useState('');
  const [pre2Kilos, setPre2Kilos] = useState('');
  const [pre2Gramos, setPre2Gramos] = useState('');
  const [pre2Organismos, setPre2Organismos] = useState('');

  const [fecha3, setFecha3] = useState('');
  const [pre3Kilos, setPre3Kilos] = useState('');
  const [pre3Gramos, setPre3Gramos] = useState('');
  const [pre3Organismos, setPre3Organismos] = useState('');

  const [fecha4, setFecha4] = useState('');
  const [pre4Kilos, setPre4Kilos] = useState('');
  const [pre4Gramos, setPre4Gramos] = useState('');
  const [pre4Organismos, setPre4Organismos] = useState('');

  const [fecha5, setFecha5] = useState('');
  const [pre5Kilos, setPre5Kilos] = useState('');
  const [pre5Gramos, setPre5Gramos] = useState('');
  const [pre5Organismos, setPre5Organismos] = useState('');

  const [fechaFinal, setFechaFinal] = useState('');
  const [finalKilos, setFinalKilos] = useState('');
  const [finalGramos, setFinalGramos] = useState('');
  const [finalOrganismos, setFinalOrganismos] = useState('');

  // Available Granjas & Estanques from production records
  const uniqueGranjas = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.granja) set.add(r.granja); });
    harvests.forEach(h => { if (h.granja) set.add(h.granja); });
    return Array.from(set).sort();
  }, [records, harvests]);

  const availableEstanques = useMemo(() => {
    if (!formGranja) return [];
    const set = new Set<string>();
    records
      .filter(r => r.granja?.toLowerCase().trim() === formGranja.toLowerCase().trim())
      .forEach(r => { if (r.estanque) set.add(normalizeEstanque(r.estanque)); });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [records, formGranja]);

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingHarvest(null);
    setFormGranja(uniqueGranjas[0] || '');
    setFormEstanque('');
    setFormFecha(new Date().toISOString().split('T')[0]);
    setFecha1(''); setPre1Kilos(''); setPre1Gramos(''); setPre1Organismos('');
    setFecha2(''); setPre2Kilos(''); setPre2Gramos(''); setPre2Organismos('');
    setFecha3(''); setPre3Kilos(''); setPre3Gramos(''); setPre3Organismos('');
    setFecha4(''); setPre4Kilos(''); setPre4Gramos(''); setPre4Organismos('');
    setFecha5(''); setPre5Kilos(''); setPre5Gramos(''); setPre5Organismos('');
    setFechaFinal(''); setFinalKilos(''); setFinalGramos(''); setFinalOrganismos('');
    setShowForm(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (h: HarvestRecord) => {
    setEditingHarvest(h);
    setFormGranja(h.granja);
    setFormEstanque(normalizeEstanque(h.estanque));
    setFormFecha(h.fecha || new Date().toISOString().split('T')[0]);

    setFecha1(h.fecha1 || '');
    setPre1Kilos(h.pre1Kilos ? String(h.pre1Kilos) : '');
    setPre1Gramos(h.pre1Gramos ? String(h.pre1Gramos) : '');
    setPre1Organismos(h.pre1Organismos ? String(h.pre1Organismos) : '');

    setFecha2(h.fecha2 || '');
    setPre2Kilos(h.pre2Kilos ? String(h.pre2Kilos) : '');
    setPre2Gramos(h.pre2Gramos ? String(h.pre2Gramos) : '');
    setPre2Organismos(h.pre2Organismos ? String(h.pre2Organismos) : '');

    setFecha3(h.fecha3 || '');
    setPre3Kilos(h.pre3Kilos ? String(h.pre3Kilos) : '');
    setPre3Gramos(h.pre3Gramos ? String(h.pre3Gramos) : '');
    setPre3Organismos(h.pre3Organismos ? String(h.pre3Organismos) : '');

    setFecha4(h.fecha4 || '');
    setPre4Kilos(h.pre4Kilos ? String(h.pre4Kilos) : '');
    setPre4Gramos(h.pre4Gramos ? String(h.pre4Gramos) : '');
    setPre4Organismos(h.pre4Organismos ? String(h.pre4Organismos) : '');

    setFecha5(h.fecha5 || '');
    setPre5Kilos(h.pre5Kilos ? String(h.pre5Kilos) : '');
    setPre5Gramos(h.pre5Gramos ? String(h.pre5Gramos) : '');
    setPre5Organismos(h.pre5Organismos ? String(h.pre5Organismos) : '');

    setFechaFinal(h.fechaFinal || '');
    setFinalKilos(h.finalKilos ? String(h.finalKilos) : '');
    setFinalGramos(h.finalGramos ? String(h.finalGramos) : '');
    setFinalOrganismos(h.finalOrganismos ? String(h.finalOrganismos) : '');

    setShowForm(true);
  };

  // Auto calculate organisms on input change
  const handlePreKilosOrGramsChange = (
    stage: 1 | 2 | 3 | 4 | 5 | 'final',
    kilosVal: string,
    gramosVal: string
  ) => {
    const k = parseFlexibleNumber(kilosVal);
    const g = parseFlexibleNumber(gramosVal);
    const org = calculateStageOrganismos(k, g);
    const orgStr = org > 0 ? String(org) : '';

    if (stage === 1) {
      setPre1Kilos(kilosVal); setPre1Gramos(gramosVal); setPre1Organismos(orgStr);
    } else if (stage === 2) {
      setPre2Kilos(kilosVal); setPre2Gramos(gramosVal); setPre2Organismos(orgStr);
    } else if (stage === 3) {
      setPre3Kilos(kilosVal); setPre3Gramos(gramosVal); setPre3Organismos(orgStr);
    } else if (stage === 4) {
      setPre4Kilos(kilosVal); setPre4Gramos(gramosVal); setPre4Organismos(orgStr);
    } else if (stage === 5) {
      setPre5Kilos(kilosVal); setPre5Gramos(gramosVal); setPre5Organismos(orgStr);
    } else {
      setFinalKilos(kilosVal); setFinalGramos(gramosVal); setFinalOrganismos(orgStr);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGranja || !formEstanque) {
      alert('Por favor selecciona Granja y Estanque.');
      return;
    }

    const p1k = parseFlexibleNumber(pre1Kilos);
    const p1g = parseFlexibleNumber(pre1Gramos);
    const p1o = parseFlexibleNumber(pre1Organismos) || calculateStageOrganismos(p1k, p1g);

    const p2k = parseFlexibleNumber(pre2Kilos);
    const p2g = parseFlexibleNumber(pre2Gramos);
    const p2o = parseFlexibleNumber(pre2Organismos) || calculateStageOrganismos(p2k, p2g);

    const p3k = parseFlexibleNumber(pre3Kilos);
    const p3g = parseFlexibleNumber(pre3Gramos);
    const p3o = parseFlexibleNumber(pre3Organismos) || calculateStageOrganismos(p3k, p3g);

    const p4k = parseFlexibleNumber(pre4Kilos);
    const p4g = parseFlexibleNumber(pre4Gramos);
    const p4o = parseFlexibleNumber(pre4Organismos) || calculateStageOrganismos(p4k, p4g);

    const p5k = parseFlexibleNumber(pre5Kilos);
    const p5g = parseFlexibleNumber(pre5Gramos);
    const p5o = parseFlexibleNumber(pre5Organismos) || calculateStageOrganismos(p5k, p5g);

    const fk = parseFlexibleNumber(finalKilos);
    const fg = parseFlexibleNumber(finalGramos);
    const fo = parseFlexibleNumber(finalOrganismos) || calculateStageOrganismos(fk, fg);

    const totalK = p1k + p2k + p3k + p4k + p5k + fk;
    const totalO = p1o + p2o + p3o + p4o + p5o + fo;
    const avgG = totalK > 0 && totalO > 0 ? parseFloat(((totalK * 1000) / totalO).toFixed(2)) : 0;

    const baseRecord: HarvestRecord = {
      id: editingHarvest ? editingHarvest.id : `harvest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      granja: formGranja.trim(),
      estanque: formEstanque.trim(),
      fecha: formFecha,
      fecha1: fecha1 || undefined,
      pre1Kilos: p1k || undefined,
      pre1Gramos: p1g || undefined,
      pre1Organismos: p1o || undefined,
      fecha2: fecha2 || undefined,
      pre2Kilos: p2k || undefined,
      pre2Gramos: p2g || undefined,
      pre2Organismos: p2o || undefined,
      fecha3: fecha3 || undefined,
      pre3Kilos: p3k || undefined,
      pre3Gramos: p3g || undefined,
      pre3Organismos: p3o || undefined,
      fecha4: fecha4 || undefined,
      pre4Kilos: p4k || undefined,
      pre4Gramos: p4g || undefined,
      pre4Organismos: p4o || undefined,
      fecha5: fecha5 || undefined,
      pre5Kilos: p5k || undefined,
      pre5Gramos: p5g || undefined,
      pre5Organismos: p5o || undefined,
      fechaFinal: fechaFinal || undefined,
      finalKilos: fk || undefined,
      finalGramos: fg || undefined,
      finalOrganismos: fo || undefined,
      totalKilos: totalK,
      totalOrganismos: totalO,
      pesoPromedioPrecosechado: avgG
    };

    const normalized = normalizeHarvestRecord(baseRecord) || baseRecord;

    if (editingHarvest) {
      onEditHarvest(normalized);
    } else {
      onAddHarvest(normalized);
    }
    setShowForm(false);
    setEditingHarvest(null);
  };

  // Filtered harvest records
  const filteredHarvests = useMemo(() => {
    return harvests.filter(h => {
      const matchG = !granjaFilter || h.granja?.toLowerCase().trim() === granjaFilter.toLowerCase().trim();
      const matchE = !estanqueFilter || normalizeEstanque(h.estanque) === normalizeEstanque(estanqueFilter);
      return matchG && matchE;
    });
  }, [harvests, granjaFilter, estanqueFilter]);

  // Overall Statistics Cards
  const stats = useMemo(() => {
    let totK = 0;
    let totOrg = 0;
    let preK = 0;
    let finalK = 0;
    filteredHarvests.forEach(h => {
      const p1 = Number(h.pre1Kilos) || 0;
      const p2 = Number(h.pre2Kilos) || 0;
      const p3 = Number(h.pre3Kilos) || 0;
      const p4 = Number(h.pre4Kilos) || 0;
      const p5 = Number(h.pre5Kilos) || 0;
      const fk = Number(h.finalKilos) || 0;
      const tk = Number(h.totalKilos) || (p1 + p2 + p3 + p4 + p5 + fk);
      const to = Number(h.totalOrganismos) || 0;

      preK += (p1 + p2 + p3 + p4 + p5);
      finalK += fk;
      totK += tk;
      totOrg += to;
    });

    const avgWeight = totK > 0 && totOrg > 0 ? (totK * 1000) / totOrg : 0;
    return {
      pondsCount: filteredHarvests.length,
      totK,
      preK,
      finalK,
      totOrg,
      avgWeight: Number(avgWeight.toFixed(2))
    };
  }, [filteredHarvests]);

  // Pagination
  const totalPages = Math.ceil(filteredHarvests.length / recordsPerPage) || 1;
  const paginatedHarvests = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return filteredHarvests.slice(start, start + recordsPerPage);
  }, [filteredHarvests, currentPage]);

  // Handle Excel upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames.find(n =>
          n.toLowerCase().includes('cosecha') || n.toLowerCase().includes('precosecha') || n.toLowerCase().includes('raleo')
        ) || workbook.SheetNames[0];

        if (sheetName) {
          const parsed = parseHarvestWorksheet(workbook.Sheets[sheetName], XLSX);
          if (parsed && parsed.length > 0 && onImportHarvests) {
            onImportHarvests(parsed);
            alert(`Se importaron ${parsed.length} registros de cosecha exitosamente.`);
          } else {
            alert('No se encontraron registros válidos de cosechas en la hoja seleccionada.');
          }
        }
      } catch (err) {
        console.error('Error parsing harvests excel:', err);
        alert('Error al leer el archivo de cosechas. Verifica el formato.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#093661] p-6 rounded-2xl border border-[#125699] shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Scale className="w-8 h-8 text-amber-400" />
            <span>Ciclo de Cosechas y Pre-cosechas</span>
          </h2>
          <p className="text-sm text-blue-200 mt-1">
            Gestión detallada de eventos de extracción parcial (Pre 1 a Pre 5) y cosechas finales por estanque.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            ref={harvestFileInputRef}
            onChange={handleExcelUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => harvestFileInputRef.current?.click()}
            className="bg-[#0B4075] hover:bg-[#125699] text-blue-100 border border-[#1B5CB3] px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
            title="Importar pestaña de cosechas desde Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Cargar Excel</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Pre-cosecha</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm">
          <p className="text-xs text-blue-300 font-medium">Estanques Cosechados</p>
          <p className="text-2xl font-black text-white mt-1">{stats.pondsCount}</p>
          <p className="text-[11px] text-blue-400 mt-0.5">En ciclo actual</p>
        </div>

        <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm">
          <p className="text-xs text-amber-300 font-medium">Kilos Pre-cosechas</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{formatNumber(stats.preK)} kg</p>
          <p className="text-[11px] text-blue-400 mt-0.5">Raleos parciales</p>
        </div>

        <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm">
          <p className="text-xs text-emerald-300 font-medium">Kilos Cosecha Final</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{formatNumber(stats.finalK)} kg</p>
          <p className="text-[11px] text-blue-400 mt-0.5">Vaciado final</p>
        </div>

        <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm">
          <p className="text-xs text-cyan-300 font-medium">Total Extraído</p>
          <p className="text-2xl font-black text-white mt-1">{formatNumber(stats.totK)} kg</p>
          <p className="text-[11px] text-blue-400 mt-0.5">Biomasa cosechada</p>
        </div>

        <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm">
          <p className="text-xs text-purple-300 font-medium">Peso Promedio Extraído</p>
          <p className="text-2xl font-black text-purple-300 mt-1">{stats.avgWeight > 0 ? `${stats.avgWeight} g` : '-'}</p>
          <p className="text-[11px] text-blue-400 mt-0.5">Ponderado global</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#072C52] p-4 rounded-xl border border-[#125699] flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">Filtrar por Granja:</label>
            <select
              value={granjaFilter}
              onChange={(e) => { setGranjaFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#0B4075] text-white border border-[#125699] rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
            >
              <option value="">Todas las Granjas</option>
              {uniqueGranjas.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">Filtrar por Estanque:</label>
            <input
              type="text"
              placeholder="Ej. 11, 2, 4..."
              value={estanqueFilter}
              onChange={(e) => { setEstanqueFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#0B4075] text-white border border-[#125699] rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none w-36 placeholder-blue-300"
            />
          </div>
        </div>

        <div className="text-xs text-blue-300">
          Mostrando {filteredHarvests.length} registro(s) de cosechas
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0B4075] rounded-xl border border-[#125699] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#072C52] text-blue-100 uppercase tracking-wider font-bold border-b border-[#125699]">
              <tr>
                <th className="px-3 py-3 border-r border-[#125699]">Granja</th>
                <th className="px-3 py-3 border-r border-[#125699]">Est.</th>
                <th className="px-3 py-3 border-r border-[#125699]">Fecha</th>
                <th className="px-3 py-3 border-r border-[#125699] bg-amber-950/30 text-amber-300 text-center" colSpan={3}>Pre-Cosecha 1</th>
                <th className="px-3 py-3 border-r border-[#125699] bg-amber-950/20 text-amber-200 text-center" colSpan={3}>Pre-Cosecha 2</th>
                <th className="px-3 py-3 border-r border-[#125699] bg-blue-950/30 text-blue-200 text-center" colSpan={3}>Cosecha Final</th>
                <th className="px-3 py-3 border-r border-[#125699] text-emerald-300 text-right">Total Kg</th>
                <th className="px-3 py-3 border-r border-[#125699] text-cyan-300 text-right">Total Org</th>
                <th className="px-3 py-3 border-r border-[#125699] text-purple-300 text-right">Prom. g</th>
                <th className="px-3 py-3 text-center">Acciones</th>
              </tr>
              <tr className="bg-[#062444] text-[10px] text-blue-300 border-b border-[#125699]">
                <th className="px-3 py-1.5 border-r border-[#125699]"></th>
                <th className="px-3 py-1.5 border-r border-[#125699]"></th>
                <th className="px-3 py-1.5 border-r border-[#125699]"></th>
                {/* Pre 1 */}
                <th className="px-2 py-1.5 text-right border-r border-[#125699]">Kilos</th>
                <th className="px-2 py-1.5 text-right border-r border-[#125699]">Gramos</th>
                <th className="px-2 py-1.5 text-right border-r border-[#125699]">Org</th>
                {/* Pre 2 */}
                <th className="px-2 py-1.5 text-right border-r border-[#125699]">Kilos</th>
                <th className="px-2 py-1.5 text-right border-r border-[#125699]">Gramos</th>
                <th className="px-2 py-1.5 text-right border-r border-[#125699]">Org</th>
                {/* Final */}
                <th className="px-2 py-1.5 text-right border-r border-[#125699]">Kilos</th>
                <th className="px-2 py-1.5 text-right border-r border-[#125699]">Gramos</th>
                <th className="px-2 py-1.5 text-right border-r border-[#125699]">Org</th>
                {/* Totals */}
                <th className="px-3 py-1.5 border-r border-[#125699]"></th>
                <th className="px-3 py-1.5 border-r border-[#125699]"></th>
                <th className="px-3 py-1.5 border-r border-[#125699]"></th>
                <th className="px-3 py-1.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#125699]/60">
              {paginatedHarvests.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-blue-300">
                    No se encontraron registros de cosechas. Puedes agregar uno nuevo con el botón "+ Registrar Pre-cosecha".
                  </td>
                </tr>
              ) : (
                paginatedHarvests.map((h) => {
                  const p1k = Number(h.pre1Kilos) || 0;
                  const p1g = Number(h.pre1Gramos) || 0;
                  const p1o = Number(h.pre1Organismos) || 0;

                  const p2k = Number(h.pre2Kilos) || 0;
                  const p2g = Number(h.pre2Gramos) || 0;
                  const p2o = Number(h.pre2Organismos) || 0;

                  const fk = Number(h.finalKilos) || 0;
                  const fg = Number(h.finalGramos) || 0;
                  const fo = Number(h.finalOrganismos) || 0;

                  const totK = Number(h.totalKilos) || (p1k + p2k + fk);
                  const totO = Number(h.totalOrganismos) || (p1o + p2o + fo);
                  const avgG = Number(h.pesoPromedioPrecosechado) || (totK > 0 && totO > 0 ? (totK * 1000) / totO : 0);

                  return (
                    <tr key={h.id} className="hover:bg-[#0E4680]/60 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-white border-r border-[#125699] whitespace-nowrap">
                        {h.granja}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-amber-300 border-r border-[#125699] whitespace-nowrap">
                        E{normalizeEstanque(h.estanque)}
                      </td>
                      <td className="px-3 py-2.5 text-blue-200 border-r border-[#125699] whitespace-nowrap">
                        {h.fecha1 || h.fecha || '-'}
                      </td>

                      {/* Pre 1 */}
                      <td className="px-2 py-2.5 text-right font-medium text-amber-300 border-r border-[#125699]/40 bg-amber-950/10">
                        {p1k > 0 ? formatNumber(p1k) : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-300 border-r border-[#125699]/40 bg-amber-950/10">
                        {p1g > 0 ? `${p1g} g` : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-400 border-r border-[#125699] bg-amber-950/10">
                        {p1o > 0 ? formatNumber(p1o) : '-'}
                      </td>

                      {/* Pre 2 */}
                      <td className="px-2 py-2.5 text-right font-medium text-amber-200 border-r border-[#125699]/40 bg-amber-950/5">
                        {p2k > 0 ? formatNumber(p2k) : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-300 border-r border-[#125699]/40 bg-amber-950/5">
                        {p2g > 0 ? `${p2g} g` : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-400 border-r border-[#125699] bg-amber-950/5">
                        {p2o > 0 ? formatNumber(p2o) : '-'}
                      </td>

                      {/* Final */}
                      <td className="px-2 py-2.5 text-right font-medium text-blue-200 border-r border-[#125699]/40 bg-blue-950/10">
                        {fk > 0 ? formatNumber(fk) : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-300 border-r border-[#125699]/40 bg-blue-950/10">
                        {fg > 0 ? `${fg} g` : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-400 border-r border-[#125699] bg-blue-950/10">
                        {fo > 0 ? formatNumber(fo) : '-'}
                      </td>

                      {/* Totals */}
                      <td className="px-3 py-2.5 text-right font-black text-emerald-300 border-r border-[#125699] whitespace-nowrap">
                        {formatNumber(totK)} kg
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-cyan-300 border-r border-[#125699] whitespace-nowrap">
                        {formatNumber(totO)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-purple-300 border-r border-[#125699] whitespace-nowrap">
                        {avgG > 0 ? `${avgG.toFixed(2)} g` : '-'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(h)}
                            className="p-1 hover:bg-blue-600/50 rounded text-blue-300 hover:text-white transition-colors"
                            title="Editar registro"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar registro de cosecha para Estanque ${h.estanque} (${h.granja})?`)) {
                                onDeleteHarvest(h.id);
                              }
                            }}
                            className="p-1 hover:bg-red-600/50 rounded text-red-300 hover:text-white transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-[#072C52] border-t border-[#125699] flex items-center justify-between">
            <span className="text-xs text-blue-300">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-[#0B4075] text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded bg-[#0B4075] text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form for Add/Edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#072C52] border border-[#1B5CB3] rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#125699] pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <span>{editingHarvest ? 'Editar Cosecha / Pre-cosecha' : 'Registrar Nueva Pre-cosecha o Cosecha'}</span>
                </h3>
                <p className="text-xs text-blue-300 mt-0.5">
                  Captura las etapas de extracción por fecha, kilos y peso promedio.
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* General Pond Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#093661] p-4 rounded-xl border border-[#125699]">
                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1">Granja:</label>
                  <select
                    value={formGranja}
                    onChange={(e) => {
                      setFormGranja(e.target.value);
                      setFormEstanque('');
                    }}
                    required
                    className="w-full bg-[#0B4075] text-white border border-[#125699] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="">-- Seleccionar Granja --</option>
                    {uniqueGranjas.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1">Estanque:</label>
                  {availableEstanques.length > 0 ? (
                    <select
                      value={formEstanque}
                      onChange={(e) => setFormEstanque(e.target.value)}
                      required
                      className="w-full bg-[#0B4075] text-white border border-[#125699] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value="">-- Seleccionar --</option>
                      {availableEstanques.map(e => (
                        <option key={e} value={e}>Estanque {e}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Número de estanque"
                      value={formEstanque}
                      onChange={(e) => setFormEstanque(e.target.value)}
                      required
                      className="w-full bg-[#0B4075] text-white border border-[#125699] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-200 mb-1">Fecha General:</label>
                  <input
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    required
                    className="w-full bg-[#0B4075] text-white border border-[#125699] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Stage 1: Pre-cosecha 1 */}
              <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] space-y-3">
                <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Pre-Cosecha 1 (Primer Raleo)</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Fecha Pre 1:</label>
                    <input
                      type="date"
                      value={fecha1}
                      onChange={(e) => setFecha1(e.target.value)}
                      className="w-full bg-[#072C52] text-white border border-[#125699] rounded px-2.5 py-1.5 text-xs [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Kilos Extraídos:</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej. 1152"
                      value={pre1Kilos}
                      onChange={(e) => handlePreKilosOrGramsChange(1, e.target.value, pre1Gramos)}
                      className="w-full bg-[#072C52] text-white border border-[#125699] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Peso Promedio (g):</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej. 9.06"
                      value={pre1Gramos}
                      onChange={(e) => handlePreKilosOrGramsChange(1, pre1Kilos, e.target.value)}
                      className="w-full bg-[#072C52] text-white border border-[#125699] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Organismos (Auto):</label>
                    <input
                      type="number"
                      value={pre1Organismos}
                      onChange={(e) => setPre1Organismos(e.target.value)}
                      placeholder="Cálculo auto"
                      className="w-full bg-[#051E38] text-cyan-300 font-semibold border border-[#125699] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Stage 2: Pre-cosecha 2 */}
              <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] space-y-3">
                <h4 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-300"></span>
                  <span>Pre-Cosecha 2 (Segundo Raleo - Opcional)</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Fecha Pre 2:</label>
                    <input
                      type="date"
                      value={fecha2}
                      onChange={(e) => setFecha2(e.target.value)}
                      className="w-full bg-[#072C52] text-white border border-[#125699] rounded px-2.5 py-1.5 text-xs [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Kilos Extraídos:</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej. 1324"
                      value={pre2Kilos}
                      onChange={(e) => handlePreKilosOrGramsChange(2, e.target.value, pre2Gramos)}
                      className="w-full bg-[#072C52] text-white border border-[#125699] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Peso Promedio (g):</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej. 12.5"
                      value={pre2Gramos}
                      onChange={(e) => handlePreKilosOrGramsChange(2, pre2Kilos, e.target.value)}
                      className="w-full bg-[#072C52] text-white border border-[#125699] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Organismos (Auto):</label>
                    <input
                      type="number"
                      value={pre2Organismos}
                      onChange={(e) => setPre2Organismos(e.target.value)}
                      placeholder="Cálculo auto"
                      className="w-full bg-[#051E38] text-cyan-300 font-semibold border border-[#125699] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Stage Final: Cosecha Final */}
              <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] space-y-3">
                <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Cosecha Final (Vaciado de Estanque)</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Fecha Cosecha Final:</label>
                    <input
                      type="date"
                      value={fechaFinal}
                      onChange={(e) => setFechaFinal(e.target.value)}
                      className="w-full bg-[#072C52] text-white border border-[#125699] rounded px-2.5 py-1.5 text-xs [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Kilos Finales:</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej. 5200"
                      value={finalKilos}
                      onChange={(e) => handlePreKilosOrGramsChange('final', e.target.value, finalGramos)}
                      className="w-full bg-[#072C52] text-white border border-[#125699] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Peso Promedio Final (g):</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej. 17.5"
                      value={finalGramos}
                      onChange={(e) => handlePreKilosOrGramsChange('final', finalKilos, e.target.value)}
                      className="w-full bg-[#072C52] text-white border border-[#125699] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-blue-200 mb-1">Organismos (Auto):</label>
                    <input
                      type="number"
                      value={finalOrganismos}
                      onChange={(e) => setFinalOrganismos(e.target.value)}
                      placeholder="Cálculo auto"
                      className="w-full bg-[#051E38] text-cyan-300 font-semibold border border-[#125699] rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#125699]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-[#0B4075] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HarvestsModule;
