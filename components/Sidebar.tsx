
import React from 'react';

type View = 'dashboard' | 'estadisticas' | 'growthCurve' | 'farmEvaluation' | 'evaluationsList' | 'stockingProgram' | 'productionProgram' | 'googleSync';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-[#0F4C8A] text-white shadow-inner border border-[#1B66B0]'
        : 'text-blue-200 hover:bg-[#0B4075] hover:text-white border border-transparent'
    }`}
  >
    <span className="mr-3">{icon}</span>
    {label}
  </button>
);

interface Props {
  activeView: View;
  onNavigate: (view: View) => void;
  onExportPDF: () => void;
  isExporting: boolean;
}

const Sidebar: React.FC<Props> = ({ activeView, onNavigate, onExportPDF, isExporting }) => {
  return (
    <aside className="w-64 bg-[#072C52] text-white flex flex-col p-4 border-r border-[#125699]">
      <div className="flex items-center gap-4 px-2 py-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-[#1B5CB3] bg-[#072C52] shadow-[0_0_15px_rgba(88,165,255,0.3)] flex-shrink-0 relative overflow-hidden">
          {/* Neon Shrimp SVG */}
          <svg className="w-10 h-10 text-[#7DD3FC] drop-shadow-[0_0_5px_rgba(125,211,252,0.8)]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            {/* Antennae */}
            <path d="M 65 42 C 85 35 85 15 70 15 C 50 15 25 25 25 25" />
            <path d="M 75 45 C 95 45 95 5 70 5 C 40 5 15 15 15 15" />
            
            {/* Head */}
            <path d="M 65 42 L 75 45 C 75 45 70 55 55 55 L 50 40" />
            <circle cx="62" cy="47" r="2.5" fill="currentColor" stroke="none" className="drop-shadow-[0_0_4px_rgba(125,211,252,1)]" />

            {/* Body Back Curve */}
            <path d="M 50 40 C 30 30 5 45 10 70 C 15 90 35 95 50 85 C 55 80 60 75 60 75" />
            
            {/* Inner Belly Curve */}
            <path d="M 55 55 C 35 55 25 65 25 75 C 25 85 40 90 50 85" />
            
            {/* Segments (Shell lines) */}
            <path d="M 18 50 C 25 55 30 55 35 53" />
            <path d="M 13 65 C 20 65 25 66 28 64" />
            <path d="M 20 82 C 25 80 30 78 32 75" />
            
            {/* Legs */}
            <path d="M 35 61 C 38 65 42 70 42 75" />
            <path d="M 42 58 C 45 62 50 67 50 72" />
            <path d="M 50 55 C 53 60 58 64 58 68" />
            
            {/* Tail fins */}
            <path d="M 60 75 C 70 75 75 85 70 90 C 65 90 60 85 60 75" />
            <path d="M 60 75 C 70 70 80 75 75 80 C 70 85 65 80 60 75" />
          </svg>
          {/* Inner Glow */}
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_10px_rgba(88,165,255,0.2)]"></div>
        </div>
        <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
          AquaControl
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
          label="Evaluación Técnica"
          isActive={activeView === 'farmEvaluation'}
          onClick={() => onNavigate('farmEvaluation')}
        />
         <NavItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          }
          label="Historial Evaluaciones"
          isActive={activeView === 'evaluationsList'}
          onClick={() => onNavigate('evaluationsList')}
        />
        <NavItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          label="Control de Producción"
          isActive={activeView === 'productionProgram'}
          onClick={() => onNavigate('productionProgram')}
        />
        <NavItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
          label="Dashboard"
          isActive={activeView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <NavItem
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          label="Análisis Estadístico"
          isActive={activeView === 'estadisticas'}
          onClick={() => onNavigate('estadisticas')}
        />
        <NavItem
          icon={
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
          label="Sincronizar Google"
          isActive={activeView === 'googleSync'}
          onClick={() => onNavigate('googleSync')}
        />
        <button 
          onClick={onExportPDF} 
          disabled={isExporting || activeView !== 'dashboard'}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-slate-400 hover:bg-slate-700 hover:text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
          title={activeView !== 'dashboard' ? 'Disponible solo en el Dashboard' : 'Exportar Reporte a PDF'}
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>Exportando...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              <span>Exportar a PDF</span>
            </>
          )}
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
