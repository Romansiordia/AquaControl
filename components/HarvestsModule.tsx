import React, { useState, useMemo, useEffect, useRef } from 'react';
import { HarvestRecord, PondRecord } from '../types';
import { Plus, Save, X, Edit2, Trash2, ChevronLeft, ChevronRight, Scale, BarChart2, Hash, Sparkles, FileSpreadsheet, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatNumber, formatDate, normalizeEstanque, cleanDateString, parseFlexibleNumber } from '../utils';
import { calculateStageOrganismos, parseHarvestWorksheet, normalizeHarvestRecord } from '../utils/harvestUtils';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';

interface HarvestsModuleProps {
  records: PondRecord[];
  harvests: HarvestRecord[];
  onAddHarvest: (harvest: HarvestRecord) => void;
  onEditHarvest: (harvest: HarvestRecord) => void;
  onDeleteHarvest: (id: string) => void;
  onClearAllHarvests?: () => void;
  onDeleteByGranja?: (granja: string) => void;
  onImportHarvests?: (newHarvests: HarvestRecord[]) => void;
}

const HarvestsModule: React.FC<HarvestsModuleProps> = ({
  records,
  harvests,
  onAddHarvest,
  onEditHarvest,
  onDeleteHarvest,
  onClearAllHarvests,
  onDeleteByGranja,
  onImportHarvests,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<HarvestRecord | null>(null);
  const harvestFileInputRef = useRef<HTMLInputElement>(null);

  // Filter States
  const [granjaFilter, setGranjaFilter] = useState('');
  const [estanqueFilter, setEstanqueFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  // Form Fields State
  const [formGranja, setFormGranja] = useState('');
  const [formEstanque, setFormEstanque] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]);

  const [fecha1, setFecha1] = useState('');
  const [pre1Kilos, setPre1Kilos] = useState('');
  const [pre1Gramos, setPre1Gramos] = useState('');
  const [pre1Organismos, setPre1Organismos] = useState('');

  const [fecha2, setFecha2] = useState('');
  const [pre2Kilos, setPre2Kilos] = useState('');
  const [pre2Gramos, setPre2Gramos] = useState('');
  const [pre2Organismos, setPre2Organismos] = useState('');

  const [fecha3, setFecha3] = useState('');
  const [pre3Kilos, setPre3Kilos] = useState('');
  const [pre3Gramos, setPre3Gramos] = useState('');
  const [pre3Organismos, setPre3Organismos] = useState('');

  const [fecha4, setFecha4] = useState('');
  const [pre4Kilos, setPre4Kilos] = useState('');
  const [pre4Gramos, setPre4Gramos] = useState('');
  const [pre4Organismos, setPre4Organismos] = useState('');

  const [pre5Kilos, setPre5Kilos] = useState('');
  const [pre5Gramos, setPre5Gramos] = useState('');
  const [pre5Organismos, setPre5Organismos] = useState('');

  const [finalKilos, setFinalKilos] = useState('');
  const [finalGramos, setFinalGramos] = useState('');
  const [finalOrganismos, setFinalOrganismos] = useState('');

  // Fast map of pond attributes (hectareas, sembrados, etc.) by key `${granja}_${estanque}`
  const pondDataMap = useMemo(() => {
    const map = new Map<string, { hectareas: number; sembrados: number; sobrevivencia: number; pesoActual: number; biomasaTotal: number; densidadActual: number }>();
    records.forEach(r => {
      const g = (r.granja || '').toString().trim().toLowerCase();
      const e = normalizeEstanque(r.estanque);
      if (e) {
        const key = `${g}_${e}`;
        const sembrados = r.densidadInicial || r.organismosSembrados || 0;
        const hectareas = r.hectareas || 0;
        let sobrevivencia = r.sobrevivencia || 0;
        if (sobrevivencia > 0 && sobrevivencia <= 1) {
          sobrevivencia = Number((sobrevivencia * 100).toFixed(1));
        }
        const pesoActual = r.pesoActual || 0;
        const biomasaTotal = r.biomasaTotal || 0;
        const densidadActual = r.densidadActual || (sembrados > 0 && sobrevivencia > 0 ? Math.round(sembrados * (sobrevivencia / 100)) : 0);

        if (!map.has(key)) {
          map.set(key, {
            hectareas,
            sembrados,
            sobrevivencia,
            pesoActual,
            biomasaTotal,
            densidadActual
          });
        } else {
          const existing = map.get(key)!;
          if ((!existing.sembrados || existing.sembrados === 0) && sembrados > 0) {
            existing.sembrados = sembrados;
          }
          if ((!existing.hectareas || existing.hectareas === 0) && hectareas > 0) {
            existing.hectareas = hectareas;
          }
          if (sobrevivencia > 0) existing.sobrevivencia = sobrevivencia;
          if (pesoActual > 0) existing.pesoActual = pesoActual;
          if (biomasaTotal > 0) existing.biomasaTotal = biomasaTotal;
          if (densidadActual > 0) existing.densidadActual = densidadActual;
        }
      }
    });
    return map;
  }, [records]);

  const getPondData = (granja: string, estanque: string) => {
    const g = (granja || '').toString().trim().toLowerCase();
    const e = normalizeEstanque(estanque);
    if (!e) return undefined;

    // 1. Direct match with granja + estanque
    if (g && pondDataMap.has(`${g}_${e}`)) {
      return pondDataMap.get(`${g}_${e}`);
    }

    // 2. Partial match on granja name
    if (g) {
      for (const [k, v] of pondDataMap.entries()) {
        const [kGranja, kEst] = k.split('_');
        if (kEst === e && (kGranja.includes(g) || g.includes(kGranja))) {
          return v;
        }
      }
    }

    // 3. Fallback: match by estanque with sembrados > 0
    for (const [k, v] of pondDataMap.entries()) {
      if (k.endsWith(`_${e}`) && v.sembrados > 0) {
        return v;
      }
    }

    // 4. Any match by estanque
    for (const [k, v] of pondDataMap.entries()) {
      if (k.endsWith(`_${e}`)) {
        return v;
      }
    }

    return undefined;
  };

  // Extract unique options from existing production records for convenience
  const uniqueGranjas = useMemo(() => {
    const fromRecords = records.map(r => r.granja);
    const fromHarvests = harvests.map(h => h.granja);
    return Array.from(new Set([...fromRecords, ...fromHarvests])).filter(Boolean).sort();
  }, [records, harvests]);

  const uniqueEstanques = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => {
      if (granjaFilter === '' || r.granja?.toString().trim().toLowerCase() === granjaFilter.trim().toLowerCase()) {
        const norm = normalizeEstanque(r.estanque);
        if (norm) set.add(norm);
      }
    });
    harvests.forEach(h => {
      if (granjaFilter === '' || h.granja?.toString().trim().toLowerCase() === granjaFilter.trim().toLowerCase()) {
        const norm = normalizeEstanque(h.estanque);
        if (norm) set.add(norm);
      }
    });
    return Array.from(set).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [records, harvests, granjaFilter]);

  // Handle Automatic Calculations with Optional Overrides
  const calculatedPre1Org = useMemo(() => {
    const kilos = parseFloat(pre1Kilos) || 0;
    const grams = parseFloat(pre1Gramos) || 0;
    if (kilos > 0 && grams > 0) {
      return Math.round((kilos * 1000) / grams);
    }
    return 0;
  }, [pre1Kilos, pre1Gramos]);

  const calculatedPre2Org = useMemo(() => {
    const kilos = parseFloat(pre2Kilos) || 0;
    const grams = parseFloat(pre2Gramos) || 0;
    if (kilos > 0 && grams > 0) {
      return Math.round((kilos * 1000) / grams);
    }
    return 0;
  }, [pre2Kilos, pre2Gramos]);

  const calculatedPre3Org = useMemo(() => {
    const kilos = parseFloat(pre3Kilos) || 0;
    const grams = parseFloat(pre3Gramos) || 0;
    if (kilos > 0 && grams > 0) {
      return Math.round((kilos * 1000) / grams);
    }
    return 0;
  }, [pre3Kilos, pre3Gramos]);

  const calculatedPre4Org = useMemo(() => {
    const kilos = parseFloat(pre4Kilos) || 0;
    const grams = parseFloat(pre4Gramos) || 0;
    if (kilos > 0 && grams > 0) {
      return Math.round((kilos * 1000) / grams);
    }
    return 0;
  }, [pre4Kilos, pre4Gramos]);

  const calculatedPre5Org = useMemo(() => {
    const kilos = parseFloat(pre5Kilos) || 0;
    const grams = parseFloat(pre5Gramos) || 0;
    if (kilos > 0 && grams > 0) {
      return Math.round((kilos * 1000) / grams);
    }
    return 0;
  }, [pre5Kilos, pre5Gramos]);

  const calculatedFinalOrg = useMemo(() => {
    const kilos = parseFloat(finalKilos) || 0;
    const grams = parseFloat(finalGramos) || 0;
    if (kilos > 0 && grams > 0) {
      return Math.round((kilos * 1000) / grams);
    }
    return 0;
  }, [finalKilos, finalGramos]);

  // Set initial calculation values to inputs if they are calculated and inputs are empty or haven't been manually altered
  useEffect(() => {
    if (calculatedPre1Org > 0 && !pre1Organismos) {
      setPre1Organismos(calculatedPre1Org.toString());
    }
  }, [calculatedPre1Org, pre1Organismos]);

  useEffect(() => {
    if (calculatedPre2Org > 0 && !pre2Organismos) {
      setPre2Organismos(calculatedPre2Org.toString());
    }
  }, [calculatedPre2Org, pre2Organismos]);

  useEffect(() => {
    if (calculatedPre3Org > 0 && !pre3Organismos) {
      setPre3Organismos(calculatedPre3Org.toString());
    }
  }, [calculatedPre3Org, pre3Organismos]);

  useEffect(() => {
    if (calculatedPre4Org > 0 && !pre4Organismos) {
      setPre4Organismos(calculatedPre4Org.toString());
    }
  }, [calculatedPre4Org, pre4Organismos]);

  useEffect(() => {
    if (calculatedPre5Org > 0 && !pre5Organismos) {
      setPre5Organismos(calculatedPre5Org.toString());
    }
  }, [calculatedPre5Org, pre5Organismos]);

  useEffect(() => {
    if (calculatedFinalOrg > 0 && !finalOrganismos) {
      setFinalOrganismos(calculatedFinalOrg.toString());
    }
  }, [calculatedFinalOrg, finalOrganismos]);

  // Dynamic preview of summary metrics
  const tempTotalKilos = useMemo(() => {
    return (parseFloat(pre1Kilos) || 0) + 
           (parseFloat(pre2Kilos) || 0) + 
           (parseFloat(pre3Kilos) || 0) + 
           (parseFloat(pre4Kilos) || 0) + 
           (parseFloat(pre5Kilos) || 0) + 
           (parseFloat(finalKilos) || 0);
  }, [pre1Kilos, pre2Kilos, pre3Kilos, pre4Kilos, pre5Kilos, finalKilos]);

  const tempTotalOrganismos = useMemo(() => {
    return (parseInt(pre1Organismos) || calculatedPre1Org) + 
           (parseInt(pre2Organismos) || calculatedPre2Org) + 
           (parseInt(pre3Organismos) || calculatedPre3Org) + 
           (parseInt(pre4Organismos) || calculatedPre4Org) + 
           (parseInt(pre5Organismos) || calculatedPre5Org) + 
           (parseInt(finalOrganismos) || calculatedFinalOrg);
  }, [pre1Organismos, pre2Organismos, pre3Organismos, pre4Organismos, pre5Organismos, finalOrganismos, calculatedPre1Org, calculatedPre2Org, calculatedPre3Org, calculatedPre4Org, calculatedPre5Org, calculatedFinalOrg]);

  // Matching pond record for the current form selection
  const matchingPondRecord = useMemo(() => {
    if (!formGranja || !formEstanque) return null;
    const matchEst = normalizeEstanque(formEstanque);
    const matchGranja = formGranja.trim().toLowerCase();
    
    return records.find(r => 
      r.granja?.toString().trim().toLowerCase() === matchGranja && 
      normalizeEstanque(r.estanque) === matchEst
    );
  }, [records, formGranja, formEstanque]);

  const pondStats = useMemo(() => {
    const pond = getPondData(formGranja, formEstanque);
    if (pond && pond.sembrados > 0) {
      return {
        sembrados: pond.sembrados,
        surv: pond.sobrevivencia || 100,
        pobVivaEst: pond.densidadActual || Math.round(pond.sembrados * ((pond.sobrevivencia || 100) / 100))
      };
    }
    if (matchingPondRecord) {
      const sembrados = matchingPondRecord.densidadInicial || matchingPondRecord.organismosSembrados || 0;
      let surv = matchingPondRecord.sobrevivencia || 100;
      if (surv > 0 && surv <= 1) surv = surv * 100;
      const pobVivaEst = matchingPondRecord.densidadActual || Math.round(sembrados * (surv / 100));
      return {
        sembrados,
        surv,
        pobVivaEst
      };
    }
    return null;
  }, [matchingPondRecord, formGranja, formEstanque, pondDataMap]);

  // Filter & Search Logic
  const filteredHarvests = useMemo(() => {
    const normFilterEstanque = normalizeEstanque(estanqueFilter);
    const normFilterGranja = granjaFilter.trim().toLowerCase();

    return harvests.filter(h => {
      const matchGranja = normFilterGranja === '' || 
        (h.granja !== undefined && h.granja !== null && 
         String(h.granja).trim().toLowerCase() === normFilterGranja);
      
      if (!matchGranja) return false;

      if (normFilterEstanque === '') return true;

      const normHestanque = normalizeEstanque(h.estanque);
      return normHestanque === normFilterEstanque;
    });
  }, [harvests, granjaFilter, estanqueFilter]);

  const [chartView, setChartView] = useState<'kilos' | 'organismos' | 'etapas' | 'tallas'>('kilos');

  const harvestChartData = useMemo(() => {
    return [...filteredHarvests]
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map(h => {
        const formattedDate = h.fecha ? new Date(h.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '';
        const p1K = parseFlexibleNumber(h.pre1Kilos);
        const p1G = parseFlexibleNumber(h.pre1Gramos);
        const p1Org = calculateStageOrganismos(p1K, p1G, h.pre1Organismos);

        const p2K = parseFlexibleNumber(h.pre2Kilos);
        const p2G = parseFlexibleNumber(h.pre2Gramos);
        const p2Org = calculateStageOrganismos(p2K, p2G, h.pre2Organismos);

        const p3K = parseFlexibleNumber(h.pre3Kilos);
        const p3G = parseFlexibleNumber(h.pre3Gramos);
        const p3Org = calculateStageOrganismos(p3K, p3G, h.pre3Organismos);

        const p4K = parseFlexibleNumber(h.pre4Kilos || h.finalKilos);
        const p4G = parseFlexibleNumber(h.pre4Gramos || h.finalGramos);
        const p4Org = calculateStageOrganismos(p4K, p4G, h.pre4Organismos || h.finalOrganismos);

        const p5K = parseFlexibleNumber(h.pre5Kilos);
        const p5G = parseFlexibleNumber(h.pre5Gramos);
        const p5Org = calculateStageOrganismos(p5K, p5G, h.pre5Organismos);

        const rowKilos = (h.totalKilos && parseFlexibleNumber(h.totalKilos) > 0)
          ? parseFlexibleNumber(h.totalKilos)
          : (p1K + p2K + p3K + p4K + p5K);
        const rowOrg = (h.totalOrganismos && parseFlexibleNumber(h.totalOrganismos) > 0)
          ? parseFlexibleNumber(h.totalOrganismos)
          : (p1Org + p2Org + p3Org + p4Org + p5Org);

        return {
          label: `${h.granja} - E${h.estanque} (${formattedDate})`,
          totalKilos: rowKilos,
          totalOrganismos: rowOrg,
          pre1Kilos: p1K,
          pre2Kilos: p2K,
          pre3Kilos: p3K,
          pre4Kilos: p4K,
          pre5Kilos: p5K,
          finalKilos: parseFlexibleNumber(h.finalKilos),
          pre1Gramos: p1G,
          pre2Gramos: p2G,
          pre3Gramos: p3G,
          pre4Gramos: p4G,
          pre5Gramos: p5G,
          finalGramos: parseFlexibleNumber(h.finalGramos),
        };
      });
  }, [filteredHarvests]);

  // Pagination Logic
  useEffect(() => {
    setCurrentPage(1);
  }, [granjaFilter, estanqueFilter]);

  const totalPages = Math.ceil(filteredHarvests.length / recordsPerPage);

  const paginatedHarvests = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredHarvests.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredHarvests, currentPage]);

  // General KPI Stats for Summary Cards
  const kpiStats = useMemo(() => {
    let totKilos = 0;
    let totOrganismos = 0;
    let weightedGramsSum = 0;
    
    let survSum = 0;
    let survCount = 0;

    let totHectareas = 0;
    let rendSum = 0;
    let rendCount = 0;
    const seenPonds = new Set<string>();

    filteredHarvests.forEach(h => {
      const p1K = parseFlexibleNumber(h.pre1Kilos);
      const p1G = parseFlexibleNumber(h.pre1Gramos);
      const p1Org = calculateStageOrganismos(p1K, p1G, h.pre1Organismos);

      const p2K = parseFlexibleNumber(h.pre2Kilos);
      const p2G = parseFlexibleNumber(h.pre2Gramos);
      const p2Org = calculateStageOrganismos(p2K, p2G, h.pre2Organismos);

      const p3K = parseFlexibleNumber(h.pre3Kilos);
      const p3G = parseFlexibleNumber(h.pre3Gramos);
      const p3Org = calculateStageOrganismos(p3K, p3G, h.pre3Organismos);

      const p4K = parseFlexibleNumber(h.pre4Kilos || h.finalKilos);
      const p4G = parseFlexibleNumber(h.pre4Gramos || h.finalGramos);
      const p4Org = calculateStageOrganismos(p4K, p4G, h.pre4Organismos || h.finalOrganismos);

      const p5K = parseFlexibleNumber(h.pre5Kilos);
      const p5G = parseFlexibleNumber(h.pre5Gramos);
      const p5Org = calculateStageOrganismos(p5K, p5G, h.pre5Organismos);

      const rowKilos = (h.totalKilos && parseFlexibleNumber(h.totalKilos) > 0)
        ? parseFlexibleNumber(h.totalKilos)
        : (p1K + p2K + p3K + p4K + p5K);
      const rowOrg = (h.totalOrganismos && parseFlexibleNumber(h.totalOrganismos) > 0)
        ? parseFlexibleNumber(h.totalOrganismos)
        : (p1Org + p2Org + p3Org + p4Org + p5Org);

      totKilos += rowKilos;
      totOrganismos += rowOrg;
      
      // Calculate weighted grams if possible
      const fK = parseFlexibleNumber(h.finalKilos);
      const fG = parseFlexibleNumber(h.finalGramos);
      
      const weightedGrams = (p1K * p1G) + (p2K * p2G) + (p3K * p3G) + (p4K * p4G) + (p5K * p5G) + (fK * fG);
      weightedGramsSum += weightedGrams;

      const pond = getPondData(h.granja, h.estanque);
      const pondHa = pond?.hectareas || 0;
      if (pondHa > 0) {
        const pondKey = `${h.granja}_${h.estanque}`;
        if (!seenPonds.has(pondKey)) {
          seenPonds.add(pondKey);
          totHectareas += pondHa;
        }
        if (rowKilos > 0) {
          rendSum += (rowKilos / pondHa);
          rendCount++;
        }
      }

      let surv = parseFlexibleNumber(h.sobrevivenciaFinal);
      if (surv > 0 && surv <= 1) {
        surv = surv * 100;
      }
      if (!surv) {
        if (pond && pond.sembrados > 0 && rowOrg > 0) {
          surv = Number(((rowOrg / pond.sembrados) * 100).toFixed(1));
        }
      }
      if (surv && surv > 0) {
        survSum += surv;
        survCount++;
      }
    });

    const avgWeight = totKilos > 0 ? (weightedGramsSum / totKilos) : 0;
    const avgSurvival = survCount > 0 ? (survSum / survCount) : 0;

    const rendimientoKgHa = totHectareas > 0 && totKilos > 0 
      ? Math.round(totKilos / totHectareas) 
      : (rendCount > 0 ? Math.round(rendSum / rendCount) : 0);

    return {
      totalKilos: totKilos,
      totalOrganismos: Math.round(totOrganismos),
      totalRegistros: filteredHarvests.length,
      pesoPromedio: avgWeight,
      sobrevivenciaPromedio: avgSurvival,
      rendimientoKgHa: rendimientoKgHa,
      totalHectareas: totHectareas
    };
  }, [filteredHarvests, pondDataMap]);

  // Populate form for editing
  const handleStartEdit = (harvest: HarvestRecord) => {
    setEditingHarvest(harvest);
    setFormGranja(harvest.granja);
    setFormEstanque(harvest.estanque);
    setFormFecha(harvest.fecha);

    setFecha1(harvest.fecha1 || harvest.fecha || '');
    setPre1Kilos(harvest.pre1Kilos ? harvest.pre1Kilos.toString() : '');
    setPre1Gramos(harvest.pre1Gramos ? harvest.pre1Gramos.toString() : '');
    setPre1Organismos(harvest.pre1Organismos ? harvest.pre1Organismos.toString() : '');

    setFecha2(harvest.fecha2 || '');
    setPre2Kilos(harvest.pre2Kilos ? harvest.pre2Kilos.toString() : '');
    setPre2Gramos(harvest.pre2Gramos ? harvest.pre2Gramos.toString() : '');
    setPre2Organismos(harvest.pre2Organismos ? harvest.pre2Organismos.toString() : '');

    setFecha3(harvest.fecha3 || '');
    setPre3Kilos(harvest.pre3Kilos ? harvest.pre3Kilos.toString() : '');
    setPre3Gramos(harvest.pre3Gramos ? harvest.pre3Gramos.toString() : '');
    setPre3Organismos(harvest.pre3Organismos ? harvest.pre3Organismos.toString() : '');

    setFecha4(harvest.fecha4 || '');
    setPre4Kilos(harvest.pre4Kilos ? harvest.pre4Kilos.toString() : '');
    setPre4Gramos(harvest.pre4Gramos ? harvest.pre4Gramos.toString() : '');
    setPre4Organismos(harvest.pre4Organismos ? harvest.pre4Organismos.toString() : '');

    setPre5Kilos(harvest.pre5Kilos ? harvest.pre5Kilos.toString() : '');
    setPre5Gramos(harvest.pre5Gramos ? harvest.pre5Gramos.toString() : '');
    setPre5Organismos(harvest.pre5Organismos ? harvest.pre5Organismos.toString() : '');

    setFinalKilos(harvest.finalKilos ? harvest.finalKilos.toString() : '');
    setFinalGramos(harvest.finalGramos ? harvest.finalGramos.toString() : '');
    setFinalOrganismos(harvest.finalOrganismos ? harvest.finalOrganismos.toString() : '');

    setShowForm(true);
  };

  const handleResetForm = () => {
    setEditingHarvest(null);
    setFormGranja('');
    setFormEstanque('');
    setFormFecha(new Date().toISOString().split('T')[0]);
    setFecha1('');
    setPre1Kilos('');
    setPre1Gramos('');
    setPre1Organismos('');
    setFecha2('');
    setPre2Kilos('');
    setPre2Gramos('');
    setPre2Organismos('');
    setFecha3('');
    setPre3Kilos('');
    setPre3Gramos('');
    setPre3Organismos('');
    setFecha4('');
    setPre4Kilos('');
    setPre4Gramos('');
    setPre4Organismos('');
    setPre5Kilos('');
    setPre5Gramos('');
    setPre5Organismos('');
    setFinalKilos('');
    setFinalGramos('');
    setFinalOrganismos('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGranja || !formEstanque || !formFecha) {
      alert('Por favor complete los campos de Granja, Estanque y Fecha.');
      return;
    }

    const calculatedP1Org = pre1Organismos ? parseInt(pre1Organismos) : calculatedPre1Org;
    const calculatedP2Org = pre2Organismos ? parseInt(pre2Organismos) : calculatedPre2Org;
    const calculatedP3Org = pre3Organismos ? parseInt(pre3Organismos) : calculatedPre3Org;
    const calculatedP4Org = pre4Organismos ? parseInt(pre4Organismos) : calculatedPre4Org;
    const calculatedP5Org = pre5Organismos ? parseInt(pre5Organismos) : calculatedPre5Org;
    const calculatedFOrg = finalOrganismos ? parseInt(finalOrganismos) : calculatedFinalOrg;

    const totalK = (parseFloat(pre1Kilos) || 0) + 
                   (parseFloat(pre2Kilos) || 0) + 
                   (parseFloat(pre3Kilos) || 0) + 
                   (parseFloat(pre4Kilos) || 0) + 
                   (parseFloat(pre5Kilos) || 0) + 
                   (parseFloat(finalKilos) || 0);

    const totalO = calculatedP1Org + calculatedP2Org + calculatedP3Org + calculatedP4Org + calculatedP5Org + calculatedFOrg;

    const effectiveFecha = fecha4 || fecha3 || fecha2 || fecha1 || formFecha;
    const pond = getPondData(formGranja, formEstanque);
    const surv = pond && pond.sembrados > 0 ? Number(((totalO / pond.sembrados) * 100).toFixed(1)) : undefined;
    const avgP = totalO > 0 ? Number(((totalK * 1000) / totalO).toFixed(2)) : undefined;

    const harvestData: HarvestRecord = {
      id: editingHarvest ? editingHarvest.id : Math.random().toString(36).substring(2, 11),
      granja: formGranja,
      estanque: formEstanque,
      fecha: effectiveFecha,
      
      fecha1: fecha1 || undefined,
      pre1Kilos: pre1Kilos ? parseFloat(pre1Kilos) : undefined,
      pre1Gramos: pre1Gramos ? parseFloat(pre1Gramos) : undefined,
      pre1Organismos: pre1Organismos ? parseInt(pre1Organismos) : undefined,

      fecha2: fecha2 || undefined,
      pre2Kilos: pre2Kilos ? parseFloat(pre2Kilos) : undefined,
      pre2Gramos: pre2Gramos ? parseFloat(pre2Gramos) : undefined,
      pre2Organismos: pre2Organismos ? parseInt(pre2Organismos) : undefined,

      fecha3: fecha3 || undefined,
      pre3Kilos: pre3Kilos ? parseFloat(pre3Kilos) : undefined,
      pre3Gramos: pre3Gramos ? parseFloat(pre3Gramos) : undefined,
      pre3Organismos: pre3Organismos ? parseInt(pre3Organismos) : undefined,

      fecha4: fecha4 || undefined,
      pre4Kilos: pre4Kilos ? parseFloat(pre4Kilos) : undefined,
      pre4Gramos: pre4Gramos ? parseFloat(pre4Gramos) : undefined,
      pre4Organismos: pre4Organismos ? parseInt(pre4Organismos) : undefined,

      pre5Kilos: pre5Kilos ? parseFloat(pre5Kilos) : undefined,
      pre5Gramos: pre5Gramos ? parseFloat(pre5Gramos) : undefined,
      pre5Organismos: pre5Organismos ? parseInt(pre5Organismos) : undefined,

      finalKilos: finalKilos ? parseFloat(finalKilos) : undefined,
      finalGramos: finalGramos ? parseFloat(finalGramos) : undefined,
      finalOrganismos: finalOrganismos ? parseInt(finalOrganismos) : undefined,

      totalKilos: Number(totalK.toFixed(2)),
      totalOrganismos: totalO,
      pesoPromedioPrecosechado: avgP,
      sobrevivenciaFinal: editingHarvest?.sobrevivenciaFinal ?? surv,
    };

    if (editingHarvest) {
      onEditHarvest(harvestData);
    } else {
      onAddHarvest(harvestData);
    }

    handleResetForm();
  };

  // Quick auto-fill formula triggerers
  const fillComputedPre1 = () => {
    if (calculatedPre1Org > 0) setPre1Organismos(calculatedPre1Org.toString());
  };
  const fillComputedPre2 = () => {
    if (calculatedPre2Org > 0) setPre2Organismos(calculatedPre2Org.toString());
  };
  const fillComputedPre3 = () => {
    if (calculatedPre3Org > 0) setPre3Organismos(calculatedPre3Org.toString());
  };
  const fillComputedPre4 = () => {
    if (calculatedPre4Org > 0) setPre4Organismos(calculatedPre4Org.toString());
  };
  const fillComputedPre5 = () => {
    if (calculatedPre5Org > 0) setPre5Organismos(calculatedPre5Org.toString());
  };
  const fillComputedFinal = () => {
    if (calculatedFinalOrg > 0) setFinalOrganismos(calculatedFinalOrg.toString());
  };

  const handleHarvestExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        let targetSheetName = workbook.SheetNames.find(n => {
          const lower = n.toLowerCase();
          return lower.includes('cosecha') || lower.includes('precosecha') || lower.includes('raleo');
        });

        if (!targetSheetName) {
          targetSheetName = workbook.SheetNames[0];
        }

        const parsedHarvests: HarvestRecord[] = parseHarvestWorksheet(workbook.Sheets[targetSheetName], XLSX);

        if (!parsedHarvests || parsedHarvests.length === 0) {
          alert('El archivo Excel no contiene filas con datos legibles de cosechas.');
          return;
        }

        // Enrich survival and pond data if missing
        parsedHarvests.forEach(h => {
          if (!h.sobrevivenciaFinal) {
            const pond = getPondData(h.granja, h.estanque);
            if (pond && pond.sembrados > 0 && h.totalOrganismos > 0) {
              h.sobrevivenciaFinal = Number(((h.totalOrganismos / pond.sembrados) * 100).toFixed(1));
            }
          }
        });

        if (onImportHarvests) {
          onImportHarvests(parsedHarvests);
          alert(`✅ Se importaron exitosamente ${parsedHarvests.length} registros desde el archivo Excel con cálculo automático de biomasa y organismos totales.`);
        }
      } catch (err) {
        console.error('Error al procesar archivo Excel de cosecha:', err);
        alert('Hubo un error al leer el archivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      
      {/* Main Action Header & Filter Panel */}
      <div className="flex flex-col gap-4 bg-[#0B4075] p-5 rounded-2xl border border-[#125699] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Ciclo de Cosechas</h2>
            <p className="text-sm text-blue-300">Registro detallado de pre-cosechas y cosecha final por granja y estanque.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select 
              value={granjaFilter} 
              onChange={(e) => setGranjaFilter(e.target.value)}
              className="bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todas las Granjas</option>
              {uniqueGranjas.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select 
              value={estanqueFilter} 
              onChange={(e) => setEstanqueFilter(e.target.value)}
              className="bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todos los Estanques</option>
              {uniqueEstanques.map(e => <option key={e} value={e}>Estanque {e}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-[#0B4075] p-5 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3.5 rounded-xl bg-indigo-900/40 border border-indigo-700/40 mb-3 flex items-center justify-center">
            <Scale className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Total Kilos Cosechados</p>
          <p className="text-2xl font-extrabold text-white tracking-tight">{formatNumber(kpiStats.totalKilos)} kg</p>
        </div>

        <div className="bg-[#0B4075] p-5 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3.5 rounded-xl bg-blue-900/40 border border-blue-700/40 mb-3 flex items-center justify-center">
            <Hash className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Total Organismos</p>
          <p className="text-2xl font-extrabold text-white tracking-tight">{formatNumber(kpiStats.totalOrganismos)}</p>
        </div>

        <div className="bg-[#0B4075] p-5 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3.5 rounded-xl bg-orange-900/40 border border-orange-700/40 mb-3 flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-orange-400" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Peso Promedio de Venta</p>
          <p className="text-2xl font-extrabold text-white tracking-tight">{formatNumber(kpiStats.pesoPromedio)} g</p>
        </div>

        <div className="bg-[#0B4075] p-5 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3.5 rounded-xl bg-emerald-900/40 border border-emerald-700/40 mb-3 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Sobrevivencia Promedio</p>
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            {kpiStats.sobrevivenciaPromedio > 0 ? `${kpiStats.sobrevivenciaPromedio.toFixed(1)}%` : `${kpiStats.totalRegistros} Estanques`}
          </p>
          {kpiStats.sobrevivenciaPromedio > 0 && (
            <p className="text-[10px] text-blue-300 mt-0.5">{kpiStats.totalRegistros} estanques cosechados</p>
          )}
        </div>

        <div className="bg-[#0B4075] p-5 rounded-2xl shadow-sm border border-[#125699] flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="p-3.5 rounded-xl bg-cyan-900/40 border border-cyan-700/40 mb-3 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Rendimiento (Kg/Ha)</p>
          <p className="text-2xl font-extrabold text-cyan-400 tracking-tight">
            {kpiStats.rendimientoKgHa > 0 ? `${formatNumber(kpiStats.rendimientoKgHa)}` : '-'}
          </p>
          <p className="text-[10px] text-blue-300 mt-0.5">
            {kpiStats.totalHectareas > 0 ? `${formatNumber(kpiStats.totalHectareas)} ha cosechadas` : 'kg por hectárea'}
          </p>
        </div>
      </div>

      {/* Registration/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#0B4075] p-6 rounded-xl border border-[#1963ad] shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b border-[#125699] pb-3">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <span>⚖️</span> {editingHarvest ? 'Editar Cosecha Registrada' : 'Nuevo Registro de Cosecha'}
            </h3>
            <button type="button" onClick={handleResetForm} className="text-blue-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Info (Granja, Estanque, Fecha) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase mb-1.5">Granja *</label>
              <select
                value={formGranja}
                onChange={(e) => setFormGranja(e.target.value)}
                required
                className="w-full bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Seleccione Granja</option>
                {uniqueGranjas.map(g => <option key={g} value={g}>{g}</option>)}
                <option value="OTRA">-- Crear Nueva Granja --</option>
              </select>
              {formGranja === 'OTRA' && (
                <input
                  type="text"
                  placeholder="Nombre de la Granja"
                  onChange={(e) => setFormGranja(e.target.value)}
                  className="mt-2 w-full bg-[#0E4680] text-white border border-[#125699] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase mb-1.5">Estanque *</label>
              <select
                value={formEstanque}
                onChange={(e) => setFormEstanque(e.target.value)}
                required
                className="w-full bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Seleccione Estanque</option>
                {uniqueEstanques.map(e => <option key={e} value={e}>Estanque {e}</option>)}
                <option value="OTRO">-- Crear Nuevo Estanque --</option>
              </select>
              {formEstanque === 'OTRO' && (
                <input
                  type="text"
                  placeholder="Número de Estanque"
                  onChange={(e) => setFormEstanque(e.target.value)}
                  className="mt-2 w-full bg-[#0E4680] text-white border border-[#125699] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-200 uppercase mb-1.5">Fecha de Evento *</label>
              <input
                type="date"
                value={formFecha}
                onChange={(e) => setFormFecha(e.target.value)}
                required
                className="w-full bg-[#125699] text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Harvesting Stages (Divided into nice sections: 5 pre-harvests + final harvest) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            
            {/* Stage 1: Pre-Cosecha 1 */}
            <div className="bg-[#0E4680] p-4 rounded-xl border border-[#125699] space-y-3">
              <h4 className="text-sm font-bold text-blue-300 border-b border-[#125699] pb-1.5 flex justify-between items-center">
                <span>1ra Pre-Cosecha</span>
                {pondStats && pondStats.sembrados > 0 && (parseInt(pre1Organismos) || calculatedPre1Org) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {(((parseInt(pre1Organismos) || calculatedPre1Org) / pondStats.sembrados) * 100).toFixed(1)}% estanque
                  </span>
                )}
              </h4>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1">Fecha 1</label>
                <input
                  type="date"
                  value={fecha1}
                  onChange={(e) => setFecha1(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Biomasa (Kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2380"
                    value={pre1Kilos}
                    onChange={(e) => setPre1Kilos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Peso (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14.7"
                    value={pre1Gramos}
                    onChange={(e) => setPre1Gramos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1 flex justify-between items-center">
                  <span>Org Totales (calculados)</span>
                  {calculatedPre1Org > 0 && (
                    <button 
                      type="button" 
                      onClick={fillComputedPre1}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Copiar {calculatedPre1Org}
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Sustituir / introducir directo"
                  value={pre1Organismos}
                  onChange={(e) => setPre1Organismos(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Stage 2: Pre-Cosecha 2 */}
            <div className="bg-[#0E4680] p-4 rounded-xl border border-[#125699] space-y-3">
              <h4 className="text-sm font-bold text-blue-300 border-b border-[#125699] pb-1.5 flex justify-between items-center">
                <span>2da Pre-Cosecha</span>
                {pondStats && pondStats.sembrados > 0 && (parseInt(pre2Organismos) || calculatedPre2Org) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {(((parseInt(pre2Organismos) || calculatedPre2Org) / pondStats.sembrados) * 100).toFixed(1)}% estanque
                  </span>
                )}
              </h4>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1">Fecha 2</label>
                <input
                  type="date"
                  value={fecha2}
                  onChange={(e) => setFecha2(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Biomasa (Kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 756"
                    value={pre2Kilos}
                    onChange={(e) => setPre2Kilos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Peso (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 20.55"
                    value={pre2Gramos}
                    onChange={(e) => setPre2Gramos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1 flex justify-between items-center">
                  <span>Org Totales (calculados)</span>
                  {calculatedPre2Org > 0 && (
                    <button 
                      type="button" 
                      onClick={fillComputedPre2}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Copiar {calculatedPre2Org}
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Sustituir / introducir directo"
                  value={pre2Organismos}
                  onChange={(e) => setPre2Organismos(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Stage 3: Pre-Cosecha 3 */}
            <div className="bg-[#0E4680] p-4 rounded-xl border border-[#125699] space-y-3">
              <h4 className="text-sm font-bold text-blue-300 border-b border-[#125699] pb-1.5 flex justify-between items-center">
                <span>3ra Pre-Cosecha</span>
                {pondStats && pondStats.sembrados > 0 && (parseInt(pre3Organismos) || calculatedPre3Org) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {(((parseInt(pre3Organismos) || calculatedPre3Org) / pondStats.sembrados) * 100).toFixed(1)}% estanque
                  </span>
                )}
              </h4>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1">Fecha 3</label>
                <input
                  type="date"
                  value={fecha3}
                  onChange={(e) => setFecha3(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Biomasa (Kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Kilos 3ra pre"
                    value={pre3Kilos}
                    onChange={(e) => setPre3Kilos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Peso (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Gramos 3ra pre"
                    value={pre3Gramos}
                    onChange={(e) => setPre3Gramos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1 flex justify-between items-center">
                  <span>Org Totales (calculados)</span>
                  {calculatedPre3Org > 0 && (
                    <button 
                      type="button" 
                      onClick={fillComputedPre3}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Copiar {calculatedPre3Org}
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Sustituir / introducir directo"
                  value={pre3Organismos}
                  onChange={(e) => setPre3Organismos(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Stage 4: Pre-Cosecha 4 */}
            <div className="bg-[#0E4680] p-4 rounded-xl border border-[#125699] space-y-3">
              <h4 className="text-sm font-bold text-blue-300 border-b border-[#125699] pb-1.5 flex justify-between items-center">
                <span>4ta Pre-Cosecha / Final</span>
                {pondStats && pondStats.sembrados > 0 && (parseInt(pre4Organismos) || calculatedPre4Org) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {(((parseInt(pre4Organismos) || calculatedPre4Org) / pondStats.sembrados) * 100).toFixed(1)}% estanque
                  </span>
                )}
              </h4>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1">Fecha 4</label>
                <input
                  type="date"
                  value={fecha4}
                  onChange={(e) => setFecha4(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Biomasa (Kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Kilos 4ta pre"
                    value={pre4Kilos}
                    onChange={(e) => setPre4Kilos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Peso (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Gramos 4ta pre"
                    value={pre4Gramos}
                    onChange={(e) => setPre4Gramos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1 flex justify-between items-center">
                  <span>Org Totales (calculados)</span>
                  {calculatedPre4Org > 0 && (
                    <button 
                      type="button" 
                      onClick={fillComputedPre4}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Copiar {calculatedPre4Org}
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Sustituir / introducir directo"
                  value={pre4Organismos}
                  onChange={(e) => setPre4Organismos(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Stage 5: Pre-Cosecha 5 */}
            <div className="bg-[#0E4680] p-4 rounded-xl border border-[#125699] space-y-4">
              <h4 className="text-sm font-bold text-blue-300 border-b border-[#125699] pb-1.5 flex justify-between items-center">
                <span>5ta Pre-Cosecha</span>
                {pondStats && pondStats.sembrados > 0 && (parseInt(pre5Organismos) || calculatedPre5Org) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {(((parseInt(pre5Organismos) || calculatedPre5Org) / pondStats.sembrados) * 100).toFixed(1)}% estanque
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Kilos</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Kilos 5ta pre"
                    value={pre5Kilos}
                    onChange={(e) => setPre5Kilos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1">Gramos (Promedio)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Gramos 5ta pre"
                    value={pre5Gramos}
                    onChange={(e) => setPre5Gramos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1 flex justify-between items-center">
                  <span>Organismos calculados</span>
                  {calculatedPre5Org > 0 && (
                    <button 
                      type="button" 
                      onClick={fillComputedPre5}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Copiar {calculatedPre5Org}
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Sustituir / introducir directo"
                  value={pre5Organismos}
                  onChange={(e) => setPre5Organismos(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Stage 3: Cosecha Final */}
            <div className="bg-[#0E4680]/90 p-4 rounded-xl border border-[#1963ad] space-y-4 shadow-sm">
              <h4 className="text-sm font-bold text-indigo-300 border-b border-[#125699] pb-1.5 flex justify-between items-center">
                <span className="flex items-center gap-1.5"><span>🎯</span> Cosecha Final</span>
                {pondStats && pondStats.sembrados > 0 && (parseInt(finalOrganismos) || calculatedFinalOrg) > 0 && (
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                    {(((parseInt(finalOrganismos) || calculatedFinalOrg) / pondStats.sembrados) * 100).toFixed(1)}% estanque
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1 font-semibold">Peso Kilos</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 3600"
                    value={finalKilos}
                    onChange={(e) => setFinalKilos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-blue-200 mb-1 font-semibold">Gramos (Prom.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 31.44"
                    value={finalGramos}
                    onChange={(e) => setFinalGramos(e.target.value)}
                    className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-blue-200 mb-1 flex justify-between items-center">
                  <span>Organismos calculados</span>
                  {calculatedFinalOrg > 0 && (
                    <button 
                      type="button" 
                      onClick={fillComputedFinal}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Copiar {calculatedFinalOrg}
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  placeholder="Sustituir / introducir directo"
                  value={finalOrganismos}
                  onChange={(e) => setFinalOrganismos(e.target.value)}
                  className="w-full bg-[#125699] text-white border-none rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

          </div>

          {/* Form Real-Time Computed Review Panel */}
          <div className="bg-[#0A345C] p-4 rounded-xl border border-[#125699] flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <p className="text-xs font-semibold text-blue-300">Resumen Proyectado de Cosecha:</p>
                {pondStats && pondStats.sembrados > 0 && (
                  <span className="text-[11px] font-medium text-blue-200 bg-blue-900/50 border border-blue-600/30 px-2 py-0.5 rounded-md">
                    Estanque {formEstanque} ({formatNumber(pondStats.sembrados)} orgs. sembrados | Sobrev. {pondStats.surv}%)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white pt-1 justify-center sm:justify-start">
                <span>
                  Kilos Totales: <strong className="font-extrabold text-white text-base mr-2">{formatNumber(tempTotalKilos)} kg</strong>
                </span>
                <span>
                  Organismos Totales: <strong className="font-extrabold text-indigo-300 text-base mr-2">{formatNumber(tempTotalOrganismos)} orgs.</strong>
                </span>

                {pondStats && pondStats.sembrados > 0 && tempTotalOrganismos > 0 && (
                  <>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      📊 {((tempTotalOrganismos / pondStats.sembrados) * 100).toFixed(1)}% del Total Sembrado
                    </span>
                    {pondStats.pobVivaEst > 0 && (
                      <span className="inline-flex items-center gap-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        🦐 {((tempTotalOrganismos / pondStats.pobVivaEst) * 100).toFixed(1)}% de Pob. Viva Est. ({formatNumber(pondStats.pobVivaEst)} orgs)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="bg-slate-700 hover:bg-slate-800 text-blue-100 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingHarvest ? 'Guardar Cambios' : 'Registrar'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Hidden File Input for Excel Import */}
      <input 
        type="file" 
        ref={harvestFileInputRef} 
        onChange={handleHarvestExcelUpload} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      {/* Multiple Farms / Phantom Data Alert Banner */}
      {uniqueGranjas.length > 1 && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Se detectaron registros de más de una granja en la memoria virtual: <strong>{uniqueGranjas.join(', ')}</strong>.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {uniqueGranjas.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  if (confirm(`¿Deseas eliminar todos los registros guardados de la granja "${g}" de la memoria?`)) {
                    if (onDeleteByGranja) {
                      onDeleteByGranja(g);
                    } else {
                      harvests.filter(h => h.granja === g).forEach(h => onDeleteHarvest(h.id));
                    }
                  }
                }}
                className="bg-amber-900/60 hover:bg-amber-700 border border-amber-600/50 text-amber-100 px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 active:scale-95"
                title={`Eliminar registros de ${g}`}
              >
                <Trash2 className="w-3 h-3 text-amber-300" />
                <span>Borrar registros de {g}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table Actions Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0A345C] p-4 rounded-xl border border-[#125699] shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <div>
            <h3 className="text-md font-bold text-white">Registros de Cosechas</h3>
            <p className="text-xs text-blue-300">Historial completo y controles de captura para pre-cosechas y cosechas finales.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => harvestFileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all shadow-md active:scale-95"
            title="Importar y reemplazar directamente desde archivo Excel (.xlsx, .csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Cargar Excel de Cosechas</span>
          </button>

          {harvests.length > 0 && (
            <button 
              type="button"
              onClick={() => {
                if (confirm('¿Deseas vaciar todos los registros de cosecha guardados en la memoria virtual para dejar la tabla limpia?')) {
                  if (onClearAllHarvests) {
                    onClearAllHarvests();
                  } else {
                    harvests.forEach(h => onDeleteHarvest(h.id));
                  }
                }
              }}
              className="flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-800 border border-rose-600/40 text-rose-200 hover:text-white px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all shadow-md active:scale-95"
              title="Vaciar todas las cosechas guardadas en memoria"
            >
              <Trash2 className="w-4 h-4" />
              <span>Vaciar Tabla</span>
            </button>
          )}

          <button 
            type="button"
            onClick={() => { handleResetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Cosecha</span>
          </button>
        </div>
      </div>

      {/* Harvest records Table */}
      <div className="bg-[#0B4075] rounded-xl border border-[#125699] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#0A345C] text-slate-100 text-[10px] uppercase tracking-wider font-extrabold border-b border-[#125699]">
                <th rowSpan={2} className="px-2.5 py-3 border-r border-[#125699] text-left align-middle font-bold text-slate-200">Acciones</th>
                <th rowSpan={2} className="px-3 py-3 border-r border-[#125699] text-left align-middle font-bold text-slate-200">Granja</th>
                <th rowSpan={2} className="px-2.5 py-3 border-r border-[#125699] text-center align-middle font-bold text-slate-200">Estanque</th>
                
                <th colSpan={4} className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/50 text-center text-[9px] font-extrabold uppercase tracking-widest text-[#93c5fd]">1ra Pre-Cosecha</th>
                <th colSpan={4} className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/30 text-center text-[9px] font-extrabold uppercase tracking-widest text-slate-300">2da Pre-Cosecha</th>
                <th colSpan={4} className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/50 text-center text-[9px] font-extrabold uppercase tracking-widest text-[#93c5fd]">3ra Pre-Cosecha</th>
                <th colSpan={4} className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/40 text-center text-[9px] font-extrabold uppercase tracking-widest text-[#a5b4fc]">4ta Pre-Cosecha / Final</th>
                <th colSpan={5} className="px-2 py-1.5 bg-indigo-950/50 text-center text-[9px] font-extrabold uppercase tracking-widest text-indigo-200">Resumen Precosechado</th>
              </tr>
              <tr className="bg-[#0D4075] text-slate-200 text-[9px] font-bold uppercase tracking-wider border-b border-[#125699] text-center">
                {/* 1ra Pre-cosecha Column Subheaders */}
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/40 font-medium">Fecha 1</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/40 font-medium">Peso (g)</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/40 font-medium">Biomasa (Kg)</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/40 font-medium text-blue-300">Org Totales</th>
                
                {/* 2da Pre-cosecha Column Subheaders */}
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/20 font-medium">Fecha 2</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/20 font-medium">Peso (g)</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/20 font-medium">Biomasa (Kg)</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/20 font-medium text-slate-300">Org Totales</th>

                {/* 3ra Pre-cosecha Column Subheaders */}
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/40 font-medium">Fecha 3</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/40 font-medium">Peso (g)</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/40 font-medium">Biomasa (Kg)</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#0E4680]/40 font-medium text-blue-300">Org Totales</th>

                {/* 4ta Pre-cosecha Column Subheaders */}
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/20 font-medium">Fecha 4</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/20 font-medium">Peso (g)</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/20 font-medium">Biomasa (Kg)</th>
                <th className="px-2 py-1.5 border-r border-[#125699] bg-[#125699]/20 font-medium text-slate-300">Org Totales</th>

                {/* Totales Column Subheaders */}
                <th className="px-2.5 py-1.5 border-r border-[#125699] bg-indigo-950/40 text-indigo-200">Biomasa (Kg)</th>
                <th className="px-2.5 py-1.5 border-r border-[#125699] bg-indigo-950/40 text-indigo-200">Org Totales</th>
                <th className="px-2.5 py-1.5 border-r border-[#125699] bg-indigo-950/40 text-indigo-200">Peso Prom (g)</th>
                <th className="px-2.5 py-1.5 border-r border-[#125699] bg-indigo-950/40 text-indigo-200">Sobrevivencia</th>
                <th className="px-2.5 py-1.5 bg-indigo-950/40 text-indigo-200">Rend (Kg/Ha)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#125699]/60">
              {paginatedHarvests.length === 0 ? (
                <tr>
                  <td colSpan={24} className="px-4 py-8 text-center text-slate-400 italic text-xs">No hay registros de cosechas.</td>
                </tr>
              ) : (
                paginatedHarvests.map((h) => {
                  const pond = getPondData(h.granja, h.estanque);
                  const pondHa = pond?.hectareas || 0;
                  const pondSembrados = pond?.sembrados || 0;

                  const p1Kilos = parseFlexibleNumber(h.pre1Kilos);
                  const p1Gramos = parseFlexibleNumber(h.pre1Gramos);
                  const p1Org = calculateStageOrganismos(p1Kilos, p1Gramos, h.pre1Organismos);

                  const p2Kilos = parseFlexibleNumber(h.pre2Kilos);
                  const p2Gramos = parseFlexibleNumber(h.pre2Gramos);
                  const p2Org = calculateStageOrganismos(p2Kilos, p2Gramos, h.pre2Organismos);

                  const p3Kilos = parseFlexibleNumber(h.pre3Kilos);
                  const p3Gramos = parseFlexibleNumber(h.pre3Gramos);
                  const p3Org = calculateStageOrganismos(p3Kilos, p3Gramos, h.pre3Organismos);

                  const p4Kilos = parseFlexibleNumber(h.pre4Kilos || h.finalKilos);
                  const p4Gramos = parseFlexibleNumber(h.pre4Gramos || h.finalGramos);
                  const p4Org = calculateStageOrganismos(p4Kilos, p4Gramos, h.pre4Organismos || h.finalOrganismos);

                  const p5Kilos = parseFlexibleNumber(h.pre5Kilos);
                  const p5Gramos = parseFlexibleNumber(h.pre5Gramos);
                  const p5Org = calculateStageOrganismos(p5Kilos, p5Gramos, h.pre5Organismos);

                  const effectiveTotalKilos = (h.totalKilos && parseFlexibleNumber(h.totalKilos) > 0)
                    ? parseFlexibleNumber(h.totalKilos)
                    : (p1Kilos + p2Kilos + p3Kilos + p4Kilos + p5Kilos);

                  const effectiveTotalOrg = (h.totalOrganismos && parseFlexibleNumber(h.totalOrganismos) > 0)
                    ? parseFlexibleNumber(h.totalOrganismos)
                    : (p1Org + p2Org + p3Org + p4Org + p5Org);
                  
                  const avgWeight = h.pesoPromedioPrecosechado || (effectiveTotalKilos > 0 && effectiveTotalOrg > 0 
                    ? Number(((effectiveTotalKilos * 1000) / effectiveTotalOrg).toFixed(1)) 
                    : 0);
                  
                  let rawSurv = parseFlexibleNumber(h.sobrevivenciaFinal);
                  if (rawSurv > 0 && rawSurv <= 1) {
                    rawSurv = rawSurv * 100;
                  }

                  const calculatedSurv = rawSurv 
                    ? Number(rawSurv.toFixed(1)) 
                    : (pondSembrados > 0 && effectiveTotalOrg > 0 
                        ? Number(((effectiveTotalOrg / pondSembrados) * 100).toFixed(1)) 
                        : null);

                  const rendKgHa = pondHa > 0 && effectiveTotalKilos > 0 
                    ? Math.round(effectiveTotalKilos / pondHa) 
                    : null;

                  return (
                    <tr key={h.id} className="hover:bg-[#125699]/20 transition-colors text-center text-[10.5px] whitespace-nowrap text-blue-100/90">
                      <td className="px-2 py-2 border-r border-[#125699]/40 text-left align-middle">
                        <div className="flex items-center gap-1 justify-start">
                          <button 
                            onClick={() => handleStartEdit(h)}
                            className="text-blue-300 hover:text-white hover:bg-blue-600 bg-blue-900/30 border border-blue-700/20 p-1 rounded-md transition-colors"
                            title="Editar Registro"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('¿Está seguro de eliminar esta cosecha?')) {
                                onDeleteHarvest(h.id);
                              }
                            }}
                            className="text-red-400 hover:text-white hover:bg-red-600 bg-red-900/30 border border-red-700/20 p-1 rounded-md transition-colors"
                            title="Eliminar Registro"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r border-[#125699]/40 text-left font-semibold text-slate-100 align-middle truncate max-w-[120px]">{h.granja}</td>
                      <td className="px-2.5 py-2 border-r border-[#125699]/40 font-bold text-white align-middle">{h.estanque}</td>
                      
                      {/* 1ra Pre-cosecha Cells */}
                      <td className="px-2 py-2 border-r border-[#125699]/40 bg-[#0E4680]/15 align-middle text-blue-200 text-[10px]">{formatDate(h.fecha1 || h.fecha)}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 bg-[#0E4680]/15 align-middle text-slate-300 font-medium">{p1Gramos > 0 ? formatNumber(p1Gramos) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 bg-[#0E4680]/15 align-middle text-slate-200">{p1Kilos > 0 ? formatNumber(p1Kilos) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 bg-[#0E4680]/20 align-middle text-blue-300 font-mono text-[10px]">{p1Org > 0 ? formatNumber(p1Org) : '-'}</td>
                      
                      {/* 2da Pre-cosecha Cells */}
                      <td className="px-2 py-2 border-r border-[#125699]/40 align-middle text-blue-200 text-[10px]">{h.fecha2 ? formatDate(h.fecha2) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 align-middle text-slate-300 font-medium">{p2Gramos > 0 ? formatNumber(p2Gramos) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 align-middle text-slate-200">{p2Kilos > 0 ? formatNumber(p2Kilos) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 align-middle text-slate-300 font-mono text-[10px]">{p2Org > 0 ? formatNumber(p2Org) : '-'}</td>
                      
                      {/* 3ra Pre-cosecha Cells */}
                      <td className="px-2 py-2 border-r border-[#125699]/40 bg-[#0E4680]/15 align-middle text-blue-200 text-[10px]">{h.fecha3 ? formatDate(h.fecha3) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 bg-[#0E4680]/15 align-middle text-slate-300 font-medium">{p3Gramos > 0 ? formatNumber(p3Gramos) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 bg-[#0E4680]/15 align-middle text-slate-200">{p3Kilos > 0 ? formatNumber(p3Kilos) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 bg-[#0E4680]/20 align-middle text-blue-300 font-mono text-[10px]">{p3Org > 0 ? formatNumber(p3Org) : '-'}</td>

                      {/* 4ta Pre-cosecha Cells */}
                      <td className="px-2 py-2 border-r border-[#125699]/40 align-middle text-blue-200 text-[10px]">{h.fecha4 ? formatDate(h.fecha4) : (h.fechaFinal ? formatDate(h.fechaFinal) : '-')}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 align-middle text-slate-300 font-medium">{p4Gramos > 0 ? formatNumber(p4Gramos) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 align-middle text-slate-200">{p4Kilos > 0 ? formatNumber(p4Kilos) : '-'}</td>
                      <td className="px-2 py-2 border-r border-[#125699]/40 align-middle text-slate-300 font-mono text-[10px]">{p4Org > 0 ? formatNumber(p4Org) : '-'}</td>

                      {/* Resumen Precosecha Cells */}
                      <td className="px-2.5 py-2 border-r border-[#125699]/40 font-extrabold text-emerald-300 bg-indigo-950/30 align-middle">{formatNumber(effectiveTotalKilos)} kg</td>
                      <td className="px-2.5 py-2 border-r border-[#125699]/40 font-extrabold text-[#818cf8] bg-indigo-950/30 align-middle font-mono text-[10px]">{formatNumber(effectiveTotalOrg)}</td>
                      <td className="px-2.5 py-2 border-r border-[#125699]/40 font-bold text-amber-300 bg-indigo-950/30 align-middle">{avgWeight ? `${formatNumber(avgWeight)} g` : '-'}</td>
                      <td className="px-2.5 py-2 border-r border-[#125699]/40 font-bold bg-indigo-950/30 align-middle">
                        {calculatedSurv ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${
                            calculatedSurv >= 65 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {calculatedSurv}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-2.5 py-2 bg-indigo-950/30 font-semibold text-cyan-300 align-middle">
                        {rendKgHa ? `${formatNumber(rendKgHa)}` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#125699] px-4 py-3 bg-[#0B4075]">
            <div className="flex flex-1 justify-between sm:hidden w-full">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md bg-[#125699] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a6ebd] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative ml-2 inline-flex items-center rounded-md bg-[#125699] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a6ebd] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
              <div>
                <p className="text-xs text-blue-200">
                  Mostrando <span className="font-semibold text-white">{(currentPage - 1) * recordsPerPage + 1}</span> a{' '}
                  <span className="font-semibold text-white">
                    {Math.min(currentPage * recordsPerPage, filteredHarvests.length)}
                  </span>{' '}
                  de <span className="font-semibold text-white">{filteredHarvests.length}</span> cosechas
                </p>
              </div>
              
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm border border-[#125699] bg-[#0E4680]" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-1.5 text-blue-200 hover:bg-[#125699] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold focus:z-20 focus:outline-[#125699] ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white z-10'
                          : 'text-blue-200 hover:bg-[#125699]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-1.5 text-blue-200 hover:bg-[#125699] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráficos de Cosechas (100% Independientes con Filtros Locales) */}
      <div className="mt-8 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              Gráfico de Ciclo de Cosechas
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Visualizando {harvestChartData.length} registros según los filtros de Granja y Estanque seleccionados
            </p>
          </div>
          
          <div className="flex bg-[#0B4075] rounded-lg p-1 border border-[#125699] flex-wrap gap-1">
            <button 
              onClick={() => setChartView('kilos')} 
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${chartView === 'kilos' ? 'bg-indigo-600 text-white shadow-sm' : 'text-blue-200 hover:text-white'}`}
            >
              ⚖️ Kilos Totales
            </button>
            <button 
              onClick={() => setChartView('organismos')} 
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${chartView === 'organismos' ? 'bg-indigo-600 text-white shadow-sm' : 'text-blue-200 hover:text-white'}`}
            >
              🔢 Organismos
            </button>
            <button 
              onClick={() => setChartView('etapas')} 
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${chartView === 'etapas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-blue-200 hover:text-white'}`}
            >
              📊 Desglose Etapas
            </button>
            <button 
              onClick={() => setChartView('tallas')} 
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${chartView === 'tallas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-blue-200 hover:text-white'}`}
            >
              🦐 Tallas Promedio
            </button>
          </div>
        </div>

        <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[420px]">
          {chartView === 'kilos' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-blue-400">⚖️</span> Kilos Totales Cosechados (kg)
                </h3>
                <span className="text-xs text-blue-300">Total por estanque / fecha</span>
              </div>
              <div className="flex-1 min-h-0">
                {harvestChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={harvestChartData} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(15, 76, 138, 0.4)' }} 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #1a6ebd', backgroundColor: '#093661', color: '#fff' }} 
                        formatter={(value: number) => [`${formatNumber(value)} kg`, 'Kilos Totales']} 
                      />
                      <Bar dataKey="totalKilos" name="Kilos Totales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                    <BarChart2 className="w-8 h-8 text-blue-400 mb-2 opacity-50" />
                    <span>Sin registros de cosechas para los filtros seleccionados</span>
                  </div>
                )}
              </div>
            </>
          )}

          {chartView === 'organismos' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-400">🔢</span> Organismos Cosechados Totales
                </h3>
                <span className="text-xs text-blue-300">Total de camarones cosechados</span>
              </div>
              <div className="flex-1 min-h-0">
                {harvestChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={harvestChartData} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(15, 76, 138, 0.4)' }} 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #1a6ebd', backgroundColor: '#093661', color: '#fff' }} 
                        formatter={(value: number) => [`${formatNumber(value)} org`, 'Organismos']} 
                      />
                      <Bar dataKey="totalOrganismos" name="Organismos" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                    <BarChart2 className="w-8 h-8 text-blue-400 mb-2 opacity-50" />
                    <span>Sin registros de cosechas para los filtros seleccionados</span>
                  </div>
                )}
              </div>
            </>
          )}

          {chartView === 'etapas' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-indigo-400">📊</span> Desglose de Kilos por Etapa (kg)
                </h3>
                <span className="text-xs text-blue-300">Pre-cosechas y Cosecha Final apiladas</span>
              </div>
              <div className="flex-1 min-h-0">
                {harvestChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={harvestChartData} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #1a6ebd', backgroundColor: '#093661', color: '#fff' }} 
                        formatter={(value: number) => [`${formatNumber(value)} kg`, '']} 
                      />
                      <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
                      <Bar dataKey="pre1Kilos" stackId="a" name="1ra Pre (kg)" fill="#60a5fa" />
                      <Bar dataKey="pre2Kilos" stackId="a" name="2da Pre (kg)" fill="#34d399" />
                      <Bar dataKey="pre3Kilos" stackId="a" name="3ra Pre (kg)" fill="#a78bfa" />
                      <Bar dataKey="pre4Kilos" stackId="a" name="4ta Pre (kg)" fill="#f472b6" />
                      <Bar dataKey="pre5Kilos" stackId="a" name="5ta Pre (kg)" fill="#fbbf24" />
                      <Bar dataKey="finalKilos" stackId="a" name="Final (kg)" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                    <BarChart2 className="w-8 h-8 text-blue-400 mb-2 opacity-50" />
                    <span>Sin registros de cosechas para los filtros seleccionados</span>
                  </div>
                )}
              </div>
            </>
          )}

          {chartView === 'tallas' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-orange-400">🦐</span> Tallas Promedio por Etapa (g)
                </h3>
                <span className="text-xs text-blue-300">Peso individual de camarón</span>
              </div>
              <div className="flex-1 min-h-0">
                {harvestChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={harvestChartData} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #1a6ebd', backgroundColor: '#093661', color: '#fff' }} 
                        formatter={(value: number) => [`${formatNumber(value)} g`, '']} 
                      />
                      <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
                      <Bar dataKey="pre1Gramos" name="1ra Pre (g)" fill="#818cf8" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="pre2Gramos" name="2da Pre (g)" fill="#a78bfa" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="pre3Gramos" name="3ra Pre (g)" fill="#c084fc" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="pre4Gramos" name="4ta Pre (g)" fill="#f472b6" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="pre5Gramos" name="5ta Pre (g)" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="finalGramos" name="Final (g)" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                    <BarChart2 className="w-8 h-8 text-blue-400 mb-2 opacity-50" />
                    <span>Sin registros de cosechas para los filtros seleccionados</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default HarvestsModule;
