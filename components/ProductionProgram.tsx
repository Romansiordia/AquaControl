import React, { useState } from 'react';
import { PondRecord } from '../types';
import { Plus, Save, X, Edit2, Trash2 } from 'lucide-react';
import { formatNumber, formatDate } from '../utils';

interface ProductionProgramProps {
    records: PondRecord[];
    onAdd: () => void;
    onEdit: (record: PondRecord) => void;
    onDelete: (id: string) => void;
}

const ProductionProgram: React.FC<ProductionProgramProps> = ({ records, onAdd, onEdit, onDelete }) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 bg-[#0B4075] p-4 rounded-xl border border-[#125699] shadow-sm">
                <div className="flex flex-col gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-white">Control de Producción</h2>
                        <p className="text-sm text-blue-300">Módulo de biometrías y métricas productivas sincronizado con Sheets.</p>
                    </div>
                    <button 
                        onClick={onAdd}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-fit"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Muestreo
                    </button>
                </div>
            </div>

            <div className="bg-[#0B4075] rounded-xl border border-[#125699] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-blue-600 text-white font-bold uppercase text-[10px] tracking-wider text-center border-b border-blue-700">
                                <th className="px-3 py-3 border-r border-blue-500">Acciones</th>
                                <th className="px-3 py-3 border-r border-blue-500">Granja</th>
                                <th className="px-3 py-3 border-r border-blue-500">Org/Mt2</th>
                                <th className="px-3 py-3 border-r border-blue-500">Especie</th>
                                <th className="px-3 py-3 border-r border-blue-500">Fecha</th>
                                <th className="px-3 py-3 border-r border-blue-500">F.Cosecha</th>
                                <th className="px-3 py-3 border-r border-blue-500">F.Siembra</th>
                                <th className="px-3 py-3 border-r border-blue-500">Alimento</th>
                                <th className="px-3 py-3 border-r border-blue-500">Alimentadores</th>
                                <th className="px-3 py-3 border-r border-blue-500">Aditivos</th>
                                <th className="px-3 py-3 border-r border-blue-500">Lab</th>
                                <th className="px-3 py-3 border-r border-blue-500">Est.</th>
                                <th className="px-3 py-3 border-r border-blue-500">Has.</th>
                                <th className="px-3 py-3 border-r border-blue-500">P.Ant</th>
                                <th className="px-3 py-3 border-r border-blue-500">P.Act</th>
                                <th className="px-3 py-3 border-r border-blue-500">Inc.S</th>
                                <th className="px-3 py-3 border-r border-blue-500">Días</th>
                                <th className="px-3 py-3 border-r border-blue-500">% Sobr.</th>
                                <th className="px-3 py-3 border-r border-blue-500">Dens.I</th>
                                <th className="px-3 py-3 border-r border-blue-500">Dens.A</th>
                                <th className="px-3 py-3 border-r border-blue-500">Bio/Ha</th>
                                <th className="px-3 py-3 border-r border-blue-500">Bio.Tot</th>
                                <th className="px-3 py-3 border-r border-blue-500">Alim.Acum</th>
                                <th className="px-3 py-3 border-r border-blue-500">FCA</th>
                                <th className="px-3 py-3 border-r border-blue-500">Cam/m2 I</th>
                                <th className="px-3 py-3 border-r border-blue-500">Cam/m2 A</th>
                                <th className="px-3 py-3 border-r border-blue-500">Proy. Día</th>
                                <th className="px-3 py-3 border-r border-blue-500">Proy. Sem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#125699]">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={28} className="px-4 py-10 text-center text-slate-400 italic">No hay registros de producción.</td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-[#0E4680] transition-colors text-center text-[10px] whitespace-nowrap text-blue-100">
                                        <td className="px-3 py-3 border-r border-[#125699]">
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => onEdit(record)}
                                                    className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
                                                    title="Editar Registro"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
                                                            onDelete(record.id);
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                                                    title="Eliminar Registro"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 border-r border-[#125699] font-medium text-white">{record.granja}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.orgMt2}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.especie}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.fecha ? String(record.fecha).split('T')[0] : ''}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.fechaCosecha ? String(record.fechaCosecha).split('T')[0] : ''}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.fechaSiembra ? String(record.fechaSiembra).split('T')[0] : ''}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.alimento}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.alimentadores}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.aditivos}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.laboratorio}</td>
                                        <td className="px-3 py-3 border-r border-[#125699] font-bold text-white">{record.estanque}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.hectareas}</td>
                                        <td className="px-3 py-3 border-r border-[#125699] text-blue-300">{record.pesoAnterior}</td>
                                        <td className="px-3 py-3 border-r border-[#125699] font-bold text-emerald-400">{record.pesoActual}</td>
                                        <td className="px-3 py-3 border-r border-[#125699] text-emerald-400">+{record.incrementoSemanal}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.diasCultivo}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{record.sobrevivencia}%</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(record.densidadInicial)}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(record.densidadActual)}</td>
                                        <td className="px-3 py-3 border-r border-[#125699] text-blue-400">{formatNumber(record.biomasaHa)}</td>
                                        <td className="px-3 py-3 border-r border-[#125699] font-bold text-indigo-400">{formatNumber(record.biomasaTotal)}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(record.alimentoAcumulado)}</td>
                                        <td className="px-3 py-3 border-r border-[#125699] font-bold text-amber-500">{formatNumber(record.fca)}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(record.camM2Inicial)}</td>
                                        <td className="px-3 py-3 border-r border-[#125699]">{formatNumber(record.camM2Actual)}</td>
                                        <td className="px-3 py-3 border-r border-[#125699] font-medium">{formatNumber(record.alimentoProyectadoDia)}</td>
                                        <td className="px-3 py-3 border-r border-[#125699] font-medium">{formatNumber(record.alimentoProyectadoSemana)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductionProgram;
