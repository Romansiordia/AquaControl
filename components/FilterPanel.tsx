import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterState {
  fechaDesde: string;
  fechaHasta: string;
  alimentos: string[];
  laboratorios: string[];
  estanques: string[];
  granja: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  formatOption?: (val: string) => string;
  allLabel?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  formatOption = (v) => v,
  allLabel = 'Todos',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const toggleValue = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((item) => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const buttonText =
    selected.length === 0
      ? allLabel
      : selected.length <= 3
      ? selected.map(formatOption).join(', ')
      : `${selected.length} seleccionados`;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-blue-300 mb-1">
        {label}
        {selected.length > 0 && (
          <span className="ml-1.5 text-[10px] text-amber-300 font-bold">
            ({selected.length})
          </span>
        )}
      </label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full text-sm rounded-lg border p-2 bg-[#072C52] text-white flex items-center justify-between gap-2 transition-colors ${
          selected.length > 0
            ? 'border-amber-400/70 ring-1 ring-amber-400/30'
            : 'border-[#1B66B0] hover:border-blue-400'
        }`}
      >
        <span className="truncate text-left">{buttonText}</span>
        <ChevronDown
          className={`w-4 h-4 text-blue-300 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 bg-[#062444] border border-[#1B66B0] rounded-xl shadow-2xl z-50 overflow-hidden min-w-[190px]">
          <div className="flex items-center justify-between px-3 py-2 bg-[#041D38] border-b border-[#125699] text-[11px]">
            <button
              type="button"
              onClick={() => onChange([])}
              className={`font-semibold transition-colors ${
                selected.length === 0 ? 'text-amber-300' : 'text-blue-300 hover:text-white'
              }`}
            >
              {allLabel}
            </button>
            {options.length > 1 && (
              <button
                type="button"
                onClick={() => onChange([...options])}
                className="text-blue-300 hover:text-white font-medium"
              >
                Marcar todos
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-[#125699]/30">
            {options.length === 0 ? (
              <div className="px-3 py-3 text-xs text-blue-300 text-center">
                Sin opciones
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleValue(opt)}
                    className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2.5 transition-colors ${
                      isSelected
                        ? 'bg-[#0F4C8A] text-white font-semibold'
                        : 'text-blue-100 hover:bg-[#0B4075]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-amber-400 border-amber-400 text-slate-950'
                          : 'border-blue-400/60 bg-[#072C52]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="truncate">{formatOption(opt)}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface Props {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  uniqueAlimentos: string[];
  uniqueLaboratorios: string[];
  uniqueEstanques: string[];
  uniqueGranjas: string[];
}

const FilterPanel: React.FC<Props> = ({
  filters,
  onFilterChange,
  uniqueAlimentos,
  uniqueLaboratorios,
  uniqueEstanques,
  uniqueGranjas,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'granja') {
      onFilterChange({ ...filters, granja: value, estanques: [] });
    } else {
      onFilterChange({ ...filters, [name]: value });
    }
  };

  const handleReset = () => {
    onFilterChange({
      fechaDesde: '',
      fechaHasta: '',
      alimentos: [],
      laboratorios: [],
      estanques: [],
      granja: '',
    });
  };

  return (
    <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z"
            />
          </svg>
          Filtros de Búsqueda
          <span className="text-[10px] font-normal normal-case text-blue-300 hidden sm:inline">
            (puedes marcar varios estanques, alimentos o laboratorios)
          </span>
        </h3>
        <button
          type="button"
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
            {uniqueGranjas.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <MultiSelectDropdown
          label="Estanque"
          options={uniqueEstanques}
          selected={filters.estanques}
          onChange={(estanques) => onFilterChange({ ...filters, estanques })}
          formatOption={(val) => `E${val}`}
          allLabel="Todos"
        />

        <MultiSelectDropdown
          label="Alimento"
          options={uniqueAlimentos}
          selected={filters.alimentos}
          onChange={(alimentos) => onFilterChange({ ...filters, alimentos })}
          allLabel="Todos"
        />

        <MultiSelectDropdown
          label="Laboratorio"
          options={uniqueLaboratorios}
          selected={filters.laboratorios}
          onChange={(laboratorios) => onFilterChange({ ...filters, laboratorios })}
          allLabel="Todos"
        />

        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Fecha Desde</label>
          <input
            type="date"
            name="fechaDesde"
            value={filters.fechaDesde}
            onChange={handleChange}
            className="w-full text-sm rounded-lg border-[#1B66B0] focus:ring-blue-500 focus:border-blue-500 border p-2 bg-[#072C52] text-white [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-blue-300 mb-1">Fecha Hasta</label>
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
