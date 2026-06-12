import React, { useState, useMemo, useEffect } from 'react';
import { HarvestRecord, PondRecord } from '../types';
import { Plus, Save, X, Edit2, Trash2, ChevronLeft, ChevronRight, Scale, BarChart2, Hash, Sparkles } from 'lucide-react';
import { formatNumber, formatDate } from '../utils';

interface HarvestsModuleProps {
  records: PondRecord[];
  harvests: HarvestRecord[];
  onAddHarvest: (harvest: HarvestRecord) => void;
  onEditHarvest: (harvest: HarvestRecord) => void;
  onDeleteHarvest: (id: string) => void;
}

const HarvestsModule: React.FC<HarvestsModuleProps> = ({
  records,
  harvests,
  onAddHarvest,
  onEditHarvest,
  onDeleteHarvest,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<HarvestRecord | null>(null);

  // Filter States
  const [granjaFilter, setGranjaFilter] = useState('');
  const [estanqueFilter, setEstanqueFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  // Form Fields State
  const [formGranja, setFormGranja] = useState('');
  const [formEstanque, setFormEstanque] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]);

  const [pre1Kilos, setPre1Kilos] = useState('');
  const [pre1Gramos, setPre1Gramos] = useState('');
  const [pre1Organismos, setPre1Organismos] = useState('');

  const [pre2Kilos, setPre2Kilos] = useState('');
  const [pre2Gramos, setPre2Gramos] = useState('');
  const [pre2Organismos, setPre2Organismos] = useState('');

  const [finalKilos, setFinalKilos] = useState('');
  const [finalGramos, setFinalGramos] = useState('');
  const [finalOrganismos, setFinalOrganismos] = useState('');

  // Extract unique options from existing production records for convenience
  const uniqueGranjas = useMemo(() => {
    const fromRecords = records.map(r => r.granja);
    const fromHarvests = harvests.map(h => h.granja);
    return Array.from(new Set([...fromRecords, ...fromHarvests])).filter(Boolean).sort();
  }, [records, harvests]);

  const uniqueEstanques = useMemo(() => {
    const fromRecords = records.map(r => r.estanque?.toString());
    const fromHarvests = harvests.map(h => h.estanque);
    return Array.from(new Set([...fromRecords, ...fromHarvests]))
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b));
  }, [records, harvests]);

  // Handle Automatic Calculations with Optional Overrides
  const calculatedPre1Org = useMemo(() => {
    const kilos = parseFloat(pre1Kilos) || 0;
    const grams = parseFloat(pre1Gramos) || 0;
    if (kilos > 0 && grams > 0) {
      return Math.round((kilos * 1000) / grams);
    }
    return 0;
  }, [pre1Kilos, pre1Gramos]);

  const calculatedPre2Org = useMemo(() => {
    const kilos = parseFloat(pre2Kilos) || 0;
    const grams = parseFloat(pre2Gramos) || 0;
    if (kilos > 0 && grams > 0) {
      return Math.round((kilos * 1000) / grams);
    }
    return 0;
  }, [pre2Kilos, pre2Gramos]);

  const calculatedFinalOrg = useMemo(() => {
    const kilos = parseFloat(finalKilos) || 0;
    const grams = parseFloat(finalGramos) || 0;
    if (kilos > 0 && grams > 0) {
      return Math.round((kilos * 1000) / grams);
    }
    return 0;
  }, [finalKilos, finalGramos]);

  // Set initial calculation values to inputs if they are calculated and inputs are empty or haven't been manually altered
  useEffect(() => {
    if (calculatedPre1Org > 0 && !pre1Organismos) {
      setPre1Organismos(calculatedPre1Org.toString());
    }
  }, [calculatedPre1Org, pre1Organismos]);

  useEffect(() => {
    if (calculatedPre2Org > 0 && !pre2Organismos) {
      setPre2Organismos(calculatedPre2Org.toString());
    }
  }, [calculatedPre2Org, pre2Organismos]);

  useEffect(() => {
    if (calculatedFinalOrg > 0 && !finalOrganismos) {
      setFinalOrganismos(calculatedFinalOrg.toString());
    }
  }, [calculatedFinalOrg, finalOrganismos]);

  // Dynamic preview of summary metrics
  const tempTotalKilos = useMemo(() => {
    return (parseFloat(pre1Kilos) || 0) + (parseFloat(pre2Kilos) || 0) + (parseFloat(finalKilos) || 0);
  }, [pre1Kilos, pre2Kilos, finalKilos]);

  const tempTotalOrganismos = useMemo(() => {
    return (parseInt(pre1Organismos) || calculatedPre1Org) + 
           (parseInt(pre2Organismos) || calculatedPre2Org) + 
           (parseInt(finalOrganismos) || calculatedFinalOrg);
  }, [pre1Organismos, pre2Organismos, finalOrganismos, calculatedPre1Org, calculatedPre2Org, calculatedFinalOrg]);

  // Filter & Search Logic
  const filteredHarvests = useMemo(() => {
    return harvests.filter(h => {
      const matchGranja = granjaFilter === '' || h.granja === granjaFilter;
      const matchEstanque = estanqueFilter === '' || h.estanque === estanqueFilter;
      return matchGranja && matchEstanque;
    });
  }, [harvests, granjaFilter, estanqueFilter]);

  // Pagination Logic
  useEffect(() => {
    setCurrentPage(1);
  }, [granjaFilter, estanqueFilter]);

  const totalPages = Math.ceil(filteredHarvests.length / recordsPerPage);

  const paginatedHarvests = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredHarvests.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredHarvests, currentPage]);

  // General KPI Stats for Summary Cards
  const kpiStats = useMemo(() => {
    let totKilos = 0;
    let totOrganismos = 0;
    let weightedGramsSum = 0;
    
    filteredHarvests.forEach(h => {
      totKilos += h.totalKilos;
      totOrganismos += h.totalOrganismos;
      
      // Calculate weighted grams if possible
      const p1K = h.pre1Kilos || 0;
      const p1G = h.pre1Gramos || 0;
      const p2K = h.pre2Kilos || 0;
      const p2G = h.pre2Gramos || 0;
      const fK = h.finalKilos || 0;
      const fG = h.finalGramos || 0;
      
      const weightedGrams = (p1K * p1G) + (p2K * p2G) + (fK * fG);
      weightedGramsSum += weightedGrams;
    });

    const avgWeight = totKilos > 0 ? (weightedGramsSum / totKilos) : 0;

    return {
      totalKilos: totKilos,
      totalOrganismos: totOrganismos,
      totalRegistros: filteredHarvests.length,
      pesoPromedio: avgWeight
    };
  }, [filteredHarvests]);

  // Populate form for editing
  const handleStartEdit = (harvest: HarvestRecord) => {
    setEditingHarvest(harvest);
    setFormGranja(harvest.granja);
    setFormEstanque(harvest.estanque);
    setFormFecha(harvest.fecha);

    setPre1Kilos(harvest.pre1Kilos ? harvest.pre1Kilos.toString() : '');
    setPre1Gramos(harvest.pre1Gramos ? harvest.pre1Gramos.toString() : '');
    setPre1Organismos(harvest.pre1Organismos ? harvest.pre1Organismos.toString() : '');

    setPre2Kilos(harvest.pre2Kilos ? harvest.pre2Kilos.toString() : '');
    setPre2Gramos(harvest.pre2Gramos ? harvest.pre2Gramos.toString() : '');
    setPre2Organismos(harvest.pre2Organismos ? harvest.pre2Organismos.toString() : '');

    setFinalKilos(harvest.finalKilos ? harvest.finalKilos.toString() : '');
    setFinalGramos(harvest.finalGramos ? harvest.finalGramos.toString() : '');
    setFinalOrganismos(harvest.finalOrganismos ? harvest.finalOrganismos.toString() : '');

    setShowForm(true);
  };

  const handleResetForm = () => {
    setEditingHarvest(null);
    setFormGranja('');
    setFormEstanque('');
    setFormFecha(new Date().toISOString().split('T')[0]);
    setPre1Kilos('');
    setPre1Gramos('');
    setPre1Organismos('');
    setPre2Kilos('');
    setPre2Gramos('');
    setPre2Organismos('');
    setFinalKilos('');
    setFinalGramos('');
    setFinalOrganismos('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGranja || !formEstanque || !formFecha) {
      alert('Por favor complete los campos de Granja, Estanque y Fecha.');
      return;
    }

    const calculatedP1Org = pre1Organismos ? parseInt(pre1Organismos) : calculatedPre1Org;
    const calculatedP2Org = pre2Organismos ? parseInt(pre2Organismos) : calculatedPre2Org;
    const calculatedFOrg = finalOrganismos ? parseInt(finalOrganismos) : calculatedFinalOrg;

    const totalK = (parseFloat(pre1Kilos) || 0) + (parseFloat(pre2Kilos) || 0) + (parseFloat(finalKilos) || 0);
    const totalO = calculatedP1Org + calculatedP2Org + calculatedFOrg;

    const harvestData: HarvestRecord = {
      id: editingHarvest ? editingHarvest.id : Math.random().toString(36).substring(2, 11),
      granja: formGranja,
      estanque: formEstanque,
      fecha: formFecha,
      
      pre1Kilos: pre1Kilos ? parseFloat(pre1Kilos) : undefined,
      pre1Gramos: pre1Gramos ? parseFloat(pre1Gramos) : undefined,
      pre1Organismos: pre1Organismos ? parseInt(pre1Organismos) : undefined,

      pre2Kilos: pre2Kilos ? parseFloat(pre2Kilos) : undefined,
      pre2Gramos: pre2Gramos ? parseFloat(pre2Gramos) : undefined,
      pre2Organismos: pre2Organismos ? parseInt(pre2Organismos) : undefined,

      finalKilos: finalKilos ? parseFloat(finalKilos) : undefined,
      finalGramos: finalGramos ? parseFloat(finalGramos) : undefined,
      finalOrganismos: finalOrganismos ? parseInt(finalOrganismos) : undefined,

      totalKilos: Number(totalK.toFixed(2)),
      totalOrganismos: totalO,
    };

    if (editingHarvest) {
      onEditHarvest(harvestData);
    } else {
      onAddHarvest(harvestData);
    }

    handleResetForm();
  };

  // Quick auto-fill formula triggerers
  const fillComputedPre1 = () => {
    if (calculatedPre1Org > 0) setPre1Organismos(calculatedPre1Org.toString());
  };
  const fillComputedPre2 = () => {
    if (calculatedPre2Org > 0) setPre2Organismos(calculatedPre2Org.toString());
  };
  const fillComputedFinal = () => {
    if (calculatedFinalOrg > 0) setFinalOrganismos(calculatedFinalOrg.toString());
  };

  return (
    <div className="space-y-6">
      
      {/* Main Action Header & Filter Panel */}
      <div className="flex flex-col gap-4 bg-[#0B4075] p-5 rounded-2xl border border-[#125699] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Ciclo de Cosechas</h2>
            <p className="text-sm text-blue-300">Registro detallado de pre-cosechas y cosecha final por granja y estanque.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select 
              value={granjaFilter} 
              onChange={(e) => setGranjaFilter(e.target.value)}
              className="bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todas las Granjas</option>
              {uniqueGranjas.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select 
              value={estanqueFilter} 
              onChange={(e) => setEstanqueFilter(e.target.value)}
              className="bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todos los Estanques</option>
              {uniqueEstanques.map(e => <option key={e} value={e}>Estanque {e}</option>)}
            </select>
            <button 
              onClick={() => { handleResetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Cosecha</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <div className="bg-[#0B4075] p-5 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3.5 rounded-xl bg-indigo-900/40 border border-indigo-700/40 mb-3 flex items-center justify-center">
            <Scale className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Total Kilos Cosechados</p>
          <p className="text-2xl font-extrabold text-white tracking-tight">{formatNumber(kpiStats.totalKilos)} kg</p>
        </div>

        <div className="bg-[#0B4075] p-5 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3.5 rounded-xl bg-blue-900/40 border border-blue-700/40 mb-3 flex items-center justify-center">
            <Hash className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Total Organismos</p>
          <p className="text-2xl font-extrabold text-white tracking-tight">{formatNumber(kpiStats.totalOrganismos)}</p>
        </div>

        <div className="bg-[#0B4075] p-5 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3.5 rounded-xl bg-orange-900/40 border border-orange-700/40 mb-3 flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-orange-400" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Peso Promedio de Venta</p>
          <p className="text-2xl font-extrabold text-white tracking-tight">{formatNumber(kpiStats.pesoPromedio)} g</p>
        </div>

        <div className="bg-[#0B4075] p-5 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/40 mb-3 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Cosechas Registradas</p>
          <p className="text-2xl font-extrabold text-white tracking-tight">{kpiStats.totalRegistros}</p>
        </div>
      </div>

      {/* Registration/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#0B4075] p-6 rounded-xl border border-[#1963ad] shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b border-[#125699] pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <span>⚖️</span> {editingHarvest ? 'Editar Cosecha Registrada' : 'Nuevo Registro de Cosecha'}
            </h3>
            <button type="button" onClick={handleResetForm} className="text-blue-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Info (Granja, Estanque, Fecha) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase mb-1.5">Granja *</label>
              <select
                value={formGranja}
                onChange={(e) => setFormGranja(e.target.value)}
                required
                className="w-full bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Seleccione Granja</option>
                {uniqueGranjas.map(g => <option key={g} value={g}>{g}</option>)}
                <option value="OTRA">-- Crear Nueva Granja --</option>
              </select>
              {formGranja === 'OTRA' && (
                <input
                  type="text"
                  placeholder="Nombre de la Granja"
                  onChange={(e) => setFormGranja(e.target.value)}
                  className="mt-2 w-full bg-[#0E4680] text-white border border-[#125699] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase mb-1.5">Estanque *</label>
              <select
                value={formEstanque}
                onChange={(e) => setFormEstanque(e.target.value)}
                required
                className="w-full bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Seleccione Estanque</option>
                {uniqueEstanques.map(e => <option key={e} value={e}>Estanque {e}</option>)}
                <option value="OTRO">-- Crear Nuevo Estanque --</option>
              </select>
              {formEstanque === 'OTRO' && (
                <input
                  type="text"
                  placeholder="Número de Estanque"
                  onChange={(e) => setFormEstanque(e.target.value)}
                  className="mt-2 w-full bg-[#0E4680] text-white border border-[#125699] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase mb-1.5">Fecha de Evento *</label>
              <input
                type="date"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
                required
                className="w-full bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Harvesting Stages (Divided into nice sections) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            
            {/* Stage 1: Pre-Cosecha 1 */}
            <div className="bg-[#0E4680] p-4 rounded-xl border border-[#125699] space-y-4">
              <h4 className="text-sm font-bold text-blue-300 border-b border-[#125699] pb-1.5">1ra Pre-Cosecha</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Kilos</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2380"
                    value={pre1Kilos}
                    onChange={(e) => setPre1Kilos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Gramos (Promedio)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14.7"
                    value={pre1Gramos}
                    onChange={(e) => setPre1Gramos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1 flex justify-between items-center">
                  <span>Organismos calculados</span>
                  {calculatedPre1Org > 0 && (
                    <button 
                      type="button" 
                      onClick={fillComputedPre1}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Copiar {calculatedPre1Org}
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Sustituir / introducir directo"
                  value={pre1Organismos}
                  onChange={(e) => setPre1Organismos(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Stage 2: Pre-Cosecha 2 */}
            <div className="bg-[#0E4680] p-4 rounded-xl border border-[#125699] space-y-4">
              <h4 className="text-sm font-bold text-blue-300 border-b border-[#125699] pb-1.5">2da Pre-Cosecha</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Kilos</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 756"
                    value={pre2Kilos}
                    onChange={(e) => setPre2Kilos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Gramos (Promedio)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 20.55"
                    value={pre2Gramos}
                    onChange={(e) => setPre2Gramos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1 flex justify-between items-center">
                  <span>Organismos calculados</span>
                  {calculatedPre2Org > 0 && (
                    <button 
                      type="button" 
                      onClick={fillComputedPre2}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Copiar {calculatedPre2Org}
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Sustituir / introducir directo"
                  value={pre2Organismos}
                  onChange={(e) => setPre2Organismos(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Stage 3: Cosecha Final */}
            <div className="bg-[#0E4680]/90 p-4 rounded-xl border border-[#1963ad] space-y-4 shadow-sm">
              <h4 className="text-sm font-bold text-indigo-300 border-b border-[#125699] pb-1.5 flex items-center gap-1.5">
                <span>🎯</span> Cosecha Final
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1 font-semibold">Peso Kilos</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 3600"
                    value={finalKilos}
                    onChange={(e) => setFinalKilos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1 font-semibold">Gramos (Prom.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 31.44"
                    value={finalGramos}
                    onChange={(e) => setFinalGramos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1 flex justify-between items-center">
                  <span>Organismos calculados</span>
                  {calculatedFinalOrg > 0 && (
                    <button 
                      type="button" 
                      onClick={fillComputedFinal}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Copiar {calculatedFinalOrg}
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Sustituir / introducir directo"
                  value={finalOrganismos}
                  onChange={(e) => setFinalOrganismos(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

          </div>

          {/* Form Real-Time Computed Review Panel */}
          <div className="bg-[#0A345C] p-4 rounded-xl border border-[#125699] flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div>
              <p className="text-xs font-semibold text-blue-300">Resumen Proyectado de Cosecha:</p>
              <p className="text-sm text-white mt-1">
                Kilos Totales: <span className="font-extrabold text-white text-base mr-4">{formatNumber(tempTotalKilos)} kg</span>
                Organismos Totales: <span className="font-extrabold text-indigo-300 text-base">{formatNumber(tempTotalOrganismos)} orgs.</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="bg-slate-700 hover:bg-slate-800 text-blue-100 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingHarvest ? 'Guardar Cambios' : 'Registrar'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Harvest records Table */}
      <div className="bg-[#0B4075] rounded-xl border border-[#125699] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#125699] text-white text-xs font-bold uppercase border-b border-[#0E4680] text-center">
                <th className="px-3 py-3 border-r border-[#1B5699] text-left">Acciones</th>
                <th className="px-3 py-3 border-r border-[#1B5699] text-left">Granja</th>
                <th className="px-2 py-3 border-r border-[#1B5699]">Estaque</th>
                <th className="px-3 py-3 border-r border-[#1B5699]">Fecha</th>
                
                {/* 1ra Pre-cosecha Headers */}
                <th className="px-2 py-3 border-r border-[#1B5699] bg-[#0E4680]/50 text-[10px]">1ra Pre-C (Kg)</th>
                <th className="px-2 py-3 border-r border-[#1B5699] bg-[#0E4680]/50 text-[10px]">1ra Pre-C (gr)</th>
                <th className="px-2 py-3 border-r border-[#1B5699] bg-[#0E4680]/50 text-[10px]">Orgs. 1ra Pre</th>
                
                {/* 2da Pre-cosecha Headers */}
                <th className="px-2 py-3 border-r border-[#1B5699] text-[10px]">2da Pre-C (Kg)</th>
                <th className="px-2 py-3 border-r border-[#1B5699] text-[10px]">2da Pre-C (gr)</th>
                <th className="px-2 py-3 border-r border-[#1B5699] text-[10px]">Orgs. 2da Pre</th>
                
                {/* Cosecha Final Headers */}
                <th className="px-2 py-3 border-r border-[#1B5699] bg-[#0E4680]/50 text-[10px]">Cosecha Final (Kg)</th>
                <th className="px-2 py-3 border-r border-[#1B5699] bg-[#0E4680]/50 text-[10px]">Cosecha Final (gr)</th>
                <th className="px-2 py-3 border-r border-[#1B5699] bg-[#0E4680]/50 text-[10px]">Orgs. Final</th>
                
                {/* Totales Headers */}
                <th className="px-3 py-3 border-r border-[#1B5699] bg-indigo-950/40 text-[11px] text-indigo-200">Kilos Totales</th>
                <th className="px-3 py-3 bg-indigo-950/40 text-[11px] text-indigo-200">Orgs. Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#125699]">
              {paginatedHarvests.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-10 text-center text-slate-400 italic">No hay registros de cosechas.</td>
                </tr>
              ) : (
                paginatedHarvests.map((h) => (
                  <tr key={h.id} className="hover:bg-[#0E4680] transition-colors text-center text-[11px] whitespace-nowrap text-blue-100">
                    <td className="px-3 py-3 border-r border-[#125699] text-left">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleStartEdit(h)}
                          className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
                          title="Editar Registro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('¿Está seguro de eliminar esta cosecha?')) {
                              onDeleteHarvest(h.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                          title="Eliminar Registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 border-r border-[#125699] text-left font-semibold text-slate-100">{h.granja}</td>
                    <td className="px-2 py-3 border-r border-[#125699] font-bold text-white">{h.estanque}</td>
                    <td className="px-3 py-3 border-r border-[#125699] text-blue-200">{formatDate(h.fecha)}</td>
                    
                    {/* 1ra Pre-cosecha Cells */}
                    <td className="px-2 py-3 border-r border-[#125699] bg-[#0E4680]/30">{h.pre1Kilos ? formatNumber(h.pre1Kilos) : '-'}</td>
                    <td className="px-2 py-3 border-r border-[#125699] bg-[#0E4680]/30">{h.pre1Gramos ? formatNumber(h.pre1Gramos) : '-'}</td>
                    <td className="px-2 py-3 border-r border-[#125699] bg-[#0E4680]/30 text-blue-300 font-mono">{h.pre1Organismos ? formatNumber(h.pre1Organismos) : '-'}</td>
                    
                    {/* 2da Pre-cosecha Cells */}
                    <td className="px-2 py-3 border-r border-[#125699]">{h.pre2Kilos ? formatNumber(h.pre2Kilos) : '-'}</td>
                    <td className="px-2 py-3 border-r border-[#125699]">{h.pre2Gramos ? formatNumber(h.pre2Gramos) : '-'}</td>
                    <td className="px-2 py-3 border-r border-[#125699] text-blue-300 font-mono">{h.pre2Organismos ? formatNumber(h.pre2Organismos) : '-'}</td>
                    
                    {/* Cosecha Final Cells */}
                    <td className="px-2 py-3 border-r border-[#125699] bg-[#0E4680]/30">{h.finalKilos ? formatNumber(h.finalKilos) : '-'}</td>
                    <td className="px-2 py-3 border-r border-[#125699] bg-[#0E4680]/30">{h.finalGramos ? formatNumber(h.finalGramos) : '-'}</td>
                    <td className="px-2 py-3 border-r border-[#125699] bg-[#0E4680]/30 text-blue-300 font-mono">{h.finalOrganismos ? formatNumber(h.finalOrganismos) : '-'}</td>
                    
                    {/* Totales Cells */}
                    <td className="px-3 py-3 border-r border-[#125699] font-bold text-white bg-indigo-950/20">{formatNumber(h.totalKilos)} kg</td>
                    <td className="px-3 py-3 font-bold text-indigo-300 bg-indigo-950/20 font-mono">{formatNumber(h.totalOrganismos)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#125699] px-4 py-3 bg-[#0B4075]">
            <div className="flex flex-1 justify-between sm:hidden w-full">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md bg-[#125699] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a6ebd] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative ml-2 inline-flex items-center rounded-md bg-[#125699] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a6ebd] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
              <div>
                <p className="text-xs text-blue-200">
                  Mostrando <span className="font-semibold text-white">{(currentPage - 1) * recordsPerPage + 1}</span> a{' '}
                  <span className="font-semibold text-white">
                    {Math.min(currentPage * recordsPerPage, filteredHarvests.length)}
                  </span>{' '}
                  de <span className="font-semibold text-white">{filteredHarvests.length}</span> cosechas
                </p>
              </div>
              
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm border border-[#125699] bg-[#0E4680]" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-1.5 text-blue-200 hover:bg-[#125699] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold focus:z-20 focus:outline-[#125699] ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white z-10'
                          : 'text-blue-200 hover:bg-[#125699]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-1.5 text-blue-200 hover:bg-[#125699] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default HarvestsModule;
