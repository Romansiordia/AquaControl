
import React, { useMemo } from 'react';
import { PondRecord } from '../types';
import { formatNumber, formatDate } from '../utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface Props {
  pondId: number;
  records: PondRecord[];
  onClose: () => void;
}

const PondDetailModal: React.FC<Props> = ({ pondId, records, onClose }) => {
  const pondHistory = useMemo(() => {
    return records
      .filter(r => r.estanque === pondId)
      .sort((a, b) => a.diasCultivo - b.diasCultivo);
  }, [records, pondId]);

  if (pondHistory.length === 0) {
    return null; // Or some loading/error state
  }

  const latestRecord = pondHistory[pondHistory.length - 1];

  const stats = [
    { label: 'Último Peso', value: `${latestRecord.pesoActual} g` },
    { label: 'Última Superv.', value: `${latestRecord.porcentajeSobrevivencia}%` },
    { label: 'Último FCA', value: latestRecord.fca },
    { label: 'Días de Cultivo', value: latestRecord.diasCultivo },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Historial del Estanque #{pondId}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map(stat => (
                 <div key={stat.label} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="font-bold text-slate-800 text-lg">{stat.value}</p>
                 </div>
            ))}
        </div>

        <div className="flex-1 min-h-0 mb-6">
             <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={pondHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="diasCultivo" unit=" días" tick={{fontSize: 11}} />
                    <YAxis yAxisId="left" unit="g" tick={{fontSize: 11}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="pesoActual" name="Peso (g)" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 8}} />
                    <Line yAxisId="left" type="monotone" dataKey="incrementoSemanal" name="Incremento (g)" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        
        <div className="overflow-y-auto border-t border-slate-200 pt-4">
            <h3 className="font-bold text-slate-700 mb-2">Registros de Muestreo</h3>
             <table className="w-full text-left text-xs">
                 <thead className="bg-slate-50 text-slate-500">
                     <tr>
                        <th className="p-2">Días</th>
                        <th className="p-2">Fecha</th>
                        <th className="p-2">Peso (g)</th>
                        <th className="p-2">Inc. Sem. (g)</th>
                        <th className="p-2">Superv. (%)</th>
                        <th className="p-2">FCA</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {pondHistory.map(r => (
                         <tr key={r.id}>
                             <td className="p-2 font-medium">{r.diasCultivo}</td>
                             <td className="p-2">{formatDate(r.fechaSiembra)}</td>
                             <td className="p-2 text-blue-600 font-semibold">{r.pesoActual}</td>
                             <td className="p-2 text-emerald-600">+{r.incrementoSemanal}</td>
                             <td className="p-2">{r.porcentajeSobrevivencia}</td>
                             <td className="p-2">{r.fca}</td>
                         </tr>
                     )).reverse()}
                 </tbody>
             </table>
        </div>

      </div>
    </div>
  );
};

export default PondDetailModal;
