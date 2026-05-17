
import React, { useMemo } from 'react';
import { PondRecord } from '../types';
import { formatNumber } from '../utils';
import { Activity, TrendingUp, Fish, HeartPulse } from 'lucide-react';

interface Props {
  records: PondRecord[];
}

const DashboardStats: React.FC<Props> = ({ records }) => {
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

  const totalBiomass = records.reduce((sum, r) => sum + r.biomasaTotal, 0);
  const avgFca = stats?.fca || 0;
  const avgIncrement = stats?.incSemanal || 0;
  const avgSurvival = stats?.sobrevivencia || 0;

  const topStats = [
    { 
      label: 'Biomasa Total', 
      value: `${formatNumber(totalBiomass)} kg`, 
      color: 'text-white', 
      icon: <Fish className="w-8 h-8 text-blue-400" strokeWidth={1.5} />,
      bgColor: 'bg-blue-900/30 border-blue-700/50'
    },
    { 
      label: 'Promedio FCA', 
      value: formatNumber(avgFca), 
      color: 'text-white', 
      icon: <Activity className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />,
      bgColor: 'bg-emerald-900/30 border-emerald-700/50'
    },
    { 
      label: 'Inc. Semanal Prom.', 
      value: `${formatNumber(avgIncrement)} g`, 
      color: 'text-white', 
      icon: <TrendingUp className="w-8 h-8 text-indigo-400" strokeWidth={1.5} />,
      bgColor: 'bg-indigo-900/30 border-indigo-700/50'
    },
    { 
      label: 'Supervivencia Prom.', 
      value: `${formatNumber(avgSurvival)}%`, 
      color: 'text-white', 
      icon: <HeartPulse className="w-8 h-8 text-amber-400" strokeWidth={1.5} />, 
      bgColor: 'bg-amber-900/30 border-amber-700/50'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {topStats.map((stat, i) => (
        <div key={i} className="bg-[#0B4075] p-8 rounded-2xl shadow-sm border border-[#125699] flex flex-col justify-between items-start transition-all hover:shadow-md hover:-translate-y-1">
          <div className={`p-4 rounded-xl ${stat.bgColor} border mb-6 flex items-center justify-center`}>
            {stat.icon}
          </div>
          <div>
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-4xl font-extrabold ${stat.color} tracking-tight`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
