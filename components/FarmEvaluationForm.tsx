
import React, { useState } from 'react';
import { EvaluationFormData } from '../types';

interface Props {
    onSave: (data: EvaluationFormData) => void;
    initialData?: EvaluationFormData;
}

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-[#0B4075] rounded-xl shadow-sm border border-[#125699] mb-6">
            <button onClick={() => setIsOpen(!isOpen)} className={`w-full text-left ${isOpen ? 'bg-blue-600 border-blue-700' : 'bg-[#072C52] border-[#125699] hover:bg-[#0E4680]'} px-6 py-4 border-b flex justify-between items-center rounded-t-xl transition-colors`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isOpen ? 'text-white' : 'text-blue-100'}`}>{title}</h3>
                <svg className={`w-5 h-5 ${isOpen ? 'text-white' : 'text-blue-300'} transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && <div className="p-6">{children}</div>}
        </div>
    );
};

const Input: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; className?: string; rows?: number; placeholder?: string }> = ({ label, name, value, onChange, type = 'text', className = '', rows, placeholder }) => (
    <div className={className}>
        <label className="block text-xs font-medium text-blue-200 mb-1">{label}</label>
        {type === 'textarea' ? (
            <textarea name={name} value={value} onChange={onChange} rows={rows} className="w-full text-sm rounded-lg border-[#125699] focus:ring-blue-500 focus:border-blue-500 border p-2 bg-[#072C52] text-white placeholder-blue-400" placeholder={placeholder}></textarea>
        ) : (
            <input type={type} name={name} value={value} onChange={onChange} className="w-full text-sm rounded-lg border-[#125699] focus:ring-blue-500 focus:border-blue-500 border p-2 bg-[#072C52] text-white placeholder-blue-400 [color-scheme:dark]" placeholder={placeholder} />
        )}
    </div>
);

