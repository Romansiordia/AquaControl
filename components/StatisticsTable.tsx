
import React from 'react';
import { PondRecord } from '../types';
import { formatNumber } from '../utils';

interface Props {
  records: PondRecord[];
}

interface StatRow {
  label: string;
  key: keyof PondRecord;
  unit: string;
}

const StatisticsTable: React.FC<Props> = ({ records }) => {
  if (records.length === 0) return null;

  const rows: StatRow[] = [
    { label: 'Peso Actual', key: 'pesoActual', unit: 'g' },
    { label: 'Incremento Semanal', key: 'incrementoSemanal', unit: 'g' },
    { label: 'Supervivencia', key: 'porcentajeSobrevivencia', unit: '%' },
    { label: 'Biomasa Total', key: 'biomasaTotal', unit: 'kg' },
    { label: 'FCA', key: 'fca', unit: '' },
    { label: 'Densidad Actual', key: 'densidadActual', unit: 'ind' },
  ];

  const calculateStats = (key: keyof PondRecord) => {
    const values = records.map(r => r[key] as number).filter(v => typeof v === 'number');
    if (values.length === 0) return { avg: 0, max: 0, min: 0, std: 0 };

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(avgSquareDiff);

    return { avg, max, min, std };
  };

  return (
    <div className="bg-[#0B4075] rounded-xl shadow-sm border border-[#125699] overflow-hidden mt-8">
      <div className="bg-[#072C52] px-6 py-4 border-b border-[#125699]">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Análisis Estadístico de Producción
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table id="stats-table" className="w-full text-left text-sm">
          <thead className="bg-[#072C52] text-blue-300 font-medium">
            <tr>
              <th className="px-6 py-3">Variable</th>
              <th className="px-6 py-3">Promedio</th>
              <th className="px-6 py-3">Máximo</th>
              <th className="px-6 py-3">Mínimo</th>
              <th className="px-6 py-3">Desv. Estándar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#125699]">
            {rows.map((row) => {
              const stats = calculateStats(row.key);
              return (
                <tr key={row.key} className="hover:bg-[#0E4680] transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{row.label}</td>
                  <td className="px-6 py-4 text-blue-100">{formatNumber(stats.avg)} {row.unit}</td>
                  <td className="px-6 py-4 text-emerald-400 font-medium">{formatNumber(stats.max)} {row.unit}</td>
                  <td className="px-6 py-4 text-rose-400 font-medium">{formatNumber(stats.min)} {row.unit}</td>
                  <td className="px-6 py-4 text-blue-400 italic">± {formatNumber(stats.std)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatisticsTable;