import React, { useMemo, useState } from 'react';
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
  Line,
  Legend
} from 'recharts';
import { PondRecord, HarvestRecord } from '../types';
import { formatNumber, calculatePondNetMetrics, normalizeEstanque } from '../utils';
import StatisticsTable from './StatisticsTable';
import { Scale, Fish, Layers, ArrowDownRight, Eye, CheckCircle2, Info, ChevronRight } from 'lucide-react';

interface Props {
  records: PondRecord[];
  allRecords?: PondRecord[];
  chartData?: any[];
  historicalChartData?: any[];
  uniqueEstanquesInHistory?: string[];
  lineColors?: string[];
  harvests?: HarvestRecord[];
  onSelectPond?: (pondId: any) => void;
}

const EstadisticasView: React.FC<Props> = ({ 
  records, 
  allRecords,
  chartData = [],
  historicalChartData = [],
  uniqueEstanquesInHistory = [],
  lineColors = ['#3b82f6', '#10b981', '#fb923c', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#eab308'],
  harvests = [],
  onSelectPond
}) => {
  const [chartView, setChartView] = useState<'actual' | 'tendencia'>('actual');
  const [biomasaChartMode, setBiomasaChartMode] = useState<'desglose' | 'total'>('desglose');
  const [extractionsFilter, setExtractionsFilter] = useState<'only_extracted' | 'all'>('only_extracted');
  
  const datasetForStats = allRecords && allRecords.length > 0 ? allRecords : records;

  // Compute net metrics for every pond record
  const netPondList = useMemo(() => {
    return records.map(r => {
      const net = calculatePondNetMetrics(r, harvests);
      return {
        record: r,
        net
      };
    });
  }, [records, harvests]);

  // Extraction balance aggregate
  const extractionSummary = useMemo(() => {
    const totalTeorica = records.reduce((s, r) => s + (Number(r.biomasaTotal) || 0), 0);
    const totalExtKilos = netPondList.reduce((s, item) => s + item.net.kilosExtraidos, 0);
    const totalExtOrg = netPondList.reduce((s, item) => s + item.net.organismosExtraidos, 0);
    const totalAguaBiomasa = netPondList.reduce((s, item) => s + item.net.biomasaEnAgua, 0);
    const totalTeoricaOrg = records.reduce((s, r) => s + (Number(r.densidadActual) || 0), 0);
    const totalAguaOrg = netPondList.reduce((s, item) => s + item.net.poblacionEnAgua, 0);
    const sumHas = records.reduce((s, r) => s + (Number(r.hectareas) || 0), 0);
    const biomasaHaAgua = sumHas > 0 ? (totalAguaBiomasa / sumHas) : 0;
    const camM2Agua = sumHas > 0 ? (totalAguaOrg / (sumHas * 10000)) : 0;
    const totalAlimentoAjustado = netPondList.reduce((s, item) => s + item.net.alimentoProyectadoDiaAjustado, 0);
    const totalAlimentoTeorico = records.reduce((s, r) => s + (Number(r.alimentoProyectadoDia) || 0), 0);
    const pondsWithExtractions = netPondList.filter(item => item.net.tieneExtracciones);

    // Alimento acumulado total y FCA global sin precosecha vs poscosecha
    const totalAlimentoAcumulado = records.reduce((s, r) => s + (Number(r.alimentoAcumulado) || 0), 0);
    const fcaSinPrecosecha = totalTeorica > 0 ? (totalAlimentoAcumulado / totalTeorica) : 0;
    const fcaEnAgua = totalAguaBiomasa > 0 ? (totalAlimentoAcumulado / totalAguaBiomasa) : fcaSinPrecosecha;
    const totalBiomasaGenerada = totalAguaBiomasa + totalExtKilos;
    const fcaPoscosecha = totalBiomasaGenerada > 0 ? (totalAlimentoAcumulado / totalBiomasaGenerada) : fcaSinPrecosecha;

    return {
      totalTeorica,
      totalExtKilos,
      totalExtOrg,
      totalAguaBiomasa,
      totalTeoricaOrg,
      totalAguaOrg,
      biomasaHaAgua,
      camM2Agua,
      totalAlimentoAjustado,
      totalAlimentoTeorico,
      totalAlimentoAcumulado,
      fcaSinPrecosecha,
      fcaEnAgua,
      fcaPoscosecha,
      hasExtractions: totalExtKilos > 0 || totalExtOrg > 0,
      pondsWithExtractionsCount: pondsWithExtractions.length,
      pctExtraido: totalTeorica > 0 ? Number(((totalExtKilos / totalTeorica) * 100).toFixed(1)) : 0,
      pctRestante: totalTeorica > 0 ? Number(((totalAguaBiomasa / totalTeorica) * 100).toFixed(1)) : 100,
    };
  }, [records, netPondList]);

  const stats = useMemo(() => {
    if (records.length === 0) return null;

    const count = records.length;
    const sumHas = records.reduce((s, r) => s + (Number(r.hectareas) || 0), 0);
    const avgPesoAnterior = records.reduce((s, r) => s + (Number(r.pesoAnterior) || 0), 0) / count;
    const avgPesoActual = records.reduce((s, r) => s + (Number(r.pesoActual) || 0), 0) / count;
    const avgIncSemanal = records.reduce((s, r) => s + (Number(r.incrementoSemanal) || 0), 0) / count;
    const avgDiasCultivo = records.reduce((s, r) => s + (Number(r.diasCultivo) && !isNaN(Number(r.diasCultivo)) ? Number(r.diasCultivo) : 0), 0) / count;
    const avgSobrevivencia = records.reduce((s, r) => s + (Number(r.sobrevivencia) || 0), 0) / count;
    const sumDensidadInicial = records.reduce((s, r) => s + (Number(r.organismosSembrados) || Number(r.densidadInicial) || 0), 0);
    const sumDensidadActual = records.reduce((s, r) => s + (Number(r.densidadActual) || 0), 0);
    const sumBiomasaTotal = records.reduce((s, r) => s + (Number(r.biomasaTotal) || 0), 0);
    const biomasaHa = sumHas > 0 ? (sumBiomasaTotal / sumHas) : 0;
    const sumAlimentoSemanal = records.reduce((s, r) => s + (Number(r.alimentoSemanal) || 0), 0);
    const sumAlimentoAcum = records.reduce((s, r) => s + (Number(r.alimentoAcumulado) || 0), 0);
    const fca = sumBiomasaTotal > 0 ? (sumAlimentoAcum / sumBiomasaTotal) : 0;
    const camM2Inicial = sumHas > 0 ? (sumDensidadInicial / (sumHas * 10000)) : 0;
    const camM2Actual = sumHas > 0 ? (sumDensidadActual / (sumHas * 10000)) : 0;

    return {
      estanque: "PROMEDIO",
      has: sumHas,
      pesoAnterior: avgPesoAnterior,
      pesoActual: avgPesoActual,
      incSemanal: avgIncSemanal,
      diasCultivo: avgDiasCultivo,
      sobrevivencia: avgSobrevivencia,
      densidadInicial: sumDensidadInicial,
      densidadActual: sumDensidadActual,
      biomasaHa: biomasaHa,
      biomasaTotal: sumBiomasaTotal,
      alimentoSemanal: sumAlimentoSemanal,
      alimentoAcum: sumAlimentoAcum,
      fca: fca,
      camM2Inicial: camM2Inicial,
      camM2Actual: camM2Actual
    };
  }, [records]);

  // Enriched chart data for the current view
  const enrichedChartData = useMemo(() => {
    return chartData.map(item => {
      const matchingNet = netPondList.find(n => 
        normalizeEstanque(n.record.estanque) === normalizeEstanque(item.estanque)
      );
      if (matchingNet) {
        return {
          ...item,
          biomasaEnAgua: matchingNet.net.biomasaEnAgua,
          kilosExtraidos: matchingNet.net.kilosExtraidos,
          organismosExtraidos: matchingNet.net.organismosExtraidos,
          poblacionEnAgua: matchingNet.net.poblacionEnAgua,
          camM2EnAgua: matchingNet.net.camM2EnAgua,
          alimentoProyectadoDiaAjustado: matchingNet.net.alimentoProyectadoDiaAjustado,
          tieneExtracciones: matchingNet.net.tieneExtracciones
        };
      }
      return {
        ...item,
        biomasaEnAgua: Number(item.biomasaTotal) || 0,
        kilosExtraidos: 0,
        organismosExtraidos: 0,
        poblacionEnAgua: Number(item.densidadActual) || 0,
        camM2EnAgua: Number(item.camM2Actual) || 0,
        alimentoProyectadoDiaAjustado: Number(item.alimentoProyectadoDia) || 0,
        tieneExtracciones: false
      };
    });
  }, [chartData, netPondList]);

  const displayExtractionPonds = useMemo(() => {
    if (extractionsFilter === 'only_extracted') {
      return netPondList.filter(item => item.net.tieneExtracciones);
    }
    return netPondList;
  }, [netPondList, extractionsFilter]);

  return (
    <div className="space-y-8">
      
      {/* Resumen Consolidado */}
      <div id="dashboard-stats" className="bg-[#0B4075] rounded-xl shadow-sm border border-[#125699] overflow-hidden">
        <div className="bg-[#072C52] px-4 py-3 border-b border-[#125699] flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-emerald-400 text-sm">Resumen Consolidado (Promedios y Totales)</h3>
            {extractionSummary.hasExtractions && (
              <span className="text-xs bg-orange-950/70 border border-orange-500/50 text-orange-300 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" />
                {extractionSummary.pondsWithExtractionsCount} estanques con raleos activos
              </span>
            )}
          </div>
          {extractionSummary.hasExtractions && (
            <div className="text-xs text-blue-200">
              Biomasa Neta en Agua: <strong className="text-emerald-400 font-bold">{formatNumber(extractionSummary.totalAguaBiomasa)} kg</strong> ({extractionSummary.pctRestante}%)
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-4 p-4">
          {stats ? (
            <>
              {/* Producción y Crecimiento */}
              <div className="overflow-x-auto rounded-lg border border-[#125699]">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#0E4680] text-emerald-300 font-semibold whitespace-nowrap text-center">
                      <th colSpan={7} className="px-3 py-2 border-b border-[#125699] text-sm uppercase tracking-wider">Producción y Crecimiento</th>
                    </tr>
                    <tr className="bg-[#0E4680] text-white font-semibold whitespace-nowrap text-center">
                      <th className="px-3 py-2 border-r border-[#125699]">PROMEDIO ESTANQUE</th>
                      <th className="px-3 py-2 border-r border-[#125699]">HAS</th>
                      <th className="px-3 py-2 border-r border-[#125699]">DÍAS CULT.</th>
                      <th className="px-3 py-2 border-r border-[#125699]">PESO ANT.</th>
                      <th className="px-3 py-2 border-r border-[#125699]">PESO ACT.</th>
                      <th className="px-3 py-2 border-r border-[#125699]">INCREM. SEM.</th>
                      <th className="px-3 py-2">% SOBREV.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#072C52] text-white font-bold whitespace-nowrap text-center">
                      <td className="px-3 py-3 border-r border-[#125699]">{stats.estanque}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.has)}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.diasCultivo)}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.pesoAnterior)}</td>
                      <td className="px-3 py-3 border-r border-[#125699] text-emerald-400">{formatNumber(stats.pesoActual)}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.incSemanal)}</td>
                      <td className="px-3 py-3 text-emerald-400">{formatNumber(stats.sobrevivencia)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Densidad, Biomasa y Alimentación */}
              <div className="overflow-x-auto rounded-lg border border-[#125699]">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#0E4680] text-emerald-300 font-semibold whitespace-nowrap text-center">
                      <th colSpan={9} className="px-3 py-2 border-b border-[#125699] text-sm uppercase tracking-wider">Densidad, Biomasa y Alimentación (Teórica)</th>
                    </tr>
                    <tr className="bg-[#0E4680] text-white font-semibold whitespace-nowrap text-center">
                      <th className="px-3 py-2 border-r border-[#125699]">DENS. INICIAL</th>
                      <th className="px-3 py-2 border-r border-[#125699]">DENS. ACTUAL</th>
                      <th className="px-3 py-2 border-r border-[#125699]">Cam/m2 INIC.</th>
                      <th className="px-3 py-2 border-r border-[#125699]">CAM ACT.</th>
                      <th className="px-3 py-2 border-r border-[#125699]">BIOMASA HA.</th>
                      <th className="px-3 py-2 border-r border-[#125699]">BIOMASA TOTAL</th>
                      <th className="px-3 py-2 border-r border-[#125699]">ALIM. SEMANAL</th>
                      <th className="px-3 py-2 border-r border-[#125699]">ALIM. ACUMULADO</th>
                      <th className="px-3 py-2">F.C.A</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#072C52] text-white font-bold whitespace-nowrap text-center">
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.densidadInicial)}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.densidadActual)}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.camM2Inicial)}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.camM2Actual)}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.biomasaHa)}</td>
                      <td className="px-3 py-3 border-r border-[#125699] text-emerald-400">{formatNumber(stats.biomasaTotal)}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.alimentoSemanal)}</td>
                      <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.alimentoAcum)}</td>
                      <td className="px-3 py-3 text-emerald-400">{formatNumber(stats.fca)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dynamic Biomass Balance Table (Adjusted by Pre-harvests) */}
              {extractionSummary.hasExtractions && (
                <div className="overflow-x-auto rounded-lg border border-orange-500/40 shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gradient-to-r from-orange-950/80 via-[#0E4680] to-cyan-950/80 text-orange-300 font-semibold whitespace-nowrap text-center">
                        <th colSpan={10} className="px-3 py-2 border-b border-[#125699] text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                          <Scale className="w-4 h-4 text-orange-400" />
                          Balance Dinámico de Biomasa, Población y FCA (Descuento por Pre-Cosechas)
                        </th>
                      </tr>
                      <tr className="bg-[#093561] text-white font-semibold whitespace-nowrap text-center">
                        <th className="px-3 py-2 border-r border-[#125699] text-blue-300">BIOMASA TEÓRICA</th>
                        <th className="px-3 py-2 border-r border-[#125699] text-orange-400">TOTAL PRE-COSECHADO</th>
                        <th className="px-3 py-2 border-r border-[#125699] text-emerald-300 bg-emerald-950/40">BIOMASA ACTIVA EN AGUA</th>
                        <th className="px-3 py-2 border-r border-[#125699] text-emerald-300">RENDIMIENTO EN AGUA</th>
                        <th className="px-3 py-2 border-r border-[#125699] text-blue-300">POBLACIÓN TEÓRICA</th>
                        <th className="px-3 py-2 border-r border-[#125699] text-orange-400">ORG. EXTRAÍDOS</th>
                        <th className="px-3 py-2 border-r border-[#125699] text-cyan-300 bg-cyan-950/40">POBLACIÓN EN AGUA (CAM/M²)</th>
                        <th className="px-3 py-2 border-r border-[#125699] text-amber-300">ALIMENTO DÍA AJUSTADO</th>
                        <th className="px-3 py-2 border-r border-[#125699] text-amber-300" title="FCA calculado sobre el muestreo teórico sin incorporar pre-cosechas">FCA S/ PRE-COSECHA</th>
                        <th className="px-3 py-2 text-emerald-300 bg-emerald-950/40" title="FCA real global incorporando los kilos extraídos de camarón">FCA POSCOSECHA (REAL)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-[#06223f] text-white font-bold whitespace-nowrap text-center">
                        <td className="px-3 py-3 border-r border-[#125699] text-slate-300">
                          {formatNumber(extractionSummary.totalTeorica)} kg
                        </td>
                        <td className="px-3 py-3 border-r border-[#125699] text-orange-400 bg-orange-950/20">
                          -{formatNumber(extractionSummary.totalExtKilos)} kg <span className="text-[10px] font-normal text-orange-300">({extractionSummary.pctExtraido}%)</span>
                        </td>
                        <td className="px-3 py-3 border-r border-[#125699] text-emerald-400 bg-emerald-950/30 text-sm font-black">
                          {formatNumber(extractionSummary.totalAguaBiomasa)} kg <span className="text-[10px] font-normal text-emerald-300">({extractionSummary.pctRestante}%)</span>
                        </td>
                        <td className="px-3 py-3 border-r border-[#125699] text-emerald-300">
                          {formatNumber(extractionSummary.biomasaHaAgua)} kg/ha
                        </td>
                        <td className="px-3 py-3 border-r border-[#125699] text-slate-300">
                          {formatNumber(extractionSummary.totalTeoricaOrg)} orgs
                        </td>
                        <td className="px-3 py-3 border-r border-[#125699] text-orange-400 bg-orange-950/20">
                          -{formatNumber(extractionSummary.totalExtOrg)} orgs
                        </td>
                        <td className="px-3 py-3 border-r border-[#125699] text-cyan-300 bg-cyan-950/30 font-bold">
                          {formatNumber(extractionSummary.totalAguaOrg)} <span className="text-xs text-cyan-400 font-semibold">({formatNumber(extractionSummary.camM2Agua)} cam/m²)</span>
                        </td>
                        <td className="px-3 py-3 border-r border-[#125699] text-amber-300 font-bold">
                          {formatNumber(extractionSummary.totalAlimentoAjustado)} kg/día
                        </td>
                        <td className="px-3 py-3 border-r border-[#125699] text-amber-300 font-bold">
                          {formatNumber(extractionSummary.fcaSinPrecosecha)}
                        </td>
                        <td className="px-3 py-3 text-emerald-400 bg-emerald-950/30 font-black text-sm">
                          {formatNumber(extractionSummary.fcaPoscosecha)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-slate-500 italic bg-[#0B4075] rounded-lg">
              No hay datos para mostrar
            </div>
          )}
        </div>
      </div>
      
      {/* Statistical Analysis Table */}
      <StatisticsTable records={datasetForStats} harvests={harvests} />

      {/* Production Charts Section */}
      <div className="flex flex-col items-start gap-3 mb-4 mt-8">
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Gráficos de Producción</h2>
            <p className="text-xs text-blue-300">Comparativa por estanque y tendencias temporales.</p>
          </div>
          <div className="flex bg-[#0B4075] rounded-lg p-1 border border-[#125699]">
            <button 
              onClick={() => setChartView('actual')} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${chartView === 'actual' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}`}
            >
              Último por Estanque
            </button>
            <button 
              onClick={() => setChartView('tendencia')} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${chartView === 'tendencia' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}`}
            >
              Tendencia Histórica
            </button>
          </div>
        </div>
      </div>

      <div id="charts-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Peso Actual */}
        <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-blue-400">⚖️</span> Peso Actual (g)
          </h2>
          <div className="flex-1 min-h-0">
            {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'actual' ? (
                  <BarChart data={enrichedChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} g`, 'Peso']} labelFormatter={(label) => `Estanque ${label}`} />
                    <Bar dataKey="pesoActual" radius={[4, 4, 0, 0]}>
                      {enrichedChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pesoActual > 6 ? '#2563eb' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={historicalChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number, name: string) => [`${formatNumber(value)} g`, name.replace('_peso', '')]} labelFormatter={(label) => `Fecha: ${label}`} />
                    {uniqueEstanquesInHistory.map((est, idx) => (
                      <Line key={est} type="monotone" dataKey={`${est}_peso`} name={`${est}_peso`} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={{ fill: lineColors[idx % lineColors.length], strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
          </div>
        </div>
        
        {/* Incremento Semanal */}
        <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-indigo-400">📈</span> Incremento Semanal (g)
          </h2>
          <div className="flex-1 min-h-0">
            {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'actual' ? (
                  <BarChart data={enrichedChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`+${formatNumber(value)} g`, 'Incremento']} labelFormatter={(label) => `Estanque ${label}`} />
                    <Bar dataKey="incrementoSemanal" radius={[4, 4, 0, 0]}>
                      {enrichedChartData.map((entry, index) => (
                        <Cell key={`cell-inc-${index}`} fill={entry.incrementoSemanal > 1.2 ? '#6366f1' : '#818cf8'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={historicalChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number, name: string) => [`+${formatNumber(value)} g`, name.replace('_inc', '')]} labelFormatter={(label) => `Fecha: ${label}`} />
                    {uniqueEstanquesInHistory.map((est, idx) => (
                      <Line key={est} type="monotone" dataKey={`${est}_inc`} name={`${est}_inc`} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={{ fill: lineColors[idx % lineColors.length], strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
          </div>
        </div>

        {/* Supervivencia */}
        <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-400">🛡️</span> Supervivencia (%)
          </h2>
          <div className="flex-1 min-h-0">
            {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'actual' ? (
                  <BarChart data={enrichedChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)}%`, 'Supervivencia']} labelFormatter={(label) => `Estanque ${label}`} />
                    <Bar dataKey="sobrevivencia" radius={[4, 4, 0, 0]}>
                      {enrichedChartData.map((entry, index) => (
                        <Cell key={`cell-surv-${index}`} fill={entry.sobrevivencia > 75 ? '#10b981' : entry.sobrevivencia > 50 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={historicalChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number, name: string) => [`${formatNumber(value)}%`, name.replace('_surv', '')]} labelFormatter={(label) => `Fecha: ${label}`} />
                    {uniqueEstanquesInHistory.map((est, idx) => (
                      <Line key={est} type="monotone" dataKey={`${est}_surv`} name={`${est}_surv`} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={{ fill: lineColors[idx % lineColors.length], strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
          </div>
        </div>

        {/* Biomasa Total (con toggle de desglose en agua vs cosechado) */}
        <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-orange-400">🦐</span> Biomasa por Estanque (kg)
            </h2>
            {chartView === 'actual' && extractionSummary.hasExtractions && (
              <div className="flex bg-[#072C52] rounded-md p-0.5 border border-[#125699] text-[10px]">
                <button
                  type="button"
                  onClick={() => setBiomasaChartMode('desglose')}
                  className={`px-2 py-1 rounded transition-colors ${biomasaChartMode === 'desglose' ? 'bg-cyan-600 text-white font-bold' : 'text-blue-300 hover:text-white'}`}
                >
                  Desglose (Agua + Pre)
                </button>
                <button
                  type="button"
                  onClick={() => setBiomasaChartMode('total')}
                  className={`px-2 py-1 rounded transition-colors ${biomasaChartMode === 'total' ? 'bg-cyan-600 text-white font-bold' : 'text-blue-300 hover:text-white'}`}
                >
                  Total Teórico
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-h-0">
            {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'actual' ? (
                  biomasaChartMode === 'desglose' && extractionSummary.hasExtractions ? (
                    <BarChart data={enrichedChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                      <XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                      <Tooltip 
                        cursor={{fill: '#0F4C8A'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#093661', color: '#fff' }}
                        formatter={(val: number, name: string) => [`${formatNumber(val)} kg`, name]}
                        labelFormatter={(label) => `Estanque ${label}`}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                      <Bar dataKey="biomasaEnAgua" name="Biomasa en Agua" stackId="biomass" fill="#0284c7" />
                      <Bar dataKey="kilosExtraidos" name="Pre-cosechado (Extraído)" stackId="biomass" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={enrichedChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                      <XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                      <Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} kg`, 'Biomasa']} labelFormatter={(label) => `Estanque ${label}`} />
                      <Bar dataKey="biomasaTotal" radius={[4, 4, 0, 0]} fill="#fb923c" />
                    </BarChart>
                  )
                ) : (
                  <LineChart data={historicalChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number, name: string) => [`${formatNumber(value)} kg`, name.replace('_biomasa', '')]} labelFormatter={(label) => `Fecha: ${label}`} />
                    {uniqueEstanquesInHistory.map((est, idx) => (
                      <Line key={est} type="monotone" dataKey={`${est}_biomasa`} name={`${est}_biomasa`} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={{ fill: lineColors[idx % lineColors.length], strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
          </div>
        </div>

      </div>

      {/* Flujo de Extracciones y Balance de Biomasa por Estanque */}
      {extractionSummary.hasExtractions && (
        <div className="bg-[#0B4075] rounded-xl border border-[#125699] shadow-sm overflow-hidden mt-8">
          <div className="bg-[#072C52] px-6 py-4 border-b border-[#125699] flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-400" />
                Flujo de Extracciones y Balance de Biomasa por Estanque
              </h3>
              <p className="text-xs text-blue-300 mt-0.5">
                Seguimiento de raleos, kilos extraídos y ajuste automático de masa y densidad viva.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-[#0B4075] rounded-lg p-1 border border-[#125699] text-xs">
                <button
                  type="button"
                  onClick={() => setExtractionsFilter('only_extracted')}
                  className={`px-3 py-1 rounded transition-colors ${extractionsFilter === 'only_extracted' ? 'bg-orange-600 text-white font-bold' : 'text-blue-200 hover:text-white'}`}
                >
                  Solo con Pre-Cosechas ({extractionSummary.pondsWithExtractionsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setExtractionsFilter('all')}
                  className={`px-3 py-1 rounded transition-colors ${extractionsFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-blue-200 hover:text-white'}`}
                >
                  Todos los Estanques ({records.length})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead className="bg-[#093561] text-blue-200 text-[10px] uppercase font-extrabold border-b border-[#125699]">
                <tr>
                  <th className="px-3 py-3 border-r border-[#125699] text-left">Estanque / Granja</th>
                  <th className="px-2 py-3 border-r border-[#125699]">Has</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-blue-300">Biomasa Teórica</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-left">Flujo de Extracciones (Pre-cosechas)</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-orange-400">Total Extraído</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-emerald-300 bg-emerald-950/20">Biomasa en Agua</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-cyan-300">Población en Agua</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-amber-300">Alim. Día Ajustado</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-emerald-300 bg-emerald-950/20" title="FCA Real Global con Pre-Cosechas vs Teórico inicial">FCA Poscosecha</th>
                  <th className="px-3 py-3 border-r border-[#125699] min-w-[130px]">Balance Visual</th>
                  <th className="px-2 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#125699]/60">
                {displayExtractionPonds.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                      No hay estanques que coincidan con el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  displayExtractionPonds.map((item) => {
                    const r = item.record;
                    const net = item.net;
                    return (
                      <tr key={r.id} className="hover:bg-[#0E4680]/60 transition-colors text-slate-200">
                        <td className="px-3 py-3 border-r border-[#125699] text-left font-bold text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>Estanque {r.estanque}</span>
                            {r.granja && (
                              <span className="text-[10px] font-normal text-blue-300 bg-blue-900/40 px-1.5 py-0.5 rounded border border-blue-600/30">
                                {r.granja}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-3 border-r border-[#125699] text-slate-300">
                          {r.hectareas}
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] font-medium text-slate-200 whitespace-nowrap">
                          {formatNumber(net.biomasaTeorica)} kg
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] text-left">
                          {net.stages.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">Sin pre-cosechas registradas</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {net.stages.map((stg, sIdx) => (
                                <span 
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-[#072C52] border border-blue-500/40 text-blue-100 font-medium"
                                  title={`${stg.etapa} - Fecha: ${stg.fecha || 'S/F'} - Kilos: ${formatNumber(stg.kilos)} kg - Gramos: ${formatNumber(stg.gramos)}g - Organismos: ${formatNumber(stg.organismos)} - FCA Acum: ${stg.fcaEtapa !== undefined && stg.fcaEtapa > 0 ? stg.fcaEtapa.toFixed(3) : '-'}`}
                                >
                                  <span className="text-orange-400 font-bold">{stg.etapa.replace('Pre-Cosecha ', 'P')}:</span>
                                  <span>{formatNumber(stg.kilos)} kg</span>
                                  {stg.gramos > 0 && <span className="text-emerald-400">({stg.gramos}g)</span>}
                                  {stg.fcaEtapa !== undefined && stg.fcaEtapa > 0 && (
                                    <span className="text-amber-300 font-bold border-l border-blue-400/40 pl-1">
                                      FCA {stg.fcaEtapa.toFixed(2)}
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] font-bold text-orange-400 whitespace-nowrap">
                          {net.kilosExtraidos > 0 ? (
                            <div>
                              <span>-{formatNumber(net.kilosExtraidos)} kg</span>
                              <p className="text-[10px] text-orange-300/80 font-normal">
                                -{formatNumber(net.organismosExtraidos)} orgs
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">0 kg</span>
                          )}
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] font-black text-emerald-400 bg-emerald-950/20 whitespace-nowrap">
                          <div>
                            <span className="text-sm">{formatNumber(net.biomasaEnAgua)} kg</span>
                            <p className="text-[10px] text-emerald-300/80 font-normal">
                              {formatNumber(net.biomasaHaEnAgua)} kg/ha ({net.porcentajeRestanteBiomasa}%)
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] text-cyan-300 whitespace-nowrap font-medium">
                          <div>
                            <span>{formatNumber(net.poblacionEnAgua)} orgs</span>
                            <p className="text-[10px] text-cyan-400/90 font-bold">
                              {formatNumber(net.camM2EnAgua)} cam/m²
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] font-bold text-amber-300 whitespace-nowrap">
                          <div>
                            <span>{formatNumber(net.alimentoProyectadoDiaAjustado)} kg/d</span>
                            {net.tieneExtracciones && r.alimentoProyectadoDia > 0 && (
                              <p className="text-[10px] text-slate-400 line-through">
                                {formatNumber(r.alimentoProyectadoDia)} kg/d
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] text-center whitespace-nowrap bg-emerald-950/10">
                          <div>
                            <span className="text-xs font-black text-emerald-400" title="FCA Real Global con Pre-Cosechas">
                              {net.fcaAjustado > 0 ? net.fcaAjustado.toFixed(2) : '-'}
                            </span>
                            {net.tieneExtracciones && net.fcaSinPrecosecha > 0 && (
                              <p className="text-[10px] text-amber-300/80 font-medium" title="FCA Teórico sin pre-cosechas">
                                S/Pre: {net.fcaSinPrecosecha.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] align-middle">
                          <div className="w-full bg-[#072C52] rounded-full h-2.5 overflow-hidden flex border border-[#125699]/60">
                            <div 
                              className="bg-emerald-500 h-full transition-all" 
                              style={{ width: `${Math.min(100, Math.max(0, net.porcentajeRestanteBiomasa))}%` }}
                              title={`En Agua: ${net.porcentajeRestanteBiomasa}%`}
                            />
                            <div 
                              className="bg-orange-500 h-full transition-all" 
                              style={{ width: `${Math.min(100, Math.max(0, net.porcentajeExtraidoBiomasa))}%` }}
                              title={`Extraído: ${net.porcentajeExtraidoBiomasa}%`}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                            <span className="text-emerald-400">{net.porcentajeRestanteBiomasa}% agua</span>
                            <span className="text-orange-400">{net.porcentajeExtraidoBiomasa}% raleo</span>
                          </div>
                        </td>

                        <td className="px-2 py-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => onSelectPond && onSelectPond(r.estanque)}
                            className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-white bg-blue-900/40 hover:bg-blue-800/80 px-2.5 py-1 rounded border border-blue-600/40 transition-colors"
                            title="Ver Historial y Curva de Crecimiento del Estanque"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default EstadisticasView;