const FarmEvaluationForm: React.FC<Props> = ({ onSave, initialData }) => {
    const [formData, setFormData] = useState<EvaluationFormData>(initialData || {});

    React.useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({});
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        setFormData({});
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm">
                <div className="space-y-4">
                    <Input label="Granja" name="granja" value={String(formData.granja || '')} onChange={handleChange} />
                    <Input label="Localidad" name="localidad" value={String(formData.localidad || '')} onChange={handleChange} />
                    <Input label="Hectáreas" name="hectareas" type="number" value={String(formData.hectareas || '')} onChange={handleChange} />
                </div>
                <div className="space-y-4">
                    <Input label="Fecha" name="fecha" type="date" value={String(formData.fecha || '')} onChange={handleChange} />
                    <Input label="Zona" name="zona" value={String(formData.zona || '')} onChange={handleChange} />
                </div>
                <div className="space-y-4">
                    <Input label="No. Estanques" name="no_estanques" type="number" value={String(formData.no_estanques || '')} onChange={handleChange} />
                    <Input label="Precrias" name="precrias" value={String(formData.precrias || '')} onChange={handleChange} />
                </div>
            </div>

            <Section title="1.- Origen Larva" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <Input label="Procedencia" name="procedencia" value={String(formData.procedencia || '')} onChange={handleChange} />
                        <Input label="Laboratorio" name="laboratorio" value={String(formData.laboratorio || '')} onChange={handleChange} />
                        <Input label="Fecha Siembra" name="fecha_siembra" type="date" value={String(formData.fecha_siembra || '')} onChange={handleChange} />
                        <Input label="Densidad de Siembra" name="densidad_siembra" value={String(formData.densidad_siembra || '')} onChange={handleChange} />
                        <Input label="Race Ways" name="race_ways" value={String(formData.race_ways || '')} onChange={handleChange} />
                    </div>
                    
                    <div className="space-y-4">
                        <Input label="Especie" name="especie" value={String(formData.especie || '')} onChange={handleChange} />
                        <Input label="Días Cultivo" name="dias_cultivo" type="number" value={String(formData.dias_cultivo || '')} onChange={handleChange} />
                        <Input label="Peso a Cosecha" name="peso_cosecha" type="number" step="0.01" value={String(formData.peso_cosecha || '')} onChange={handleChange} />
                        <Input label="Rendimiento Ton/Ha" name="rendimiento_ton_ha" type="number" step="0.01" value={String(formData.rendimiento_ton_ha || '')} onChange={handleChange} />
                        <Input label="% Sobrevivencia" name="porcentaje_sobreviencia" type="number" value={String(formData.porcentaje_sobreviencia || '')} onChange={handleChange} />
                        <Input label="F.C.A" name="fca" type="number" step="0.01" value={String(formData.fca || '')} onChange={handleChange} />
                    </div>
                </div>
            </Section>

            <Section title="2.- Bioseguridad y Tratamientos" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input label="Suelo" name="suelo" value={String(formData.suelo || '')} onChange={handleChange} />
                    <Input label="Kg/Ha" name="kg_ha" type="number" step="0.01" value={String(formData.kg_ha || '')} onChange={handleChange} />
                    <Input label="Agua" name="agua" value={String(formData.agua || '')} onChange={handleChange} />
                    <Input label="Utilización Bolsos" name="utilizacion_bolsos" value={String(formData.utilizacion_bolsos || '')} onChange={handleChange} />
                    
                    <Input label="Fertilización" name="fertilizacion" value={String(formData.fertilizacion || '')} onChange={handleChange} />
                    <Input label="Tipo" name="tipo" value={String(formData.tipo || '')} onChange={handleChange} />
                    <Input label="% Recambio" name="porcentaje_recambio" type="number" value={String(formData.porcentaje_recambio || '')} onChange={handleChange} />
                    <Input label="Muestreo Plancton" name="muestreo_plancton" value={String(formData.muestreo_plancton || '')} onChange={handleChange} />
                    
                    <p className="font-medium text-sm text-blue-100 col-span-full border-t border-[#125699] pt-4 mt-2">Parámetros Físico-Químicos</p>
                    <Input label="Temperatura" name="temperatura" value={String(formData.temperatura || '')} onChange={handleChange} />
                    <Input label="Oxigeno" name="oxigeno" value={String(formData.oxigeno || '')} onChange={handleChange} />
                    <Input label="Salinidad" name="salinidad" value={String(formData.salinidad || '')} onChange={handleChange} />
                    <Input label="Ph" name="ph" value={String(formData.ph || '')} onChange={handleChange} />
                </div>
            </Section>
            
            <Section title="3.- Alimentación" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input label="Tipo Alimento" name="tipo_alimento" className="lg:col-span-2" value={String(formData.tipo_alimento || '')} onChange={handleChange} />
                    <Input label="No Raciones/Dia" name="no_raciones_dia" type="number" value={String(formData.no_raciones_dia || '')} onChange={handleChange} />
                    <div></div>

                    <Input label="Horario 1" name="horario_1" value={String(formData.horario_1 || '')} onChange={handleChange} />
                    <Input label="Horario 2" name="horario_2" value={String(formData.horario_2 || '')} onChange={handleChange} />
                    <Input label="Horario 3" name="horario_3" value={String(formData.horario_3 || '')} onChange={handleChange} />
                    <div></div>

                    <Input label="Uso Indicadores" name="uso_indicadores" value={String(formData.uso_indicadores || '')} onChange={handleChange} />
                    <Input label="Indicadores Ha" name="indicadores_ha" type="number" value={String(formData.indicadores_ha || '')} onChange={handleChange} />
                    
                    <Input label="Alimento Medicado" name="alimento_medicado" value={String(formData.alimento_medicado || '')} onChange={handleChange} />
                    <Input label="Desinfectantes" name="desinfectantes" value={String(formData.desinfectantes || '')} onChange={handleChange} />
                    <Input label="Otros" name="otros" value={String(formData.otros || '')} onChange={handleChange} />
                    <Input label="Aditivos" name="aditivos" value={String(formData.aditivos || '')} onChange={handleChange} />
                </div>
            </Section>
            
             <Section title="4.- Infraestructura y Personal" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="font-medium text-sm text-blue-100 col-span-full">Bombeo:</div>
                    <Input label="No. Bombas" name="no_bombas" type="number" value={String(formData.no_bombas || '')} onChange={handleChange} />
                    <Input label="Capacidad" name="capacidad" value={String(formData.capacidad || '')} onChange={handleChange} />
                    <Input label="Tiempo Bombeo" name="tiempo_bombeo" value={String(formData.tiempo_bombeo || '')} onChange={handleChange} />
                    <Input label="Estado Bombeo" name="estado_bombeo" value={String(formData.estado_bombeo || '')} onChange={handleChange} />
                    <Input label="Valoracion" name="valoracion" value={String(formData.valoracion || '')} onChange={handleChange} />

                    <div className="font-medium text-sm text-blue-100 col-span-full border-t border-[#125699] pt-4">Personal:</div>
                    <Input label="Director Produccion" name="director_produccion" className="lg:col-span-2" value={String(formData.director_produccion || '')} onChange={handleChange} />
                    <Input label="Gerente Produccion" name="gerente_produccion" className="lg:col-span-2" value={String(formData.gerente_produccion || '')} onChange={handleChange} />
                    <Input label="Personal de Campo" name="personal_campo" className="lg:col-span-4" value={String(formData.personal_campo || '')} onChange={handleChange} placeholder="Ej: 5 alimentadores, 2 bomberos..." />
                </div>
            </Section>
            
            <Section title="Observaciones" defaultOpen={true}>
                <div>
                    <Input 
                        label="Observaciones Generales" 
                        name="observaciones"
                        type="textarea"
                        rows={5}
                        value={String(formData.observaciones || '')} 
                        onChange={handleChange} 
                    />
                </div>
            </Section>
            
            <div className="flex justify-end pt-4">
                 <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all disabled:bg-[#072C52] disabled:text-blue-300 disabled:cursor-not-allowed"
                    disabled={Object.keys(formData).length === 0}
                >
                    Guardar Evaluación
                </button>
            </div>
        </form>
    );
};

export default FarmEvaluationForm;

