
import React from 'react';
import { PondRecord } from '../types';
import { formatNumber, formatDate } from '../utils';

interface Props {
  records: PondRecord[];
  onDelete: (id: string) => void;
  onSelectPond: (pondId: number) => void;
}

const PondTable: React.FC<Props> = ({ records, onDelete, onSelectPond }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table id="pond-table" className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-4 py-3 border-r border-slate-200">Granja</th>
                <th className="px-4 py-3 border-r border-slate-200">Cosecha</th>
                <th className="px-4 py-3 border-r border-slate-200">Siembra</th>
                <th className="px-4 py-3 border-r border-slate-200">Alimento</th>
                <th className="px-4 py-3 border-r border-slate-200">Alimentadores</th>
                <th className="px-4 py-3 border-r border-slate-200">Aditivos</th>
                <th className="px-4 py-3 border-r border-slate-200">Lab</th>
                <th className="px-4 py-3 border-r border-slate-200">Est.</th>
                <th className="px-4 py-3 border-r border-slate-200">Has</th>
                <th className="px-4 py-3 border-r border-slate-200">P.Ant</th>
                <th className="px-4 py-3 border-r border-slate-200">P.Act</th>
                <th className="px-4 py-3 border-r border-slate-200">Inc.S</th>
                <th className="px-4 py-3 border-r border-slate-200">Días</th>
                <th className="px-4 py-3 border-r border-slate-200">% Sobr</th>
                <th className="px-4 py-3 border-r border-slate-200">Dens.I</th>
                <th className="px-4 py-3 border-r border-slate-200">Dens.A</th>
                <th className="px-4 py-3 border-r border-slate-200">Bio/Ha</th>
                <th className="px-4 py-3 border-r border-slate-200">Bio.Tot</th>
                <th className="px-4 py-3 border-r border-slate-200">Alim.Ac</th>
                <th className="px-4 py-3 border-r border-slate-200">FCA</th>
                <th className="px-4 py-3 border-r border-slate-200">Cam/m2 I</th>
                <th className="px-4 py-3 border-r border-slate-200">Cam/m2 A</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 text-[12px]">
                  <td className="px-4 py-3 font-medium border-r border-slate-50">{record.granja}</td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-slate-50">{record.fechaCosecha}</td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-slate-50 font-bold text-slate-900">{record.fechaSiembra}</td>
                  <td className="px-4 py-3 border-r border-slate-50">{record.alimento}</td>
                  <td className="px-4 py-3 border-r border-slate-50">{record.alimentadores}</td>
                  <td className="px-4 py-3 border-r border-slate-50">{record.aditivos}</td>
                  <td className="px-4 py-3 border-r border-slate-50">{record.laboratorio}</td>
                  <td className="px-4 py-3 font-bold text-indigo-600 border-r border-slate-50">
                     <button onClick={() => onSelectPond(parseInt(record.estanque))} className="hover:underline">
                       {record.estanque}
                     </button>
                  </td>
                  <td className="px-4 py-3 border-r border-slate-50">{record.hectareas}</td>
                  <td className="px-4 py-3 border-r border-slate-50 text-slate-500">{record.pesoAnterior}g</td>
                  <td className="px-4 py-3 border-r border-slate-50 font-bold text-blue-600">{record.pesoActual}g</td>
                  <td className="px-4 py-3 border-r border-slate-50 font-medium text-emerald-600">
                    {record.incrementoSemanal > 0 ? `+${record.incrementoSemanal}` : record.incrementoSemanal}g
                  </td>
                  <td className="px-4 py-3 border-r border-slate-50">{record.diasCultivo}</td>
                  <td className="px-4 py-3 border-r border-slate-50 font-bold text-amber-600">{record.sobrevivencia}%</td>
                  <td className="px-4 py-3 border-r border-slate-50">{formatNumber(record.densidadInicial)}</td>
                  <td className="px-4 py-3 border-r border-slate-50 font-bold">{formatNumber(record.densidadActual)}</td>
                  <td className="px-4 py-3 border-r border-slate-50 bg-slate-50/30">{formatNumber(record.biomasaHa)}</td>
                  <td className="px-4 py-3 border-r border-slate-50 font-bold bg-blue-50/30">{formatNumber(record.biomasaTotal)}</td>
                  <td className="px-4 py-3 border-r border-slate-50">{formatNumber(record.alimentoAcumulado)}</td>
                  <td className="px-4 py-3 border-r border-slate-50 font-bold text-rose-600">{record.fca}</td>
                  <td className="px-4 py-3 border-r border-slate-50">{record.camM2Inicial}</td>
                  <td className="px-4 py-3 border-r border-slate-50 font-bold">{record.camM2Actual}</td>
                  <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => onDelete(record.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    aria-label={`Eliminar registro del estanque ${record.estanque}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PondTable;