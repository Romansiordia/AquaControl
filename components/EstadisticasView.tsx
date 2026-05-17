import React, { useMemo } from 'react';
import { PondRecord } from '../types';
import { formatNumber } from '../utils';
import StatisticsTable from './StatisticsTable';

interface Props {
  records: PondRecord[];
}

const EstadisticasView: React.FC<Props> = ({ records }) => {
  const stats = useMemo(() => {
    if (records.length === 0) return null;

    const count = records.length;
    const sumHas = records.reduce((s, r) => s + r.hectareas, 0);
    const avgPesoAnterior = records.reduce((s, r) => s + r.pesoAnterior, 0) / count;
    const avgPesoActual = records.reduce((s, r) => s + r.pesoActual, 0) / count;
    const avgIncSemanal = records.reduce((s, r) => s + r.incrementoSemanal, 0) / count;
    const avgDiasCultivo = records.reduce((s, r) => s + r.diasCultivo, 0) / count;
    const avgSobrevivencia = records.reduce((s, r) => s + r.sobrevivencia, 0) / count;
    const sumDensidadInicial = records.reduce((s, r) => s + (r.organismosSembrados || r.densidadInicial), 0);
    const sumDensidadActual = records.reduce((s, r) => s + r.densidadActual, 0);
    const sumBiomasaTotal = records.reduce((s, r) => s + r.biomasaTotal, 0);
    const biomasaHa = sumHas > 0 ? (sumBiomasaTotal / sumHas) : 0;
    const sumAlimentoSemanal = records.reduce((s, r) => s + (r.alimentoSemanal || 0), 0);
    const sumAlimentoAcum = records.reduce((s, r) => s + (r.alimentoAcumulado || 0), 0);
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
      <div className="bg-[#0B4075] rounded-xl shadow-sm border border-[#125699] overflow-hidden">
        <div className="bg-[#072C52] px-4 py-3 border-b border-[#125699] flex justify-between items-center">
            <h3 className="font-bold text-emerald-400 text-sm">Resumen Consolidado (Promedios y Totales)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#0E4680] text-white font-semibold whitespace-nowrap text-center">
                <th className="px-3 py-2 border-r border-[#125699]">PROMEDIO ESTANQUE</th>
                <th className="px-3 py-2 border-r border-[#125699]">HAS</th>
                <th className="px-3 py-2 border-r border-[#125699]">PESO ANT.</th>
                <th className="px-3 py-2 border-r border-[#125699]">PESO ACT.</th>
                <th className="px-3 py-2 border-r border-[#125699]">INCREM. SEM.</th>
                <th className="px-3 py-2 border-r border-[#125699]">DÍAS CULT.</th>
                <th className="px-3 py-2 border-r border-[#125699]">% SOBREV.</th>
                <th className="px-3 py-2 border-r border-[#125699]">DENS. INICIAL</th>
                <th className="px-3 py-2 border-r border-[#125699]">DENS. ACTUAL</th>
                <th className="px-3 py-2 border-r border-[#125699]">BIOMASA HA.</th>
                <th className="px-3 py-2 border-r border-[#125699]">BIOMASA TOTAL</th>
                <th className="px-3 py-2 border-r border-[#125699]">ALIM. SEMANAL</th>
                <th className="px-3 py-2 border-r border-[#125699]">ALIM. ACUMULADO</th>
                <th className="px-3 py-2 border-r border-[#125699]">F.C.A</th>
                <th className="px-3 py-2 border-r border-[#125699]">Cam/m2 INIC.</th>
                <th className="px-3 py-2">CAM ACT.</th>
              </tr>
            </thead>
            <tbody>
              {stats ? (
                <tr className="bg-[#072C52] text-emerald-100 font-bold whitespace-nowrap text-center">
                  <td className="px-3 py-3 border-r border-[#125699]">{stats.estanque}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.has)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.pesoAnterior)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.pesoActual)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.incSemanal)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.diasCultivo)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.sobrevivencia)}%</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.densidadInicial)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.densidadActual)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.biomasaHa)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.biomasaTotal)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.alimentoSemanal)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.alimentoAcum)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.fca)}</td>
                  <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(stats.camM2Inicial)}</td>
                  <td className="px-3 py-3">{formatNumber(stats.camM2Actual)}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={16} className="px-3 py-4 text-center text-slate-500 italic bg-[#0B4075]">No hay datos para mostrar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <StatisticsTable records={records} />
    </div>
  );
};

export default EstadisticasView;
