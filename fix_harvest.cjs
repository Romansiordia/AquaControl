const fs = require('fs');
let content = fs.readFileSync('components/HarvestsModule.tsx', 'utf8');

const injection = `
      {/* Gráficos de Cosechas (Independientes) */}
      <div className="mt-8 flex flex-col items-start gap-3 mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
          Gráficos de Cosechas Filtradas
        </h2>
        <div className="flex bg-[#0B4075] rounded-lg p-1 border border-[#125699] flex-wrap gap-1">
          <button onClick={() => setChartView('kilos')} className={\`px-4 py-1.5 rounded-md text-sm font-medium transition-colors \${chartView === 'kilos' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}\`}>Kilos Totales</button>
          <button onClick={() => setChartView('organismos')} className={\`px-4 py-1.5 rounded-md text-sm font-medium transition-colors \${chartView === 'organismos' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}\`}>Organismos Totales</button>
          <button onClick={() => setChartView('etapas')} className={\`px-4 py-1.5 rounded-md text-sm font-medium transition-colors \${chartView === 'etapas' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}\`}>Desglose Kilos</button>
          <button onClick={() => setChartView('tallas')} className={\`px-4 py-1.5 rounded-md text-sm font-medium transition-colors \${chartView === 'tallas' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}\`}>Tallas Promedio</button>
        </div>
      </div>

      <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[400px]">
        {chartView === 'kilos' && (
          <>
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-blue-500">⚖️</span> Kilos Totales Cosechados (kg)</h2>
            <div className="flex-1 min-h-0">
              {harvestChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={harvestChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value) => [\`\${formatNumber(value)} kg\`, 'Kilos Totales']} />
                    <Bar dataKey="totalKilos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos de cosechas para graficar</div>}
            </div>
          </>
        )}
        
        {chartView === 'organismos' && (
          <>
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-emerald-500">🔢</span> Organismos Cosechados Totales</h2>
            <div className="flex-1 min-h-0">
              {harvestChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={harvestChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value) => [\`\${formatNumber(value)} org\`, 'Organismos']} />
                    <Bar dataKey="totalOrganismos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos de cosechas para graficar</div>}
            </div>
          </>
        )}

        {chartView === 'etapas' && (
          <>
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-indigo-500">📊</span> Desglose de Kilos por Etapa (kg)</h2>
            <div className="flex-1 min-h-0">
              {harvestChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={harvestChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value) => [\`\${formatNumber(value)} kg\`, '']} />
                    <Bar dataKey="pre1Kilos" stackId="a" name="1ra Pre-Cosecha" fill="#60a5fa" />
                    <Bar dataKey="pre2Kilos" stackId="a" name="2da Pre-Cosecha" fill="#34d399" />
                    <Bar dataKey="finalKilos" stackId="a" name="Cosecha Final" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos de cosechas para graficar</div>}
            </div>
          </>
        )}

        {chartView === 'tallas' && (
          <>
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-orange-400">🦐</span> Tallas Promedio por Etapa (g)</h2>
            <div className="flex-1 min-h-0">
              {harvestChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={harvestChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value) => [\`\${formatNumber(value)} g\`, '']} />
                    <Bar dataKey="pre1Gramos" name="1ra Pre-Cosecha (g)" fill="#818cf8" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="pre2Gramos" name="2da Pre-Cosecha (g)" fill="#a78bfa" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="finalGramos" name="Cosecha Final (g)" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos de cosechas para graficar</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default HarvestsModule;
`;

content = content.replace(/      <\/div>\n    <\/div>\n  \);\n};\n\nexport default HarvestsModule;/, injection);

fs.writeFileSync('components/HarvestsModule.tsx', content);
