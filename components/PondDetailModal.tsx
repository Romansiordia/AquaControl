import React, { useMemo } from 'react';
import { PondRecord, HarvestRecord } from '../types';
import { formatNumber, formatDate, normalizeEstanque, calculatePondNetMetrics } from '../utils';
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
import { Scale, Fish, ArrowDownRight, Layers, X, Calendar, Activity } from 'lucide-react';

interface Props {
  pondId: string | number;
  records: PondRecord[];
  harvests?: HarvestRecord[];
  onClose: () => void;
}

const PondDetailModal: React.FC<Props> = ({ pondId, records, harvests = [], onClose }) => {
  const normTarget = normalizeEstanque(pondId);

  const pondHistory = useMemo(() => {
    return records
      .filter(r => normalizeEstanque(r.estanque) === normTarget)
      .sort((a, b) => (Number(a.diasCultivo) || 0) - (Number(b.diasCultivo) || 0));
  }, [records, normTarget]);

  const latestRecord = useMemo(() => {
    if (pondHistory.length === 0) return null;
    return pondHistory[pondHistory.length - 1];
  }, [pondHistory]);

  const netMetrics = useMemo(() => {
    if (!latestRecord) return null;
    return calculatePondNetMetrics(latestRecord, harvests);
  }, [latestRecord, harvests]);

  if (!latestRecord) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#0B4075] border border-[#125699] rounded-2xl p-6 text-white text-center max-w-sm w-full">
          <p className="text-slate-300 mb-4">No se encontraron registros para el estanque #{pondId}</p>
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B4075] border border-[#125699] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col p-6 sm:p-8 text-white">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#125699]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#072C52] border border-[#1963ad] rounded-xl text-blue-400">
              <Fish className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">Estanque #{pondId}</h2>
                {latestRecord.granja && (
                  <span className="text-xs bg-blue-900/60 border border-blue-600/40 text-blue-200 px-2.5 py-0.5 rounded-md font-semibold">
                    {latestRecord.granja}
                  </span>
                )}
                {netMetrics?.tieneExtracciones && (
                  <span className="text-xs bg-orange-950/70 border border-orange-500/50 text-orange-300 px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" /> Con Pre-cosechas ({netMetrics.stages.length})
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-300 mt-0.5">
                {latestRecord.hectareas} Has • Siembra: {formatDate(latestRecord.fechaSiembra)} • {latestRecord.diasCultivo} días de cultivo
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-blue-300 hover:text-white p-2 rounded-lg hover:bg-[#125699] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Extraction Net Balance Highlight Banner (if extractions exist) */}
        {netMetrics && netMetrics.tieneExtracciones && (
          <div className="bg-[#072C52] border border-[#1963ad] rounded-xl p-4 mb-6 shadow-inner">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 border-b border-[#125699]/60 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> Balance de Extracciones y Biomasa Activa en Agua
              </h3>
              <div className="text-[11px] text-blue-200">
                Extracción total acumulada: <strong className="text-orange-300 font-bold">{netMetrics.porcentajeExtraidoBiomasa}%</strong> de biomasa
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="bg-[#0B4075] p-2.5 rounded-lg border border-[#125699]">
                <p className="text-[10px] text-blue-300 uppercase font-semibold">Biomasa Teórica</p>
                <p className="text-base font-bold text-white mt-0.5">{formatNumber(netMetrics.biomasaTeorica)} kg</p>
                <p className="text-[10px] text-slate-400">{formatNumber(netMetrics.poblacionTeorica)} orgs</p>
              </div>

              <div className="bg-orange-950/40 p-2.5 rounded-lg border border-orange-700/40">
                <p className="text-[10px] text-orange-300 uppercase font-semibold">Total Pre-Cosechado</p>
                <p className="text-base font-bold text-orange-400 mt-0.5">-{formatNumber(netMetrics.kilosExtraidos)} kg</p>
                <p className="text-[10px] text-orange-300/80">-{formatNumber(netMetrics.organismosExtraidos)} orgs</p>
              </div>

              <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-600/40">
                <p className="text-[10px] text-emerald-300 uppercase font-semibold">Biomasa en Agua</p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">{formatNumber(netMetrics.biomasaEnAgua)} kg</p>
                <p className="text-[10px] text-emerald-300/80">{netMetrics.porcentajeRestanteBiomasa}% remanente</p>
              </div>

              <div className="bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-600/40">
                <p className="text-[10px] text-cyan-300 uppercase font-semibold">Densidad en Agua</p>
                <p className="text-base font-bold text-cyan-300 mt-0.5">{formatNumber(netMetrics.camM2EnAgua)} cam/m²</p>
                <p className="text-[10px] text-cyan-300/80">Alim: {formatNumber(netMetrics.alimentoProyectadoDiaAjustado)} kg/d</p>
              </div>

              <div className="bg-amber-950/30 p-2.5 rounded-lg border border-amber-600/40">
                <p className="text-[10px] text-amber-300 uppercase font-semibold">FCA S/ Pre-Cosecha</p>
                <p className="text-base font-bold text-amber-300 mt-0.5">{netMetrics.fcaSinPrecosecha.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400">Teórico inicial</p>
              </div>

              <div className="bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-500/60 shadow-sm">
                <p className="text-[10px] text-emerald-300 uppercase font-semibold">FCA Poscosecha</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">{netMetrics.fcaAjustado.toFixed(2)}</p>
                <p className="text-[10px] text-emerald-300/80">Global Real</p>
              </div>
            </div>
          </div>
        )}

        {/* Standard Sampling KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#072C52] p-3 rounded-xl border border-[#125699]">
            <p className="text-[11px] text-blue-300 font-semibold uppercase">Último Peso</p>
            <p className="text-xl font-black text-emerald-400">{formatNumber(latestRecord.pesoActual)} g</p>
            <p className="text-[10px] text-blue-300">Inc: +{formatNumber(latestRecord.incrementoSemanal)} g/sem</p>
          </div>
          <div className="bg-[#072C52] p-3 rounded-xl border border-[#125699]">
            <p className="text-[11px] text-blue-300 font-semibold uppercase">Supervivencia</p>
            <p className="text-xl font-black text-white">{formatNumber(latestRecord.sobrevivencia)}%</p>
            <p className="text-[10px] text-blue-300">Días: {latestRecord.diasCultivo} d</p>
          </div>
          <div className="bg-[#072C52] p-3 rounded-xl border border-[#125699]">
            <p className="text-[11px] text-blue-300 font-semibold uppercase">
              {netMetrics?.tieneExtracciones ? 'FCA Poscosecha' : 'FCA Estimado'}
            </p>
            <p className="text-xl font-black text-emerald-400">
              {netMetrics?.tieneExtracciones 
                ? netMetrics.fcaAjustado.toFixed(2) 
                : formatNumber(latestRecord.fca)}
            </p>
            <p className="text-[10px] text-blue-300">
              {netMetrics?.tieneExtracciones 
                ? `S/ Pre-cosecha: ${netMetrics.fcaSinPrecosecha.toFixed(2)}`
                : `Alim Acum: ${formatNumber(latestRecord.alimentoAcumulado)} kg`}
            </p>
          </div>
          <div className="bg-[#072C52] p-3 rounded-xl border border-[#125699]">
            <p className="text-[11px] text-blue-300 font-semibold uppercase">Población Activa</p>
            <p className="text-xl font-black text-cyan-300">
              {formatNumber(netMetrics ? netMetrics.poblacionEnAgua : latestRecord.densidadActual)}
            </p>
            <p className="text-[10px] text-blue-300">
              {netMetrics ? `${formatNumber(netMetrics.camM2EnAgua)} cam/m²` : `${formatNumber(latestRecord.camM2Actual)} cam/m²`}
            </p>
          </div>
        </div>

        {/* Growth Curve Chart */}
        <div className="h-60 sm:h-72 w-full mb-6 bg-[#072C52] p-4 rounded-xl border border-[#125699]">
          <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> Curva de Crecimiento del Estanque #{pondId}
          </h4>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={pondHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
              <XAxis dataKey="diasCultivo" unit=" d" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="left" unit="g" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #125699', 
                  backgroundColor: '#072C52', 
                  color: '#fff' 
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              <Line yAxisId="left" type="monotone" dataKey="pesoActual" name="Peso (g)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              <Line yAxisId="left" type="monotone" dataKey="incrementoSemanal" name="Incremento (g)" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pre-harvest Stages Flow Table (if extractions exist) */}
        {netMetrics && netMetrics.tieneExtracciones && netMetrics.stages.length > 0 && (
          <div className="mb-6 bg-[#072C52] rounded-xl border border-[#125699] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#093561] border-b border-[#125699] flex justify-between items-center">
              <h4 className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-orange-400" /> Historial de Pre-cosechas del Estanque
              </h4>
              <span className="text-[11px] text-orange-200 bg-orange-900/40 px-2 py-0.5 rounded border border-orange-600/30">
                {netMetrics.stages.length} Extracciones Registradas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-[#0B4075] text-blue-200 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="px-3 py-2 border-b border-r border-[#125699]">Etapa</th>
                    <th className="px-3 py-2 border-b border-r border-[#125699]">Fecha</th>
                    <th className="px-3 py-2 border-b border-r border-[#125699]">Kilos Sacados</th>
                    <th className="px-3 py-2 border-b border-r border-[#125699]">Peso Prom. (g)</th>
                    <th className="px-3 py-2 border-b border-r border-[#125699]">Organismos Retirados</th>
                    <th className="px-3 py-2 border-b border-r border-[#125699]">Kilos Acum.</th>
                    <th className="px-3 py-2 border-b border-[#125699] text-emerald-300">FCA Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#125699]">
                  {netMetrics.stages.map((stage, sIdx) => (
                    <tr key={sIdx} className="hover:bg-[#0B4075]/70 text-slate-200">
                      <td className="px-3 py-2 border-r border-[#125699] font-bold text-orange-300">{stage.etapa}</td>
                      <td className="px-3 py-2 border-r border-[#125699]">{stage.fecha || 'S/F'}</td>
                      <td className="px-3 py-2 border-r border-[#125699] font-bold text-white">{formatNumber(stage.kilos)} kg</td>
                      <td className="px-3 py-2 border-r border-[#125699] text-emerald-400">{formatNumber(stage.gramos)} g</td>
                      <td className="px-3 py-2 border-r border-[#125699] font-semibold text-blue-300">{formatNumber(stage.organismos)} orgs</td>
                      <td className="px-3 py-2 border-r border-[#125699] text-slate-200">{formatNumber(stage.kilosAcumulados || stage.kilos)} kg</td>
                      <td className="px-3 py-2 font-bold text-emerald-400">{stage.fcaEtapa ? stage.fcaEtapa.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#093561] font-bold text-white">
                    <td colSpan={2} className="px-3 py-2 border-r border-[#125699] text-right uppercase text-[10px] text-orange-200">Total Extraído:</td>
                    <td className="px-3 py-2 border-r border-[#125699] text-orange-400">{formatNumber(netMetrics.kilosExtraidos)} kg</td>
                    <td className="px-3 py-2 border-r border-[#125699] text-emerald-400">-</td>
                    <td className="px-3 py-2 border-r border-[#125699] text-blue-300">{formatNumber(netMetrics.organismosExtraidos)} orgs</td>
                    <td className="px-3 py-2 border-r border-[#125699] text-slate-200">{formatNumber(netMetrics.kilosExtraidos)} kg</td>
                    <td className="px-3 py-2 font-black text-emerald-400">{netMetrics.fcaAjustado.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sampling records history table */}
        <div className="overflow-y-auto max-h-48 rounded-xl border border-[#125699] bg-[#072C52]">
          <div className="px-4 py-2 bg-[#093561] border-b border-[#125699] flex justify-between items-center sticky top-0 z-10">
            <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Historial de Muestreos Semanales
            </h4>
            <span className="text-[10px] text-slate-400">{pondHistory.length} Registros</span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0B4075] text-blue-300 text-[10px] uppercase font-bold sticky top-8 z-10">
              <tr>
                <th className="p-2 border-b border-r border-[#125699]">Días</th>
                <th className="p-2 border-b border-r border-[#125699]">Fecha</th>
                <th className="p-2 border-b border-r border-[#125699]">Peso (g)</th>
                <th className="p-2 border-b border-r border-[#125699]">Inc. (g)</th>
                <th className="p-2 border-b border-r border-[#125699]">Superv.</th>
                <th className="p-2 border-b border-r border-[#125699]">Biomasa (kg)</th>
                <th className="p-2 border-b border-[#125699]">FCA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#125699]">
              {pondHistory.slice().reverse().map(r => (
                <tr key={r.id} className="hover:bg-[#0B4075]/70 text-slate-200">
                  <td className="p-2 border-r border-[#125699] font-medium">{r.diasCultivo}</td>
                  <td className="p-2 border-r border-[#125699]">{cleanDateString(r.fecha) || cleanDateString(r.fechaSiembra)}</td>
                  <td className="p-2 border-r border-[#125699] text-emerald-400 font-bold">{formatNumber(r.pesoActual)}</td>
                  <td className="p-2 border-r border-[#125699] text-blue-300">+{formatNumber(r.incrementoSemanal)}</td>
                  <td className="p-2 border-r border-[#125699]">{formatNumber(r.sobrevivencia)}%</td>
                  <td className="p-2 border-r border-[#125699] font-semibold text-white">{formatNumber(r.biomasaTotal)}</td>
                  <td className="p-2 text-amber-400">{formatNumber(r.fca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default PondDetailModal;
