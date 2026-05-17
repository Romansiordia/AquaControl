
import React from 'react';

export interface FilterState {
  fechaDesde: string;
  fechaHasta: string;
  alimento: string;
  laboratorio: string;
  estanque: string;
  granja: string;
}

interface Props {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  uniqueAlimentos: string[];
  uniqueLaboratorios: string[];
  uniqueEstanques: number[];
  uniqueGranjas: string[];
}

const FilterPanel: React.FC<Props> = ({ 
  filters, 
  onFilterChange, 
  uniqueAlimentos, 
  uniqueLaboratorios, 
  uniqueEstanques,
  uniqueGranjas
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleReset = () => {
    onFilterChange({
      fechaDesde: '',
      fechaHasta: '',
      alimento: '',
      laboratorio: '',
      estanque: '',
      granja: ''
    });
  };

  return (
    <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
          </svg>
          Filtros de Búsqueda
        </h3>
        <button 
          onClick={handleReset}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          Limpiar Filtros
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Granja</label>
          <select 
            name="granja" 
            value={filters.granja} 
            onChange={handleChange}
            className="w-full text-sm rounded-lg border-[#1B66B0] focus:ring-blue-500 focus:border-blue-500 border p-2 bg-[#072C52] text-white"
          >
            <option value="">Todas</option>
            {uniqueGranjas.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Estanque</label>
          <select 
            name="estanque" 
            value={filters.estanque} 
            onChange={handleChange}
            className="w-full text-sm rounded-lg border-[#1B66B0] focus:ring-blue-500 focus:border-blue-500 border p-2 bg-[#072C52] text-white"
          >
            <option value="">Todos</option>
            {uniqueEstanques.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Alimento</label>
          <select 
            name="alimento" 
            value={filters.alimento} 
            onChange={handleChange}
            className="w-full text-sm rounded-lg border-[#1B66B0] focus:ring-blue-500 focus:border-blue-500 border p-2 bg-[#072C52] text-white"
          >
            <option value="">Todos</option>
            {uniqueAlimentos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Laboratorio</label>
          <select 
            name="laboratorio" 
            value={filters.laboratorio} 
            onChange={handleChange}
            className="w-full text-sm rounded-lg border-[#1B66B0] focus:ring-blue-500 focus:border-blue-500 border p-2 bg-[#072C52] text-white"
          >
            <option value="">Todos</option>
            {uniqueLaboratorios.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Desde (Siembra)</label>
          <input 
            type="date" 
            name="fechaDesde" 
            value={filters.fechaDesde} 
            onChange={handleChange}
            className="w-full text-sm rounded-lg border-[#1B66B0] focus:ring-blue-500 focus:border-blue-500 border p-2 bg-[#072C52] text-white [color-scheme:dark]" 
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Hasta (Siembra)</label>
          <input 
            type="date" 
            name="fechaHasta" 
            value={filters.fechaHasta} 
            onChange={handleChange}
            className="w-full text-sm rounded-lg border-[#1B66B0] focus:ring-blue-500 focus:border-blue-500 border p-2 bg-[#072C52] text-white [color-scheme:dark]" 
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
