import React, { useState } from 'react';
import { EvaluationRecord, EvaluationFormData } from '../types';
import { formatDate } from '../utils';
import { FileText, Edit2, Trash2, ChevronDown, ChevronUp, Calendar, MapPin, Building2 } from 'lucide-react';

interface Props {
  evaluations: EvaluationRecord[];
  onEdit: (evaluation: EvaluationFormData) => void;
  onDelete: (id: string) => void;
}

const EvaluationList: React.FC<Props> = ({ evaluations, onEdit, onDelete }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-20 bg-[#0B4075] rounded-2xl border border-[#125699] shadow-lg">
        <FileText className="w-12 h-12 text-blue-300 mx-auto mb-3 opacity-60" />
        <h3 className="text-lg font-bold text-white">No hay evaluaciones guardadas</h3>
        <p className="text-sm text-blue-200 mt-1">
          Navega a la sección "Registro Granja" para crear una nueva evaluación técnica.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-black text-white">Historial de Evaluaciones Técnicas</h2>
        <span className="text-xs text-blue-300 font-semibold">{evaluations.length} registro(s)</span>
      </div>

      {evaluations.map((evaluation) => {
        const isOpen = openId === evaluation.id;
        const evalDate = evaluation.fecha ? String(evaluation.fecha).split('T')[0] : evaluation.submissionDate ? evaluation.submissionDate.split('T')[0] : '-';

        return (
          <div key={evaluation.id} className="bg-[#0B4075] rounded-xl shadow-sm border border-[#125699] overflow-hidden transition-all">
            <button
              onClick={() => toggleItem(evaluation.id)}
              className={`w-full text-left p-5 flex justify-between items-center transition-colors ${
                isOpen ? 'bg-[#0E4680]' : 'hover:bg-[#072C52]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-200">
                  <Building2 className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="font-bold text-white text-base">
                    Granja: {String(evaluation.granja) || 'Sin Nombre'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-blue-300 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {evalDate}
                    </span>
                    {evaluation.localidad && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {evaluation.localidad}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOpen ? <ChevronUp className="w-5 h-5 text-blue-300" /> : <ChevronDown className="w-5 h-5 text-blue-300" />}
              </div>
            </button>

            {isOpen && (
              <div className="p-6 border-t border-[#125699] bg-[#072C52]">
                <h4 className="font-bold text-blue-100 mb-4 uppercase tracking-wider text-xs">
                  Detalles Completos de Evaluación
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-xs">
                  {Object.entries(evaluation)
                    .filter(([key]) => key !== 'id' && key !== 'submissionDate')
                    .map(([key, value]) => (
                      <div key={key} className="bg-[#093661] p-3 rounded-lg border border-[#125699]/60">
                        <p className="text-[11px] text-blue-300 capitalize mb-1">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-white font-semibold">
                          {typeof value === 'boolean'
                            ? value ? 'Sí' : 'No'
                            : typeof value === 'string' && key.toLowerCase().includes('fecha')
                            ? value.split('T')[0]
                            : String(value || '-')}
                        </p>
                      </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#125699]">
                  <button
                    onClick={() => onDelete(evaluation.id)}
                    className="bg-red-600/30 hover:bg-red-600 text-red-200 hover:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all text-xs border border-red-500/40"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                  <button
                    onClick={() => onEdit(evaluation)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all text-xs shadow-md"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar Evaluación</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EvaluationList;
