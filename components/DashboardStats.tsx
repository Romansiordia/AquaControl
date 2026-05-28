
import React, { useMemo } from 'react';
import { PondRecord } from '../types';
import { formatNumber } from '../utils';
import { Activity, TrendingUp, HeartPulse, Package } from 'lucide-react';

const ShrimpIcon = ({ className, strokeWidth = 5 }: { className?: string; strokeWidth?: number }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M 65 42 C 85 35 85 15 70 15 C 50 15 25 25 25 25" />
    <path d="M 75 45 C 95 45 95 5 70 5 C 40 5 15 15 15 15" />
    <path d="M 65 42 L 75 45 C 75 45 70 55 55 55 L 50 40" />
    <circle cx="62" cy="47" r="4" fill="currentColor" stroke="none" />
    <path d="M 50 40 C 30 30 5 45 10 70 C 15 90 35 95 50 85 C 55 80 60 75 60 75" />
    <path d="M 55 55 C 35 55 25 65 25 75 C 25 85 40 90 50 85" />
    <path d="M 18 50 C 25 55 30 55 35 53" />
    <path d="M 13 65 C 20 65 25 66 28 64" />
    <path d="M 20 82 C 25 80 30 78 32 75" />
    <path d="M 35 61 C 38 65 42 70 42 75" />
    <path d="M 42 58 C 45 62 50 67 50 72" />
    <path d="M 50 55 C 53 60 58 64 58 68" />
    <path d="M 60 75 C 70 75 75 85 70 90 C 65 90 60 85 60 75" />
    <path d="M 60 75 C 70 70 80 75 75 80 C 70 85 65 80 60 75" />
  </svg>
);

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

  const totalAlimentoAcum = stats?.alimentoAcum || 0;

  const topStats = [
    { 
      label: 'Biomasa Total', 
      value: `${formatNumber(totalBiomass)} kg`, 
      color: 'text-white', 
      icon: <ShrimpIcon className="w-8 h-8 text-blue-400" strokeWidth={5} />,
      bgColor: 'bg-blue-900/30 border-blue-700/50'
    },
    { 
      label: 'Alimento Acumulado', 
      value: `${formatNumber(totalAlimentoAcum)} kg`, 
      color: 'text-white', 
      icon: <Package className="w-8 h-8 text-orange-400" strokeWidth={1.5} />,
      bgColor: 'bg-orange-900/30 border-orange-700/50'
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 xl:gap-6 mb-8">
      {topStats.map((stat, i) => (
        <div key={i} className="bg-[#0B4075] p-6 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-1">
          <div className={`p-4 rounded-xl ${stat.bgColor} border mb-4 flex items-center justify-center`}>
            {stat.icon}
          </div>
          <div className="flex flex-col items-center w-full">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-2xl xl:text-3xl font-extrabold ${stat.color} tracking-tight`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
