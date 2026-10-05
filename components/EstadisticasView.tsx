import React, { useMemo } from 'react';
import { PondRecord, HarvestRecord } from '../types';
import { formatNumber, formatDate, normalizeEstanque, calculatePondNetMetrics } from '../utils';
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
import { Scale, TrendingUp, ShieldCheck, Flame, Layers, Eye, Fish, ArrowUpRight } from 'lucide-react';

interface EstadisticasViewProps {
  records: PondRecord[];
  allRecords: PondRecord[];
  chartData: any[];
  historicalChartData: any[];
  uniqueEstanquesInHistory: string[];
  lineColors: string[];
  harvests: HarvestRecord[];
  onSelectPond: (pondId: string) => void;
}

const EstadisticasView: React.FC<EstadisticasViewProps> = ({
  records,
  allRecords,
  chartData,
  historicalChartData,
  uniqueEstanquesInHistory,
  lineColors,
  harvests,
  onSelectPond,
}) => {
  // Global Executive Summary incorporating Pre-cosechas
  const summary = useMemo(() => {
    if (!records || records.length === 0) return null;

    let totalBiomasaEnAgua = 0;
    let totalKilosExtraidos = 0;
    let totalBiomasaTotal = 0;
    let totalAlimentoAcumulado = 0;
    let weightedWeightSum = 0;
    let totalPopulation = 0;
    let totalSurvSum = 0;
    let count = 0;

    records.forEach(r => {
      const net = calculatePondNetMetrics(r, harvests);
      totalBiomasaEnAgua += net.biomasaEnAgua;
      totalKilosExtraidos += net.kilosExtraidos;
      totalBiomasaTotal += net.biomasaTotal;
      totalAlimentoAcumulado += (Number(r.alimentoAcumulado) || 0);

      const pop = net.poblacionEnAgua || Number(r.densidadActual) || 0;
      totalPopulation += pop;
      weightedWeightSum += (Number(r.pesoActual) || 0) * (net.biomasaEnAgua || 1);
      totalSurvSum += Number(r.sobrevivencia) || 0;
      count++;
    });

    const fcaSinPrecosecha = totalBiomasaEnAgua > 0
      ? parseFloat((totalAlimentoAcumulado / totalBiomasaEnAgua).toFixed(2))
      : 0;

    const fcaPoscosecha = totalBiomasaTotal > 0
      ? parseFloat((totalAlimentoAcumulado / totalBiomasaTotal).toFixed(2))
      : fcaSinPrecosecha;

    const fcaAhorro = parseFloat((fcaSinPrecosecha - fcaPoscosecha).toFixed(2));
    const avgPeso = count > 0 && totalBiomasaEnAgua > 0
      ? parseFloat((weightedWeightSum / totalBiomasaEnAgua).toFixed(2))
      : (count > 0 ? parseFloat((records.reduce((acc, r) => acc + (Number(r.pesoActual) || 0), 0) / count).toFixed(2)) : 0);

    const avgSurv = count > 0 ? parseFloat((totalSurvSum / count).toFixed(1)) : 0;

    return {
      pondsCount: count,
      totalBiomasaEnAgua,
      totalKilosExtraidos,
      totalBiomasaTotal,
      totalAlimentoAcumulado,
      fcaSinPrecosecha,
      fcaPoscosecha,
      fcaAhorro,
      avgPeso,
      avgSurv,
      totalPopulation
    };
  }, [records, harvests]);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Biomasa en Agua */}
          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-300 mb-1">
              <span className="text-xs font-semibold">Biomasa en Agua</span>
              <Fish className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-white">
              {formatNumber(summary.totalBiomasaEnAgua)} <span className="text-xs font-normal text-blue-300">kg</span>
            </p>
            <p className="text-[10px] text-emerald-400 mt-1 font-medium">Viva remanente</p>
          </div>

          {/* Card 2: Pre-cosechas Extraídas */}
          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-300 mb-1">
              <span className="text-xs font-semibold">Pre-cosechas</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl font-black text-amber-400">
              {formatNumber(summary.totalKilosExtraidos)} <span className="text-xs font-normal text-amber-200">kg</span>
            </p>
            <p className="text-[10px] text-blue-300 mt-1 font-medium">Extraído en raleos</p>
          </div>

          {/* Card 3: Biomasa Total */}
          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-300 mb-1">
              <span className="text-xs font-semibold">Biomasa Total</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xl font-black text-cyan-300">
              {formatNumber(summary.totalBiomasaTotal)} <span className="text-xs font-normal text-cyan-200">kg</span>
            </p>
            <p className="text-[10px] text-blue-300 mt-1 font-medium">Agua + Cosechado</p>
          </div>

          {/* Card 4: FCA Ajustado vs Sin Precosecha */}
          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-300 mb-1">
              <span className="text-xs font-semibold">FCA Ajustado</span>
              <Flame className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-black text-emerald-400">
                {summary.fcaPoscosecha > 0 ? summary.fcaPoscosecha.toFixed(2) : '-'}
              </p>
              {summary.fcaSinPrecosecha > summary.fcaPoscosecha && (
                <span className="text-[11px] text-slate-400 line-through">
                  {summary.fcaSinPrecosecha.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-300 mt-1 font-medium">
              {summary.fcaAhorro > 0 ? `-${summary.fcaAhorro.toFixed(2)} ahorro real` : 'Conversión global'}
            </p>
          </div>

          {/* Card 5: Peso Promedio */}
          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-300 mb-1">
              <span className="text-xs font-semibold">Peso Promedio</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xl font-black text-white">
              {summary.avgPeso > 0 ? `${summary.avgPeso} g` : '-'}
            </p>
            <p className="text-[10px] text-blue-300 mt-1 font-medium">Ponderado activo</p>
          </div>

          {/* Card 6: Sobrevivencia */}
          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-300 mb-1">
              <span className="text-xs font-semibold">Sobrevivencia</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-white">
              {summary.avgSurv > 0 ? `${summary.avgSurv}%` : '-'}
            </p>
            <p className="text-[10px] text-blue-300 mt-1 font-medium">{summary.pondsCount} estanques</p>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Peso Actual por Estanque */}
        <div className="bg-[#093661] p-5 rounded-2xl border border-[#125699] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Fish className="w-4 h-4 text-cyan-400" />
              <span>Peso Actual por Estanque (g)</span>
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#125699" opacity={0.5} />
                <XAxis dataKey="name" stroke="#93c5fd" fontSize={11} angle={-30} textAnchor="end" />
                <YAxis stroke="#93c5fd" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#072C52', borderColor: '#1B5CB3', borderRadius: '8px', color: '#fff' }}
                  formatter={(val: any) => [`${val} g`, 'Peso Actual']}
                />
                <Bar dataKey="peso" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={lineColors[idx % lineColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Biomasa en Agua vs Pre-cosechas */}
        <div className="bg-[#093661] p-5 rounded-2xl border border-[#125699] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Biomasa Total Producida (Agua + Pre-cosechas)</span>
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={records.map(r => {
                  const net = calculatePondNetMetrics(r, harvests);
                  return {
                    name: `E${normalizeEstanque(r.estanque)}`,
                    enAgua: net.biomasaEnAgua,
                    precosechas: net.kilosExtraidos,
                    total: net.biomasaTotal
                  };
                })}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#125699" opacity={0.5} />
                <XAxis dataKey="name" stroke="#93c5fd" fontSize={11} angle={-30} textAnchor="end" />
                <YAxis stroke="#93c5fd" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#072C52', borderColor: '#1B5CB3', borderRadius: '8px', color: '#fff' }}
                  formatter={(val: any) => [`${formatNumber(Number(val))} kg`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#93c5fd' }} />
                <Bar dataKey="enAgua" name="Biomasa en Agua" fill="#10b981" stackId="a" />
                <Bar dataKey="precosechas" name="Pre-cosechas" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Historical Trend Chart */}
      {historicalChartData.length > 1 && (
        <div className="bg-[#093661] p-5 rounded-2xl border border-[#125699] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Curvas de Crecimiento Histórico por Estanque</span>
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#125699" opacity={0.5} />
                <XAxis dataKey="fecha" stroke="#93c5fd" fontSize={11} />
                <YAxis stroke="#93c5fd" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#072C52', borderColor: '#1B5CB3', borderRadius: '8px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#93c5fd' }} />
                {uniqueEstanquesInHistory.slice(0, 8).map((pondName, idx) => (
                  <Line
                    key={pondName}
                    type="monotone"
                    dataKey={`${pondName}_peso`}
                    name={pondName}
                    stroke={lineColors[idx % lineColors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-[#0B4075] rounded-xl border border-[#125699] overflow-hidden shadow-lg">
        <div className="p-4 bg-[#072C52] border-b border-[#125699] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Detalle Técnico y Balance de Cosechas por Estanque
          </h3>
          <span className="text-xs text-blue-300">
            {records.length} estanque(s) evaluados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#062444] text-blue-100 uppercase tracking-wider font-bold border-b border-[#125699]">
              <tr>
                <th className="px-3 py-3 border-r border-[#125699]">Est.</th>
                <th className="px-3 py-3 border-r border-[#125699]">Granja</th>
                <th className="px-2 py-3 border-r border-[#125699] text-right">Has</th>
                <th className="px-2 py-3 border-r border-[#125699] text-right">Días</th>
                <th className="px-2 py-3 border-r border-[#125699] text-right">P. Ant</th>
                <th className="px-2 py-3 border-r border-[#125699] text-right">P. Act</th>
                <th className="px-2 py-3 border-r border-[#125699] text-right">Inc</th>
                <th className="px-2 py-3 border-r border-[#125699] text-right">Sobrv</th>
                <th className="px-3 py-3 border-r border-[#125699] text-right bg-emerald-950/20 text-emerald-300">Biomasa Agua</th>
                <th className="px-3 py-3 border-r border-[#125699] text-right bg-amber-950/20 text-amber-300">Pre-cosechas</th>
                <th className="px-3 py-3 border-r border-[#125699] text-right text-cyan-300">Biomasa Total</th>
                <th className="px-3 py-3 border-r border-[#125699] text-right">Alim. Acum</th>
                <th className="px-2 py-3 border-r border-[#125699] text-right text-amber-300" title="Alimento / Biomasa en Agua">FCA s/ Pre</th>
                <th className="px-2 py-3 border-r border-[#125699] text-right text-emerald-300 bg-emerald-950/20" title="Alimento / Biomasa Total Producida">FCA Poscosecha</th>
                <th className="px-3 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#125699]/60">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-blue-300">
                    No hay registros de estanques disponibles.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const net = calculatePondNetMetrics(r, harvests);
                  return (
                    <tr key={r.id} className="hover:bg-[#0E4680]/60 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-amber-300 border-r border-[#125699] whitespace-nowrap">
                        E{normalizeEstanque(r.estanque)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-white border-r border-[#125699] whitespace-nowrap">
                        {r.granja}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-300 border-r border-[#125699]">
                        {r.hectareas}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-300 border-r border-[#125699]">
                        {r.diasCultivo}
                      </td>
                      <td className="px-2 py-2.5 text-right text-slate-400 border-r border-[#125699]">
                        {r.pesoAnterior ? `${r.pesoAnterior}g` : '-'}
                      </td>
                      <td className="px-2 py-2.5 text-right font-bold text-white border-r border-[#125699]">
                        {r.pesoActual}g
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold text-cyan-300 border-r border-[#125699]">
                        +{r.incrementoSemanal}g
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold text-emerald-400 border-r border-[#125699]">
                        {r.sobrevivencia}%
                      </td>

                      {/* Biomasa Agua */}
                      <td className="px-3 py-2.5 text-right font-black text-emerald-400 border-r border-[#125699] bg-emerald-950/10">
                        {formatNumber(net.biomasaEnAgua)} kg
                      </td>

                      {/* Pre-cosechas */}
                      <td className="px-3 py-2.5 text-right font-black text-amber-400 border-r border-[#125699] bg-amber-950/10">
                        {net.kilosExtraidos > 0 ? (
                          <span>{formatNumber(net.kilosExtraidos)} kg</span>
                        ) : (
                          <span className="text-slate-500 font-normal">-</span>
                        )}
                      </td>

                      {/* Biomasa Total */}
                      <td className="px-3 py-2.5 text-right font-black text-cyan-300 border-r border-[#125699]">
                        {formatNumber(net.biomasaTotal)} kg
                      </td>

                      {/* Alimento */}
                      <td className="px-3 py-2.5 text-right text-slate-200 border-r border-[#125699]">
                        {formatNumber(Number(r.alimentoAcumulado) || 0)} kg
                      </td>

                      {/* FCA s/ Pre */}
                      <td className="px-2 py-2.5 text-right text-amber-300 border-r border-[#125699]">
                        {net.fcaSinPrecosecha > 0 ? net.fcaSinPrecosecha.toFixed(2) : '-'}
                      </td>

                      {/* FCA Poscosecha */}
                      <td className="px-2 py-2.5 text-right font-bold text-emerald-400 border-r border-[#125699] bg-emerald-950/10">
                        {net.fcaPoscosecha > 0 ? net.fcaPoscosecha.toFixed(2) : '-'}
                      </td>

                      {/* Action */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => onSelectPond(r.id)}
                          className="bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all mx-auto"
                          title="Ver detalle del estanque"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
    </div>
  );
};

export default EstadisticasView;
