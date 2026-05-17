
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
      <div className="flex items-center gap-3 px-2 py-4 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18c1.5 1.5 4.5 1.5 6 0 2-2 1-4.5 2.5-6s4-1.5 6 0c-1.5-1.5-1.5-4.50-3-6-2-2-4.5-1-6-2.5-1.5-1.5 0-4-0-6C10 5.5 10 8.5 8 10 6 12 7 14.5 5.5 16s-4 1.5-6 0C1 17.5 4 17.50 6 18z"/>
            <path d="M12 12c-1.5-1.5-1.5-4.5-3-6" />
            <path d="M16 16c-1.5-1.5-4.5-1.5-6-3" />
          </svg>
        </div>
        <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
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
