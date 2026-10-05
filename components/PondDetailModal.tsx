import React, { useMemo } from 'react';
import { PondRecord, HarvestRecord } from '../types';
import { formatNumber, formatDate, normalizeEstanque, calculatePondNetMetrics } from '../utils';
import { X, Scale, Fish, Layers, Flame, TrendingUp, Calendar, ShieldCheck, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface Props {
  pondId: string;
  records: PondRecord[];
  harvests?: HarvestRecord[];
  onClose: () => void;
}

const PondDetailModal: React.FC<Props> = ({ pondId, records, harvests = [], onClose }) => {
  // Find current pond record
  const currentRecord = useMemo(() => {
    return records.find(r => r.id === pondId) || records[0];
  }, [records, pondId]);

  // All historical records for this specific pond
  const pondHistory = useMemo(() => {
    if (!currentRecord) return [];
    return records
      .filter(r =>
        r.granja?.toLowerCase().trim() === currentRecord.granja?.toLowerCase().trim() &&
        normalizeEstanque(r.estanque) === normalizeEstanque(currentRecord.estanque)
      )
      .sort((a, b) => new Date(a.fecha || '').getTime() - new Date(b.fecha || '').getTime());
  }, [records, currentRecord]);

  // Net metrics for the latest record
  const net = useMemo(() => {
    if (!currentRecord) return null;
    return calculatePondNetMetrics(currentRecord, harvests);
  }, [currentRecord, harvests]);

  if (!currentRecord || !net) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#072C52] border border-[#1B5CB3] rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#125699] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black text-xl">
              E{normalizeEstanque(currentRecord.estanque)}
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Estanque {normalizeEstanque(currentRecord.estanque)}</span>
                <span className="text-sm font-semibold text-blue-300">({currentRecord.granja})</span>
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {currentRecord.hectareas} Has | Siembra: {currentRecord.fechaSiembra || '-'} | Días: {currentRecord.diasCultivo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/60 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699]">
            <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <Fish className="w-4 h-4 text-emerald-400" />
              <span>Biomasa en Agua</span>
            </p>
            <p className="text-xl font-black text-white mt-1">
              {formatNumber(net.biomasaEnAgua)} kg
            </p>
            <p className="text-[11px] text-blue-300 mt-0.5">
              {formatNumber(net.biomasaHaEnAgua)} kg/ha
            </p>
          </div>

          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699]">
            <p className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Pre-cosechas Extraídas</span>
            </p>
            <p className="text-xl font-black text-amber-400 mt-1">
              {formatNumber(net.kilosExtraidos)} kg
            </p>
            <p className="text-[11px] text-blue-300 mt-0.5">
              {net.porcentajeExtraidoBiomasa}% de la biomasa
            </p>
          </div>

          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699]">
            <p className="text-xs text-cyan-300 font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Biomasa Total Ciclo</span>
            </p>
            <p className="text-xl font-black text-cyan-300 mt-1">
              {formatNumber(net.biomasaTotal)} kg
            </p>
            <p className="text-[11px] text-blue-300 mt-0.5">
              Agua + Raleos
            </p>
          </div>

          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699]">
            <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-400" />
              <span>FCA Poscosecha</span>
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-xl font-black text-emerald-400">
                {net.fcaPoscosecha > 0 ? net.fcaPoscosecha.toFixed(2) : '-'}
              </p>
              {net.fcaSinPrecosecha > net.fcaPoscosecha && (
                <span className="text-xs text-slate-400 line-through">
                  {net.fcaSinPrecosecha.toFixed(2)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              {net.diferenciaFca > 0 ? `-${net.diferenciaFca.toFixed(2)} ahorro` : 'Conversión'}
            </p>
          </div>
        </div>

        {/* Growth Curve Chart */}
        <div className="bg-[#093661] p-5 rounded-xl border border-[#125699]">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Curva de Crecimiento Histórico (Gramos)</span>
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pondHistory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#125699" opacity={0.5} />
                <XAxis dataKey="fecha" stroke="#93c5fd" fontSize={11} />
                <YAxis stroke="#93c5fd" fontSize={11} unit="g" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#072C52', borderColor: '#1B5CB3', borderRadius: '8px', color: '#fff' }}
                  formatter={(val: any) => [`${val} g`, 'Peso Actual']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#93c5fd' }} />
                <Line
                  type="monotone"
                  dataKey="pesoActual"
                  name="Peso Actual"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Harvest stages list */}
        {net.stages && net.stages.length > 0 && (
          <div className="bg-[#0B4075] p-4 rounded-xl border border-[#125699] space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Eventos de Pre-cosecha Registrados</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {net.stages.map((st, idx) => (
                <div key={idx} className="bg-[#072C52] p-3 rounded-lg border border-[#125699]">
                  <p className="text-xs font-bold text-white">{st.etapa || st.name || `Etapa ${idx + 1}`}</p>
                  <p className="text-[11px] text-blue-300 mt-1">
                    Kilos: <span className="font-bold text-amber-300">{formatNumber(st.kilos)} kg</span>
                  </p>
                  <p className="text-[11px] text-blue-300">
                    Peso Promedio: <span className="font-bold text-slate-200">{st.gramos} g</span>
                  </p>
                  <p className="text-[11px] text-blue-300">
                    Organismos: <span className="font-bold text-cyan-300">{formatNumber(st.organismos || st.org || 0)}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="bg-[#0B4075] hover:bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PondDetailModal;
