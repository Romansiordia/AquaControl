
import React, { useState, useMemo } from 'react';
import { PondRecord, EvaluationRecord } from '../types';
import { calculateFeedProjection } from '../utils/feedCalculator';

interface Props {
  onAdd: (record: Partial<PondRecord>) => void;
  onCancel: () => void;
  initialData?: Partial<PondRecord>;
  existingRecords?: PondRecord[];
  evaluations?: EvaluationRecord[];
}

const PondForm: React.FC<Props> = ({ onAdd, onCancel, initialData, existingRecords = [], evaluations = [] }) => {
  const getInitialState = () => {
    if (initialData) {
      return {
        ...initialData,
        fecha: initialData.fecha ? String(initialData.fecha).split('T')[0] : '',
        fechaSiembra: initialData.fechaSiembra ? String(initialData.fechaSiembra).split('T')[0] : ''
      };
    }
    return {
      granja: '',
      especie: 'L. Vannamei',
      fecha: new Date().toISOString().split('T')[0],
      fechaSiembra: new Date().toISOString().split('T')[0],
      fechaCosecha: '',
      alimento: 'A.D.M.',
      laboratorio: 'SAHIMAR',
      estanque: '1',
      hectareas: 10,
      pesoAnterior: 0,
      pesoActual: 0,
      sobrevivencia: 100,
      densidadInicial: 0,
      alimentoSemanal: 0,
      alimentoAcumulado: 0,
      alimentadores: '',
      aditivos: '',
      alimentoProyectadoDia: 0,
      alimentoProyectadoSemana: 0
    };
  };

  const [form, setForm] = useState<Partial<PondRecord>>(getInitialState());

  const latestRecordsByPond = useMemo(() => {
    const latest = new Map<string, PondRecord>();
    existingRecords.forEach(record => {
      const key = `${record.granja}-${record.estanque}`;
      const current = latest.get(key);
      if (!current || record.diasCultivo > current.diasCultivo) {
        latest.set(key, record);
      }
    });
    return Array.from(latest.values()).sort((a, b) => {
      if (a.granja === b.granja) return a.estanque.toString().localeCompare(b.estanque.toString(), undefined, {numeric: true});
      return a.granja.localeCompare(b.granja);
    });
  }, [existingRecords]);

  const handleLoadFromExisting = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    if (!key) return;
    const [granja, estanque] = key.split('|');
    const record = latestRecordsByPond.find(r => r.granja === granja && r.estanque.toString() === estanque);
    
    if (record) {
      const evaluation = [...evaluations].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()).find(ev => ev.granja === record.granja);

      setForm(prev => ({
        ...prev,
        granja: record.granja,
        estanque: record.estanque.toString(),
        especie: record.especie || 'L. Vannamei',
        hectareas: record.hectareas,
        fechaSiembra: (evaluation && evaluation.fecha_siembra) ? String(evaluation.fecha_siembra).split('T')[0] : (record.fechaSiembra ? String(record.fechaSiembra).split('T')[0] : prev.fechaSiembra),
        laboratorio: record.laboratorio,
        densidadInicial: record.densidadInicial,
        sobrevivencia: record.sobrevivencia,
        pesoAnterior: record.pesoActual,
        pesoActual: record.pesoActual,
        alimentoAcumulado: record.alimentoAcumulado,
        alimentadores: record.alimentadores || '',
        aditivos: record.aditivos || ''
      }));
    }
  };

  const uniqueGranjas = useMemo(() => {
    const granjas = evaluations.map(e => String(e.granja)).filter(Boolean);
    return Array.from(new Set(granjas)).sort();
  }, [evaluations]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(form);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => {
      const updates = {
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      };
      
      if (name === 'granja') {
        // Encontrar la evaluación más reciente de esta granja para obtener la fecha de siembra
        const evaluation = [...evaluations].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()).find(ev => ev.granja === value);
        if (evaluation && evaluation.fecha_siembra) {
          updates.fechaSiembra = String(evaluation.fecha_siembra).split('T')[0];
        }
      }
      
      // Auto-calcular proyecciones de alimento si los campos relevantes cambian
      if (['pesoActual', 'densidadInicial', 'sobrevivencia'].includes(name)) {
        const totalOrganisms = updates.densidadInicial || 0;
        const survival = updates.sobrevivencia || 0;
        const weight = updates.pesoActual || 0;
        
        if (totalOrganisms > 0 && weight > 0) {
          const projection = calculateFeedProjection(totalOrganisms, survival, weight);
          updates.alimentoProyectadoDia = projection.projectedDailyKg;
          updates.alimentoProyectadoSemana = projection.projectedWeeklyKg;
        }
      }
      
      return updates;
    });
  };

  return (
    <div className="fixed inset-0 bg-[#072C52]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B4075] rounded-2xl border border-[#125699] shadow-2xl shadow-blue-900/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Cargar Datos de Producción (Muestreo)</h2>
          <button onClick={onCancel} className="text-blue-300 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {latestRecordsByPond.length > 0 && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <label className="block text-sm font-medium text-indigo-800 mb-2">Cargar datos desde estanque activo (Autocompletar)</label>
            <select onChange={handleLoadFromExisting} className="block w-full max-w-md rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-white text-slate-900">
              <option value="" className="text-slate-500">-- Seleccionar Granja - Estanque --</option>
              {latestRecordsByPond.map(r => (
                <option key={`${r.granja}-${r.estanque}`} value={`${r.granja}|${r.estanque}`} className="text-slate-900">
                  {r.granja} - Estanque {r.estanque} (Último muestreo: {r.fecha})
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Identificación</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300">Granja</label>
              <select name="granja" value={form.granja} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" required>
                <option value="" disabled>-- Selecciona una Granja --</option>
                {uniqueGranjas.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
                {uniqueGranjas.length === 0 && <option value="" disabled>No hay granjas evaluadas aún</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Estanque #</label>
              <input type="text" name="estanque" value={form.estanque} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Hectáreas (HAS)</label>
              <input type="number" step="0.01" name="hectareas" value={form.hectareas} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" required />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Biometría y Fechas</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Fecha Muestreo</label>
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Siembra</label>
                <input type="date" name="fechaSiembra" value={form.fechaSiembra} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-500 bg-slate-100 cursor-not-allowed" readOnly required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">P.Anterior (g)</label>
                <input type="number" step="0.01" name="pesoAnterior" value={form.pesoAnterior} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">P.Actual (g)</label>
                <input type="number" step="0.01" name="pesoActual" value={form.pesoActual} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Sobrevivencia %</label>
              <input type="number" name="sobrevivencia" value={form.sobrevivencia} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" required />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Densidad y Alimento</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300">Densidad Inicial (Org. Sembrados)</label>
              <input type="number" name="densidadInicial" value={form.densidadInicial} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Alimento Acumu.</label>
                <input type="number" name="alimentoAcumulado" value={form.alimentoAcumulado} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Proy. Día (kg)</label>
                <input type="number" name="alimentoProyectadoDia" value={form.alimentoProyectadoDia} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Alim. Proy. Semanal</label>
                <input type="number" name="alimentoProyectadoSemana" value={form.alimentoProyectadoSemana} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Laboratorio</label>
                <input type="text" name="laboratorio" value={form.laboratorio} onChange={handleChange} className="mt-1 block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-slate-900 bg-white" />
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end space-x-4 mt-8 pt-6 border-t border-[#125699]">
            <button type="button" onClick={onCancel} className="px-6 py-2 text-blue-200 font-medium hover:bg-[#0F4C8A] rounded-lg transition-colors border border-transparent hover:border-[#1B66B0]">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">Guardar en Producción</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PondForm;