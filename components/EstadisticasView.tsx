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
import { 
  Scale, 
  Fish, 
  Layers, 
  ArrowDownRight, 
  Eye, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  TrendingDown,
  Activity,
  Calendar,
  Sparkles,
  TrendingUp,
  Wheat,
  Percent
} from 'lucide-react';

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
    const totalExtKilos = netPondList.reduce((s, item) => s + item.net.kilosExtraidos, 0);
    const totalExtOrg = netPondList.reduce((s, item) => s + item.net.organismosExtraidos, 0);
    const totalAguaBiomasa = netPondList.reduce((s, item) => s + item.net.biomasaEnAgua, 0);
    const totalBiomasaTotal = netPondList.reduce((s, item) => s + item.net.biomasaTotal, 0);
    const totalBiomasaGenerada = totalBiomasaTotal > 0 ? totalBiomasaTotal : (totalAguaBiomasa + totalExtKilos);
    const totalTeorica = totalBiomasaGenerada;
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
    
    // FCA Sin Pre-cosecha (en agua): evaluado únicamente contra la biomasa remanente viva en agua
    const fcaSinPrecosecha = totalAguaBiomasa > 0 
      ? Number((totalAlimentoAcumulado / totalAguaBiomasa).toFixed(3)) 
      : 0;

    // FCA Poscosecha (con Biomasa Total producida = agua + precosechas):
    const fcaPoscosecha = totalBiomasaGenerada > 0 
      ? Number((totalAlimentoAcumulado / totalBiomasaGenerada).toFixed(3)) 
      : 0;

    const diferenciaFca = Number((fcaSinPrecosecha - fcaPoscosecha).toFixed(3));

    return {
      totalTeorica,
      totalBiomasaTotal: totalBiomasaGenerada,
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
      fcaEnAgua: fcaSinPrecosecha,
      fcaPoscosecha,
      diferenciaFca,
      hasExtractions: totalExtKilos > 0 || totalExtOrg > 0,
      pondsWithExtractionsCount: pondsWithExtractions.length,
      pctExtraido: totalBiomasaGenerada > 0 ? Number(((totalExtKilos / totalBiomasaGenerada) * 100).toFixed(1)) : 0,
      pctRestante: totalBiomasaGenerada > 0 ? Number(((totalAguaBiomasa / totalBiomasaGenerada) * 100).toFixed(1)) : 100,
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
      
      {/* Dashboard Ejecutivo: Resumen Estadístico y Resumen de Pre-cosechas */}
      <div id="dashboard-stats" className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* BLOQUE 1: RESUMEN ESTADÍSTICO (Ciclo General) */}
        <div className="bg-[#0B4075] rounded-xl shadow-sm border border-[#125699] overflow-hidden flex flex-col">
          <div className="bg-[#072C52] px-5 py-3.5 border-b border-[#125699] flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm tracking-wide">Resumen Estadístico</h3>
                <p className="text-[11px] text-blue-200">Consolidado general del ciclo zootécnico</p>
              </div>
            </div>
            <span className="text-xs bg-[#093561] border border-[#125699] text-blue-200 px-2.5 py-1 rounded-full font-semibold">
              {records.length} Estanques
            </span>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            {stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                
                {/* 1. Hectáreas */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-blue-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider truncate">Hectáreas</span>
                  <p className="text-sm sm:text-base font-bold text-white mt-1 truncate" title={`${formatNumber(stats.has, 2)} ha`}>
                    {formatNumber(stats.has, 2)} <span className="text-[10px] font-normal text-blue-200">ha</span>
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">has cultivadas</span>
                </div>

                {/* 2. Días de Cultivo */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-blue-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider truncate">Días Cultivo</span>
                  <p className="text-sm sm:text-base font-bold text-white mt-1 truncate">
                    {formatNumber(Math.round(stats.diasCultivo))} <span className="text-[10px] font-normal text-blue-200">días</span>
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">promedio</span>
                </div>

                {/* 3. Peso Promedio del Ciclo */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-emerald-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider truncate">Peso Promedio</span>
                  <p className="text-sm sm:text-base font-bold text-emerald-400 mt-1 truncate">
                    {stats.pesoActual.toFixed(2)} <span className="text-[10px] font-normal text-emerald-300">g</span>
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">biometría ciclo</span>
                </div>

                {/* 4. % de Sobrevivencia */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-emerald-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider truncate">% Sobrevivencia</span>
                  <p className="text-sm sm:text-base font-bold text-emerald-400 mt-1 truncate">
                    {stats.sobrevivencia.toFixed(1)} <span className="text-[10px] font-normal text-emerald-300">%</span>
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">estimada</span>
                </div>

                {/* 5. Densidad Inicial */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-blue-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider truncate">Densidad Inicial</span>
                  <p className="text-sm sm:text-base font-bold text-white mt-1 truncate" title={formatNumber(stats.densidadInicial)}>
                    {formatNumber(stats.densidadInicial)}
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">orgs sembrados</span>
                </div>

                {/* 6. Densidad Final */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-cyan-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-cyan-300 uppercase font-bold tracking-wider truncate">Densidad Final</span>
                  <p className="text-sm sm:text-base font-bold text-cyan-300 mt-1 truncate" title={formatNumber(extractionSummary.totalAguaOrg > 0 ? extractionSummary.totalAguaOrg : stats.densidadActual)}>
                    {formatNumber(extractionSummary.totalAguaOrg > 0 ? extractionSummary.totalAguaOrg : stats.densidadActual)}
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">orgs en agua</span>
                </div>

                {/* 7. Camarones m2 Finales */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-cyan-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-cyan-300 uppercase font-bold tracking-wider truncate">Cam/m² Finales</span>
                  <p className="text-sm sm:text-base font-bold text-cyan-300 mt-1 truncate">
                    {formatNumber(extractionSummary.camM2Agua > 0 ? extractionSummary.camM2Agua : stats.camM2Actual, 1)} <span className="text-[10px] font-normal text-cyan-200">cam/m²</span>
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">remanente agua</span>
                </div>

                {/* 8. Biomasa Total */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-blue-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider truncate">Biomasa Total</span>
                  <p className="text-sm sm:text-base font-bold text-white mt-1 truncate" title={`${formatNumber(extractionSummary.totalBiomasaTotal > 0 ? extractionSummary.totalBiomasaTotal : stats.biomasaTotal)} kg`}>
                    {formatNumber(extractionSummary.totalBiomasaTotal > 0 ? extractionSummary.totalBiomasaTotal : stats.biomasaTotal)} <span className="text-[10px] font-normal text-blue-200">kg</span>
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">ciclo completo</span>
                </div>

                {/* 9. Alimento Acumulado */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-amber-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider truncate">Alim. Acumulado</span>
                  <p className="text-sm sm:text-base font-bold text-amber-300 mt-1 truncate" title={`${formatNumber(stats.alimentoAcum || extractionSummary.totalAlimentoAcumulado)} kg`}>
                    {formatNumber(stats.alimentoAcum || extractionSummary.totalAlimentoAcumulado)} <span className="text-[10px] font-normal text-amber-200">kg</span>
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">balanceado total</span>
                </div>

                {/* 10. FCA */}
                <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 hover:border-emerald-400/50 transition-colors flex flex-col justify-between min-w-0">
                  <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider truncate">F.C.A</span>
                  <p className="text-sm sm:text-base font-bold text-emerald-400 mt-1 truncate">
                    {(extractionSummary.fcaPoscosecha > 0 ? extractionSummary.fcaPoscosecha : stats.fca).toFixed(2)}
                  </p>
                  <span className="text-[10px] text-slate-400 truncate">conversión ciclo</span>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 italic">No hay datos para mostrar</div>
            )}

            {/* Resumen rápido tabular */}
            {stats && (
              <div className="mt-3.5 pt-2.5 border-t border-[#125699]/60 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Rendimiento Teórico Inicial:</span>
                  <strong className="text-white">{formatNumber(stats.biomasaHa, 2)} kg/ha</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Alimento Semanal:</span>
                  <strong className="text-amber-300">{formatNumber(stats.alimentoSemanal)} kg</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Crecimiento Semanal:</span>
                  <strong className="text-emerald-400">+{formatNumber(stats.incSemanal, 2)} g/sem</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BLOQUE 2: RESUMEN DE PRE-COSECHAS (Precosecha) */}
        <div className="bg-[#0B4075] rounded-xl shadow-sm border border-orange-500/40 overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-[#072C52] via-[#093561] to-[#1a233a] px-5 py-3.5 border-b border-[#125699] flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-orange-300 text-sm tracking-wide">Resumen de Pre-cosechas</h3>
                <p className="text-[11px] text-blue-200">Impacto zootécnico del raleo y remanente en agua</p>
              </div>
            </div>
            {extractionSummary.hasExtractions ? (
              <span className="text-xs bg-orange-950/80 border border-orange-500/60 text-orange-300 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {extractionSummary.pondsWithExtractionsCount} Estanques Raleados
              </span>
            ) : (
              <span className="text-xs bg-[#072C52] border border-[#125699] text-slate-400 px-2.5 py-1 rounded-full font-medium">
                Sin Raleos Registrados
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            {/* Las 7 métricas de pre-cosecha solicitadas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              
              {/* 1. Kg Pre-cosechados */}
              <div className="bg-orange-950/25 border border-orange-500/40 rounded-lg p-2.5 flex flex-col justify-between min-w-0">
                <span className="text-[10px] text-orange-300 uppercase font-bold tracking-wider truncate">Kg Pre-cosechados</span>
                <p className="text-sm sm:text-base font-bold text-orange-400 mt-1 truncate" title={`+${formatNumber(extractionSummary.totalExtKilos)} kg`}>
                  +{formatNumber(extractionSummary.totalExtKilos)} <span className="text-[10px] font-normal text-orange-300">kg</span>
                </p>
                <span className="text-[10px] text-orange-300/80 truncate">
                  {extractionSummary.pctExtraido}% de biomasa
                </span>
              </div>

              {/* 2. Biomasa Total */}
              <div className="bg-[#072C52]/80 border border-[#125699] rounded-lg p-2.5 flex flex-col justify-between min-w-0">
                <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider truncate">Biomasa Total</span>
                <p className="text-sm sm:text-base font-bold text-white mt-1 truncate" title={`${formatNumber(extractionSummary.totalBiomasaTotal)} kg`}>
                  {formatNumber(extractionSummary.totalBiomasaTotal)} <span className="text-[10px] font-normal text-blue-200">kg</span>
                </p>
                <span className="text-[10px] text-slate-400 truncate">agua + pre-cosecha</span>
              </div>

              {/* 3. Rendimiento Agua */}
              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-lg p-2.5 flex flex-col justify-between min-w-0">
                <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider truncate">Rendimiento Agua</span>
                <p className="text-sm sm:text-base font-bold text-emerald-400 mt-1 truncate">
                  {formatNumber(extractionSummary.biomasaHaAgua)} <span className="text-[10px] font-normal text-emerald-300">kg/ha</span>
                </p>
                <span className="text-[10px] text-emerald-300/80 truncate">
                  {formatNumber(extractionSummary.totalAguaBiomasa)} kg vivos
                </span>
              </div>

              {/* 4. Alimento Ajustado por Día */}
              <div className="bg-amber-950/20 border border-amber-500/40 rounded-lg p-2.5 flex flex-col justify-between min-w-0">
                <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider truncate">Alim. Ajustado/Día</span>
                <p className="text-sm sm:text-base font-bold text-amber-300 mt-1 truncate">
                  {formatNumber(extractionSummary.totalAlimentoAjustado)} <span className="text-[10px] font-normal text-amber-200">kg/d</span>
                </p>
                <span className="text-[10px] text-amber-300/80 truncate">recalibrado</span>
              </div>

              {/* 5. FCA sin Pre-cosecha */}
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg p-2.5 flex flex-col justify-between min-w-0">
                <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider truncate">FCA s/ Pre-cosecha</span>
                <p className="text-sm sm:text-base font-bold text-amber-300 mt-1 truncate">
                  {extractionSummary.fcaSinPrecosecha > 0 ? extractionSummary.fcaSinPrecosecha.toFixed(2) : '-'}
                </p>
                <span className="text-[10px] text-slate-400 truncate">solo agua</span>
              </div>

              {/* 6. FCA Postcosecha */}
              <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-lg p-2.5 flex flex-col justify-between min-w-0">
                <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider truncate">FCA Postcosecha</span>
                <p className="text-sm sm:text-base font-bold text-emerald-400 mt-1 truncate">
                  {extractionSummary.fcaPoscosecha > 0 ? extractionSummary.fcaPoscosecha.toFixed(2) : '-'}
                </p>
                <span className="text-[10px] text-emerald-300/80 truncate">biomasa total</span>
              </div>

              {/* 7. Diferencia */}
              <div className="bg-cyan-950/30 border border-cyan-500/50 rounded-lg p-2.5 col-span-2 flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-300 uppercase font-bold tracking-wider truncate">Diferencia FCA</span>
                  {extractionSummary.diferenciaFca > 0 && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      Ahorro
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base font-bold text-cyan-300 mt-1 truncate">
                  {extractionSummary.diferenciaFca > 0 ? (
                    <span>-{extractionSummary.diferenciaFca.toFixed(2)} pts</span>
                  ) : (
                    <span className="text-slate-400">0.00 pts</span>
                  )}
                </p>
                <span className="text-[10px] text-slate-300 truncate">
                  {extractionSummary.diferenciaFca > 0 
                    ? `Recuperado por ${formatNumber(extractionSummary.totalExtKilos)} kg raleados`
                    : 'Sin raleos registrados'}
                </span>
              </div>

            </div>

            {/* Barra de Distribución Visual de Biomasa */}
            <div className="mt-3.5 pt-2.5 border-t border-[#125699]/60">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-emerald-300 flex items-center gap-1 truncate text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0"></span>
                  En Agua: <strong>{formatNumber(extractionSummary.totalAguaBiomasa)} kg ({extractionSummary.pctRestante}%)</strong>
                </span>
                <span className="text-orange-400 flex items-center gap-1 truncate text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block shrink-0"></span>
                  Pre-cosecha: <strong>+{formatNumber(extractionSummary.totalExtKilos)} kg ({extractionSummary.pctExtraido}%)</strong>
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#072C52] rounded-full overflow-hidden flex border border-[#125699]">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, extractionSummary.pctRestante))}%` }}
                  title={`En agua: ${extractionSummary.pctRestante}%`}
                />
                <div 
                  className="bg-orange-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, extractionSummary.pctExtraido))}%` }}
                  title={`Pre-cosechado: ${extractionSummary.pctExtraido}%`}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

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
                  <th className="px-3 py-3 border-r border-[#125699] text-emerald-300 bg-emerald-950/20">Biomasa Actual (Agua)</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-orange-400">Pre-cosechas</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-blue-300">Biomasa Total</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-cyan-300">Población en Agua</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-amber-300">Alim. Día Ajustado</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-amber-300" title="FCA evaluado únicamente sobre la biomasa remanente en agua (Alimento / Biomasa en Agua)">FCA s/ Pre-cosecha</th>
                  <th className="px-3 py-3 border-r border-[#125699] text-emerald-300 bg-emerald-950/20" title="FCA real global incorporando la Biomasa Total producida (Alimento / Biomasa Total)">FCA Poscosecha</th>
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

                        <td className="px-3 py-3 border-r border-[#125699] font-black text-emerald-400 bg-emerald-950/20 whitespace-nowrap">
                          <div>
                            <span className="text-sm">{formatNumber(net.biomasaEnAgua)} kg</span>
                            <p className="text-[10px] text-emerald-300/80 font-normal">
                              {formatNumber(net.biomasaHaEnAgua)} kg/ha ({net.porcentajeRestanteBiomasa}%)
                            </p>
                          </div>
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] text-left">
                          {net.kilosExtraidos > 0 ? (
                            <div>
                              <div className="flex items-center gap-1 font-bold text-orange-400">
                                <span>+{formatNumber(net.kilosExtraidos)} kg</span>
                                <span className="text-[10px] text-orange-300/80 font-normal">
                                  ({net.porcentajeExtraidoBiomasa}%)
                                </span>
                              </div>
                              {net.stages.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {net.stages.map((stg, sIdx) => (
                                    <span 
                                      key={sIdx}
                                      className="inline-flex items-center text-[9px] px-1.5 py-0.2 bg-[#072C52] border border-orange-500/40 text-orange-200 rounded"
                                      title={`${stg.etapa} - ${formatNumber(stg.kilos)} kg (${stg.gramos}g)`}
                                    >
                                      P{sIdx + 1}: {formatNumber(stg.kilos)}kg
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Sin precosechas</span>
                          )}
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] font-bold text-slate-100 whitespace-nowrap">
                          <div>
                            <span>{formatNumber(net.biomasaTotal)} kg</span>
                            <p className="text-[10px] text-slate-400 font-normal">
                              {formatNumber(net.biomasaHa)} kg/ha total
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

                        <td className="px-3 py-3 border-r border-[#125699] text-center whitespace-nowrap bg-amber-950/10">
                          <div>
                            <span className="text-xs font-bold text-amber-300" title="FCA sin considerar pre-cosechas (Alimento / Biomasa en Agua)">
                              {net.fcaSinPrecosecha > 0 ? net.fcaSinPrecosecha.toFixed(2) : '-'}
                            </span>
                            <p className="text-[9px] text-slate-400">Solo en agua</p>
                          </div>
                        </td>

                        <td className="px-3 py-3 border-r border-[#125699] text-center whitespace-nowrap bg-emerald-950/20">
                          <div>
                            <span className="text-xs font-black text-emerald-400" title="FCA Poscosecha con Biomasa Total Producida">
                              {net.fcaPoscosecha > 0 ? net.fcaPoscosecha.toFixed(2) : '-'}
                            </span>
                            {net.diferenciaFca > 0 && (
                              <p className="text-[9px] text-emerald-300/90 font-bold">
                                -{net.diferenciaFca.toFixed(2)} pts
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
