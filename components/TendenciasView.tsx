import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { PondRecord, HarvestRecord } from '../types';
import { formatNumber, cleanDateString, normalizeEstanque, calculatePondNetMetrics } from '../utils';
import { 
  TrendingUp, 
  Scale, 
  ShieldCheck, 
  Flame, 
  Layers, 
  Calendar, 
  Filter, 
  Sparkles,
  ArrowUpRight,
  Fish,
  Activity,
  ChevronRight
} from 'lucide-react';

interface TendenciasViewProps {
  records: PondRecord[];
  allRecords?: PondRecord[];
  harvests?: HarvestRecord[];
}

export const TendenciasView: React.FC<TendenciasViewProps> = ({
  records = [],
  allRecords = [],
  harvests = []
}) => {
  // Filters
  const [selectedGranja, setSelectedGranja] = useState<string>('all');
  const [selectedEstanque, setSelectedEstanque] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'temporal' | 'estanques'>('temporal');

  // Base raw records for full historical depth
  const dataset = useMemo(() => {
    return allRecords && allRecords.length > 0 ? allRecords : records;
  }, [allRecords, records]);

  // Unique granjas for filtering
  const uniqueGranjas = useMemo(() => {
    const set = new Set<string>();
    dataset.forEach(r => {
      if (r.granja && r.granja.trim()) set.add(r.granja.trim());
    });
    return Array.from(set).sort();
  }, [dataset]);

  // Unique estanques for filtering
  const uniqueEstanques = useMemo(() => {
    const set = new Set<string>();
    dataset.forEach(r => {
      if (selectedGranja === 'all' || r.granja?.toLowerCase().trim() === selectedGranja.toLowerCase().trim()) {
        const norm = normalizeEstanque(r.estanque);
        if (norm) set.add(norm);
      }
    });
    return Array.from(set).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [dataset, selectedGranja]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return dataset.filter(r => {
      const matchGranja = selectedGranja === 'all' || r.granja?.toLowerCase().trim() === selectedGranja.toLowerCase().trim();
      const matchEstanque = selectedEstanque === 'all' || normalizeEstanque(r.estanque) === selectedEstanque;
      return matchGranja && matchEstanque;
    });
  }, [dataset, selectedGranja, selectedEstanque]);

  // Net metrics mapped per record
  const enrichedRecords = useMemo(() => {
    return filteredData.map(r => {
      const net = calculatePondNetMetrics(r, harvests);
      return {
        record: r,
        net
      };
    });
  }, [filteredData, harvests]);

  // 1. DATASET TEMPORAL (Agrupado por Fecha para ver la evolución de la tendencia a lo largo del tiempo)
  const temporalTrendData = useMemo(() => {
    const dateMap = new Map<string, {
      fechaRaw: string;
      fechaLabel: string;
      count: number;
      sumIncremento: number;
      sumSobrevivencia: number;
      sumAlimentoDia: number;
      sumAlimentoAcum: number;
      sumFca: number;
      sumBiomasaAgua: number;
      sumPreKilos: number;
      sumBiomasaTotal: number;
    }>();

    enrichedRecords.forEach(({ record, net }) => {
      let dateStr = cleanDateString(record.fecha) || cleanDateString(record.fechaSiembra);
      if (!dateStr) dateStr = 'Sin Fecha';

      if (!dateMap.has(dateStr)) {
        let label = dateStr;
        try {
          const parts = dateStr.split('-').map(Number);
          if (parts.length === 3) {
            const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
            label = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', timeZone: 'UTC' });
          }
        } catch {
          label = dateStr;
        }

        dateMap.set(dateStr, {
          fechaRaw: dateStr,
          fechaLabel: label,
          count: 0,
          sumIncremento: 0,
          sumSobrevivencia: 0,
          sumAlimentoDia: 0,
          sumAlimentoAcum: 0,
          sumFca: 0,
          sumBiomasaAgua: 0,
          sumPreKilos: 0,
          sumBiomasaTotal: 0
        });
      }

      const item = dateMap.get(dateStr)!;
      item.count += 1;
      item.sumIncremento += Number(record.incrementoSemanal) || 0;
      item.sumSobrevivencia += Number(record.sobrevivencia) || 0;
      item.sumAlimentoDia += (net.alimentoProyectadoDiaAjustado > 0 ? net.alimentoProyectadoDiaAjustado : Number(record.alimentoProyectadoDia) || 0);
      item.sumAlimentoAcum += Number(record.alimentoAcumulado) || 0;
      item.sumFca += (net.fcaPoscosecha > 0 ? net.fcaPoscosecha : Number(record.fca) || 0);
      item.sumBiomasaAgua += (net.biomasaEnAgua > 0 ? net.biomasaEnAgua : Number(record.biomasaTotal) || 0);
      item.sumPreKilos += net.kilosExtraidos || 0;
      item.sumBiomasaTotal += (net.biomasaTotal > 0 ? net.biomasaTotal : Number(record.biomasaTotal) || 0);
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.fechaRaw.localeCompare(b.fechaRaw))
      .map(d => ({
        label: d.fechaLabel,
        fechaRaw: d.fechaRaw,
        incrementoSemanal: d.count > 0 ? Number((d.sumIncremento / d.count).toFixed(2)) : 0,
        sobrevivencia: d.count > 0 ? Number((d.sumSobrevivencia / d.count).toFixed(1)) : 0,
        alimentoDia: Math.round(d.sumAlimentoDia),
        alimentoAcumulado: Math.round(d.sumAlimentoAcum),
        fca: d.count > 0 ? Number((d.sumFca / d.count).toFixed(2)) : 0,
        biomasaAgua: Math.round(d.sumBiomasaAgua),
        precosechaExtraida: Math.round(d.sumPreKilos),
        biomasaTotal: Math.round(d.sumBiomasaTotal)
      }));
  }, [enrichedRecords]);

  // 2. DATASET POR ESTANQUE (Último muestreo activo de cada estanque para comparar la curva entre estanques)
  const pondTrendData = useMemo(() => {
    // Tomar el registro más reciente por cada estanque
    const latestByPond = new Map<string, { record: PondRecord; net: any }>();

    enrichedRecords.forEach(item => {
      const pondKey = `${item.record.granja || ''}_${normalizeEstanque(item.record.estanque)}`;
      const existing = latestByPond.get(pondKey);
      if (!existing) {
        latestByPond.set(pondKey, item);
      } else {
        const dateA = cleanDateString(existing.record.fecha);
        const dateB = cleanDateString(item.record.fecha);
        if (dateB >= dateA) {
          latestByPond.set(pondKey, item);
        }
      }
    });

    const items = Array.from(latestByPond.values());
    items.sort((a, b) => {
      const numA = Number(normalizeEstanque(a.record.estanque));
      const numB = Number(normalizeEstanque(b.record.estanque));
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a.record.estanque).localeCompare(String(b.record.estanque), undefined, { numeric: true });
    });

    return items.map(({ record, net }) => {
      const estLabel = `E-${normalizeEstanque(record.estanque)}`;
      const inc = Number(record.incrementoSemanal) || 0;
      const surv = Number(record.sobrevivencia) || 0;
      const alimDia = net.alimentoProyectadoDiaAjustado > 0 ? net.alimentoProyectadoDiaAjustado : Number(record.alimentoProyectadoDia) || 0;
      const alimAcum = Number(record.alimentoAcumulado) || 0;
      const fcaVal = net.fcaPoscosecha > 0 ? net.fcaPoscosecha : Number(record.fca) || 0;
      const bioAgua = net.biomasaEnAgua > 0 ? net.biomasaEnAgua : Number(record.biomasaTotal) || 0;
      const preKilos = net.kilosExtraidos || 0;
      const bioTotal = net.biomasaTotal > 0 ? net.biomasaTotal : Number(record.biomasaTotal) || 0;

      return {
        label: estLabel,
        estanque: record.estanque,
        granja: record.granja,
        incrementoSemanal: Number(inc.toFixed(2)),
        sobrevivencia: Number(surv.toFixed(1)),
        alimentoDia: Math.round(alimDia),
        alimentoAcumulado: Math.round(alimAcum),
        fca: Number(fcaVal.toFixed(2)),
        biomasaAgua: Math.round(bioAgua),
        precosechaExtraida: Math.round(preKilos),
        biomasaTotal: Math.round(bioTotal)
      };
    });
  }, [enrichedRecords]);

  // Active chart data based on view mode
  const activeChartData = viewMode === 'temporal' ? temporalTrendData : pondTrendData;

  // Executive summary values
  const summary = useMemo(() => {
    if (activeChartData.length === 0) return null;
    const avgInc = activeChartData.reduce((s, i) => s + i.incrementoSemanal, 0) / activeChartData.length;
    const avgSurv = activeChartData.reduce((s, i) => s + i.sobrevivencia, 0) / activeChartData.length;
    const totalAlimDia = activeChartData.reduce((s, i) => s + i.alimentoDia, 0);
    const avgFca = activeChartData.reduce((s, i) => s + i.fca, 0) / activeChartData.length;
    const totalPreKilos = activeChartData.reduce((s, i) => s + i.precosechaExtraida, 0);
    const totalBioTotal = activeChartData.reduce((s, i) => s + i.biomasaTotal, 0);

    return {
      avgInc: avgInc.toFixed(2),
      avgSurv: avgSurv.toFixed(1),
      totalAlimDia: Math.round(totalAlimDia),
      avgFca: avgFca.toFixed(2),
      totalPreKilos: Math.round(totalPreKilos),
      totalBioTotal: Math.round(totalBioTotal)
    };
  }, [activeChartData]);

  return (
    <div className="space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="bg-[#0B4075] rounded-xl border border-[#125699] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Tendencias de Producción y Pre-cosecha
                </h2>
                <p className="text-xs text-blue-200">
                  Curvas de cambio continuo en ganancia de peso, sobrevivencia, raciones de alimento, FCA y balance de pre-cosechas.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Filters & Mode Selector */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* View Mode Toggle */}
            <div className="flex bg-[#072C52] rounded-lg p-1 border border-[#125699] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('temporal')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'temporal' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-blue-300 hover:text-white'
                }`}
              >
                Evolución Histórica (Fechas)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('estanques')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'estanques' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-blue-300 hover:text-white'
                }`}
              >
                Curva por Estanques
              </button>
            </div>

            {/* Granja Filter */}
            {uniqueGranjas.length > 1 && (
              <div className="flex items-center gap-1.5 bg-[#072C52] border border-[#125699] rounded-lg px-2.5 py-1 text-xs text-white">
                <span className="text-blue-300 font-medium">Granja:</span>
                <select
                  value={selectedGranja}
                  onChange={(e) => {
                    setSelectedGranja(e.target.value);
                    setSelectedEstanque('all');
                  }}
                  aria-label="Filtrar por granja"
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#072C52] text-white">Todas las Granjas</option>
                  {uniqueGranjas.map(g => (
                    <option key={g} value={g} className="bg-[#072C52] text-white">{g}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Estanque Filter */}
            {viewMode === 'temporal' && uniqueEstanques.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#072C52] border border-[#125699] rounded-lg px-2.5 py-1 text-xs text-white">
                <span className="text-blue-300 font-medium">Estanque:</span>
                <select
                  value={selectedEstanque}
                  onChange={(e) => setSelectedEstanque(e.target.value)}
                  aria-label="Filtrar por estanque"
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#072C52] text-white">Todos</option>
                  {uniqueEstanques.map(est => (
                    <option key={est} value={est} className="bg-[#072C52] text-white">E-{est}</option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </div>

        {/* Executive KPI Highlights Bar */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-[#125699]/70">
            
            {/* KPI 1: Ganancia Semanal */}
            <div className="bg-[#072C52]/90 border border-indigo-500/30 rounded-lg p-2.5">
              <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block truncate">
                Ganancia Promedio
              </span>
              <p className="text-sm sm:text-base font-bold text-indigo-400 mt-0.5 truncate">
                +{summary.avgInc} <span className="text-[10px] font-normal text-indigo-200">g/sem</span>
              </p>
              <span className="text-[10px] text-slate-400 truncate block">velocidad de crecimiento</span>
            </div>

            {/* KPI 2: Sobrevivencia */}
            <div className="bg-[#072C52]/90 border border-emerald-500/30 rounded-lg p-2.5">
              <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider block truncate">
                Sobrevivencia Media
              </span>
              <p className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5 truncate">
                {summary.avgSurv} <span className="text-[10px] font-normal text-emerald-200">%</span>
              </p>
              <span className="text-[10px] text-slate-400 truncate block">viabilidad poblacional</span>
            </div>

            {/* KPI 3: Alimento Diario */}
            <div className="bg-[#072C52]/90 border border-amber-500/30 rounded-lg p-2.5">
              <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider block truncate">
                Alimento Diario
              </span>
              <p className="text-sm sm:text-base font-bold text-amber-300 mt-0.5 truncate">
                {formatNumber(summary.totalAlimDia)} <span className="text-[10px] font-normal text-amber-200">kg/d</span>
              </p>
              <span className="text-[10px] text-slate-400 truncate block">ración en curso</span>
            </div>

            {/* KPI 4: FCA */}
            <div className="bg-[#072C52]/90 border border-cyan-500/30 rounded-lg p-2.5">
              <span className="text-[10px] text-cyan-300 uppercase font-bold tracking-wider block truncate">
                FCA Promedio
              </span>
              <p className="text-sm sm:text-base font-bold text-cyan-300 mt-0.5 truncate">
                {summary.avgFca}
              </p>
              <span className="text-[10px] text-slate-400 truncate block">conversión ciclo</span>
            </div>

            {/* KPI 5: Pre-cosechas */}
            <div className="bg-[#072C52]/90 border border-orange-500/30 rounded-lg p-2.5 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-orange-300 uppercase font-bold tracking-wider block truncate">
                Pre-cosechas Extraídas
              </span>
              <p className="text-sm sm:text-base font-bold text-orange-400 mt-0.5 truncate">
                +{formatNumber(summary.totalPreKilos)} <span className="text-[10px] font-normal text-orange-200">kg</span>
              </p>
              <span className="text-[10px] text-slate-400 truncate block">raleo acumulado</span>
            </div>

          </div>
        )}
      </div>

      {/* Grid of 5 Line Charts Requested by User */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ========================================================
            1. GRÁFICO DE LÍNEAS: GANANCIA DE PESO SEMANAL
           ======================================================== */}
        <div className="bg-[#0B4075] p-5 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[360px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ganancia de Peso Semanal</h3>
                <p className="text-[11px] text-blue-200">Incremento registrado en gramos por semana (g/sem)</p>
              </div>
            </div>
            <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-semibold">
              Meta óptima &gt; 1.20 g
            </span>
          </div>

          <div className="flex-1 min-h-0">
            {activeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    unit="g"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #125699', 
                      backgroundColor: '#072C52', 
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val: number) => [`+${formatNumber(val, 2)} g/semana`, 'Ganancia Semanal']}
                    labelFormatter={(label) => `${viewMode === 'temporal' ? 'Fecha' : 'Estanque'}: ${label}`}
                  />
                  <ReferenceLine y={1.2} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: '1.20g meta', fill: '#38bdf8', fontSize: 10, position: 'right' }} />
                  <Line 
                    type="monotone" 
                    dataKey="incrementoSemanal" 
                    name="Ganancia Semanal (g)" 
                    stroke="#818cf8" 
                    strokeWidth={3} 
                    dot={{ fill: '#818cf8', r: 4, strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Sin datos disponibles para graficar
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            2. GRÁFICO DE LÍNEAS: % DE SOBREVIVENCIA
           ======================================================== */}
        <div className="bg-[#0B4075] p-5 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[360px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">% de Sobrevivencia</h3>
                <p className="text-[11px] text-blue-200">Evolución de la viabilidad biológica en cultivo (%)</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-semibold">
              Rango 0 - 100%
            </span>
          </div>

          <div className="flex-1 min-h-0">
            {activeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #125699', 
                      backgroundColor: '#072C52', 
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val: number) => [`${formatNumber(val, 1)}%`, 'Sobrevivencia']}
                    labelFormatter={(label) => `${viewMode === 'temporal' ? 'Fecha' : 'Estanque'}: ${label}`}
                  />
                  <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" label={{ value: '70% esperado', fill: '#10b981', fontSize: 10, position: 'right' }} />
                  <Line 
                    type="monotone" 
                    dataKey="sobrevivencia" 
                    name="Sobrevivencia (%)" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#059669' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Sin datos disponibles para graficar
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            3. GRÁFICO DE LÍNEAS: TENDENCIA DE ALIMENTO
           ======================================================== */}
        <div className="bg-[#0B4075] p-5 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[360px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Tendencia de Alimento</h3>
                <p className="text-[11px] text-blue-200">Consumo y calibración de ración diaria y acumulada</p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-semibold">
              Alimento Diario (kg/d)
            </span>
          </div>

          <div className="flex-1 min-h-0">
            {activeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    unit="kg"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #125699', 
                      backgroundColor: '#072C52', 
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val: number, name: string) => [`${formatNumber(val)} kg`, name]}
                    labelFormatter={(label) => `${viewMode === 'temporal' ? 'Fecha' : 'Estanque'}: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="alimentoDia" 
                    name="Alimento Diario (kg/día)" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    dot={{ fill: '#f59e0b', r: 4, strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#d97706' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Sin datos disponibles para graficar
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            4. GRÁFICO DE LÍNEAS: FCA (FACTOR DE CONVERSIÓN)
           ======================================================== */}
        <div className="bg-[#0B4075] p-5 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[360px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Factor de Conversión Alimenticia (FCA)</h3>
                <p className="text-[11px] text-blue-200">Eficiencia biomasa generada por kilo de balanceado</p>
              </div>
            </div>
            <span className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-semibold">
              Rango meta 1.20 - 1.50
            </span>
          </div>

          <div className="flex-1 min-h-0">
            {activeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #125699', 
                      backgroundColor: '#072C52', 
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val: number) => [`${formatNumber(val, 2)}`, 'FCA']}
                    labelFormatter={(label) => `${viewMode === 'temporal' ? 'Fecha' : 'Estanque'}: ${label}`}
                  />
                  <ReferenceLine y={1.4} stroke="#06b6d4" strokeDasharray="4 4" label={{ value: '1.40 referencia', fill: '#06b6d4', fontSize: 10, position: 'right' }} />
                  <Line 
                    type="monotone" 
                    dataKey="fca" 
                    name="FCA Postcosecha" 
                    stroke="#06b6d4" 
                    strokeWidth={3} 
                    dot={{ fill: '#06b6d4', r: 4, strokeWidth: 1, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#0891b2' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Sin datos disponibles para graficar
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================
          5. GRÁFICO DESTACADO: PRECOSECHAS
             (Biomasa de Estanque vs Pre-cosecha Extraída)
         ======================================================== */}
      <div className="bg-[#0B4075] p-5 rounded-xl border border-orange-500/40 shadow-sm flex flex-col h-[400px]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Pre-cosechas: Biomasa de Estanque vs Pre-cosecha Extraída
                <span className="text-[11px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/40 font-semibold">
                  Balance Zootécnico
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Comparativa visual en líneas: Camarón activo nadando en agua vs. kilos extraídos por raleos y biomasa total.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-sky-300">
              <span className="w-3 h-1 bg-sky-400 rounded"></span>
              <span>En Agua (kg)</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-400 font-bold">
              <span className="w-3 h-1 bg-orange-500 rounded"></span>
              <span>Pre-cosecha Extraída (kg)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-1 bg-emerald-400 rounded"></span>
              <span>Biomasa Total (kg)</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {activeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeChartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  unit=" kg"
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #125699', 
                    backgroundColor: '#072C52', 
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(val: number, name: string) => [`${formatNumber(val)} kg`, name]}
                  labelFormatter={(label) => `${viewMode === 'temporal' ? 'Fecha' : 'Estanque'}: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line 
                  type="monotone" 
                  dataKey="biomasaAgua" 
                  name="Biomasa en Agua" 
                  stroke="#38bdf8" 
                  strokeWidth={3} 
                  dot={{ fill: '#38bdf8', r: 4, strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#0284c7' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="precosechaExtraida" 
                  name="Pre-cosecha Extraída" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  dot={{ fill: '#f97316', r: 4, strokeWidth: 1, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#ea580c' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="biomasaTotal" 
                  name="Biomasa Total Generada" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ fill: '#10b981', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
              Sin datos de biomasa o pre-cosechas para graficar
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TendenciasView;
