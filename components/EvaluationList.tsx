
import React, { useState } from 'react';
import { EvaluationRecord } from '../types';
import { formatDate } from '../utils';

interface Props {
    evaluations: EvaluationRecord[];
    onEdit: (evaluation: EvaluationRecord) => void;
}

const EvaluationList: React.FC<Props> = ({ evaluations, onEdit }) => {
    const [openId, setOpenId] = useState<string | null>(null);

    const toggleItem = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    if (evaluations.length === 0) {
        return (
            <div className="text-center py-20 bg-[#0B4075] rounded-xl border border-[#125699] shadow-sm">
                <h3 className="text-lg font-semibold text-white">No hay evaluaciones guardadas</h3>
                <p className="text-blue-300 mt-2">Navega a la sección "Evaluación Técnica" para crear una nueva.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {evaluations.map(evaluation => (
                <div key={evaluation.id} className="bg-[#0B4075] rounded-xl shadow-sm border border-[#125699] overflow-hidden">
                    <button 
                        onClick={() => toggleItem(evaluation.id)}
                        className={`w-full text-left p-6 flex justify-between items-center transition-colors ${openId === evaluation.id ? 'bg-[#0E4680]' : 'hover:bg-[#072C52]'}`}
                    >
                        <div>
                            <p className="font-bold text-white text-lg">
                                Granja: {String(evaluation.granja) || 'Sin Nombre'}
                            </p>
                            <p className="text-sm text-blue-300 mt-1">
                                Fecha de Evaluación: {evaluation.fecha ? String(evaluation.fecha) : formatDate(evaluation.submissionDate)}
                            </p>
                        </div>
                        <svg className={`w-6 h-6 transform transition-transform ${openId === evaluation.id ? 'rotate-180 text-white' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {openId === evaluation.id && (
                        <div className="p-6 border-t border-[#125699] bg-[#072C52]">
                            <h4 className="font-semibold text-blue-100 mb-4 uppercase tracking-wider text-sm">Detalles de la Evaluación</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                                {Object.entries(evaluation)
                                    .filter(([key]) => key !== 'id' && key !== 'submissionDate')
                                    .map(([key, value]) => (
                                    <div key={key}>
                                        <p className="text-xs text-blue-300 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                                        <p className="text-white font-medium">
                                            {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value) || '-'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={() => onEdit(evaluation)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    Editar Evaluación
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default EvaluationList;
