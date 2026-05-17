
import React, { useState } from 'react';
import { PondRecord } from '../types';
import { analyzeProductionData } from '../services/geminiService';

interface Props {
  records: PondRecord[];
}

const AIInsights: React.FC<Props> = ({ records }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeProductionData(records);
      setInsight(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl border border-blue-100 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <span>✨</span> Asistente IA de Producción
          </h2>
          <p className="text-indigo-600/80">Analiza tus datos de muestreo con Gemini Pro para optimizar tus resultados.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || records.length === 0}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
            loading 
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analizando...
            </>
          ) : (
            <>Analizar con IA</>
          )}
        </button>
      </div>

      {insight && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="prose prose-indigo max-w-none text-slate-700 whitespace-pre-wrap">
            {insight}
          </div>
        </div>
      )}

      {!insight && !loading && (
        <div className="text-center py-8 text-indigo-400">
          <p>Haz clic en el botón para obtener recomendaciones personalizadas basadas en tus datos actuales.</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
