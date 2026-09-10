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
  Line
} from 'recharts';
import { PondRecord } from '../types';
import { formatNumber } from '../utils';
import StatisticsTable from './StatisticsTable';

interface Props {
  records: PondRecord[];
  allRecords?: PondRecord[];
  chartData?: any[];
  historicalChartData?: any[];
  uniqueEstanquesInHistory?: string[];
  lineColors?: string[];
}

const EstadisticasView: React.FC<Props> = ({ 
  records, 
  allRecords,
  chartData = [],
  historicalChartData = [],
  uniqueEstanquesInHistory = [],
  lineColors = ['#3b82f6', '#10b981', '#fb923c', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#eab308']
}) => {
  const [chartView, setChartView] = useState<'actual' | 'tendencia'>('actual');
  const datasetForStats = allRecords && allRecords.length > 0 ? allRecords : records;
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

  return (
    <div className="space-y-8">
      <div id="dashboard-stats" className="bg-[#0B4075] rounded-xl shadow-sm border border-[#125699] overflow-hidden">
        <div className="bg-[#072C52] px-4 py-3 border-b border-[#125699] flex justify-between items-center">
            <h3 className="font-bold text-emerald-400 text-sm">Resumen Consolidado (Promedios y Totales)</h3>
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
                      <th colSpan={9} className="px-3 py-2 border-b border-[#125699] text-sm uppercase tracking-wider">Densidad, Biomasa y Alimentación</th>
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
            </>
          ) : (
            <div className="p-4 text-center text-slate-500 italic bg-[#0B4075] rounded-lg">
              No hay datos para mostrar
            </div>
          )}
        </div>
      </div>
      
      <StatisticsTable records={datasetForStats} />
                    <div className="flex flex-col items-start gap-3 mb-4 mt-8">
                <h2 className="text-lg font-bold text-white">
                  Gráficos de Producción
                </h2>
                <div className="flex bg-[#0B4075] rounded-lg p-1 border border-[#125699]">
                  <button onClick={() => setChartView('actual')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${chartView === 'actual' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}`}>Último por Estanque</button>
                  <button onClick={() => setChartView('tendencia')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${chartView === 'tendencia' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}`}>Tendencia Histórica</button>
                </div>
              </div>

              <div id="charts-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Peso Actual */}
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-blue-500">⚖️</span> Peso Actual (g)</h2>
                      <div className="flex-1 min-h-0">
                        {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            {chartView === 'actual' ? (
                              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} g`, 'Peso']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="pesoActual" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.pesoActual > 6 ? '#2563eb' : '#3b82f6'} />))}</Bar></BarChart>
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
                    </>
                </div>
                
                {/* Incremento Semanal */}
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-indigo-500">📈</span> Incremento Semanal (g)</h2>
                      <div className="flex-1 min-h-0">
                        {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                             {chartView === 'actual' ? (
                               <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`+${formatNumber(value)} g`, 'Incremento']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="incrementoSemanal" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-inc-${index}`} fill={entry.incrementoSemanal > 1.2 ? '#6366f1' : '#818cf8'} />))}</Bar></BarChart>
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
                    </>

                </div>

                {/* Supervivencia */}
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-emerald-500">🛡️</span> Supervivencia (%)</h2>
                      <div className="flex-1 min-h-0">
                        {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            {chartView === 'actual' ? (
                              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)}%`, 'Supervivencia']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="sobrevivencia" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-surv-${index}`} fill={entry.sobrevivencia > 75 ? '#10b981' : entry.sobrevivencia > 50 ? '#f59e0b' : '#ef4444'} />))}</Bar></BarChart>
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
                    </>

                </div>

                {/* Biomasa Total */}
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-orange-400">🦐</span> Biomasa Total (kg)</h2>
                      <div className="flex-1 min-h-0">
                        {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                             {chartView === 'actual' ? (
                               <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} kg`, 'Biomasa']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="biomasaTotal" radius={[4, 4, 0, 0]} fill="#fb923c" /></BarChart>
                             ) : (
                               <LineChart data={historicalChartData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                                 <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                 <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number, name: string) => [`${formatNumber(value)} kg`, name.replace('_biomasa', '')]} labelFormatter={(label) => `Fecha: ${label}`} />
                                 {uniqueEstanquesInHistory.map((est, idx) => (
                                    <Line key={est} type="monotone" dataKey={`${est}_biomasa`} name={`${est}_biomasa`} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={{ fill: lineColors[idx % lineColors.length], strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                                 ))}
                               </LineChart>
                            )}
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
                      </div>
                    </>

                </div>

              </div>

    </div>
  );
};

export default EstadisticasView;
