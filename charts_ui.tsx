              <div className="flex flex-col items-start gap-3 mb-4 mt-8">
                <h2 className="text-lg font-bold text-white">
                  {chartView === 'cosechas' ? 'Gráficos de Cosechas' : 'Gráficos de Producción'}
                </h2>
                <div className="flex bg-[#0B4075] rounded-lg p-1 border border-[#125699]">
                  <button onClick={() => setChartView('actual')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${chartView === 'actual' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}`}>Último por Estanque</button>
                  <button onClick={() => setChartView('tendencia')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${chartView === 'tendencia' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}`}>Tendencia Histórica</button>
                  <button onClick={() => setChartView('cosechas')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${chartView === 'cosechas' ? 'bg-indigo-600 text-white' : 'text-blue-200 hover:text-white'}`}>Ciclo de Cosechas</button>
                </div>
              </div>

              <div id="charts-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Peso Actual */}
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                  {chartView === 'cosechas' ? (
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-blue-500">⚖️</span> Kilos Totales Cosechados (kg)</h2>
                      <div className="flex-1 min-h-0">
                        {harvestChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={harvestChartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                              <Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} kg`, 'Kilos Totales']} />
                              <Bar dataKey="totalKilos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos de cosechas para graficar</div>}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-blue-500">⚖️</span> Peso Actual (g)</h2>
                      <div className="flex-1 min-h-0">
                        {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            {chartView === 'actual' ? (
                              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} g`, 'Peso']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="pesoActual" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.pesoActual > 6 ? '#2563eb' : '#3b82f6'} />))}</Bar></BarChart>
                            ) : (
                              <LineChart data={historicalChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number, name: string) => [`${formatNumber(value)} g`, name.replace('_peso', '')]} labelFormatter={(label) => `Fecha: ${label}`} />
                                {uniqueEstanquesInHistory.map((est, idx) => (
                                   <Line key={est} type="monotone" dataKey={`${est}_peso`} name={`${est}_peso`} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={{ fill: lineColors[idx % lineColors.length], strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                                ))}
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Incremento Semanal */}
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                  {chartView === 'cosechas' ? (
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-emerald-500">🔢</span> Organismos Cosechados Totales</h2>
                      <div className="flex-1 min-h-0">
                        {harvestChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={harvestChartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                              <Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} org`, 'Organismos']} />
                              <Bar dataKey="totalOrganismos" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos de cosechas para graficar</div>}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-indigo-500">📈</span> Incremento Semanal (g)</h2>
                      <div className="flex-1 min-h-0">
                        {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                             {chartView === 'actual' ? (
                               <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`+${formatNumber(value)} g`, 'Incremento']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="incrementoSemanal" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-inc-${index}`} fill={entry.incrementoSemanal > 1.2 ? '#6366f1' : '#818cf8'} />))}</Bar></BarChart>
                             ) : (
                               <LineChart data={historicalChartData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                                 <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                 <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number, name: string) => [`+${formatNumber(value)} g`, name.replace('_inc', '')]} labelFormatter={(label) => `Fecha: ${label}`} />
                                 {uniqueEstanquesInHistory.map((est, idx) => (
                                    <Line key={est} type="monotone" dataKey={`${est}_inc`} name={`${est}_inc`} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={{ fill: lineColors[idx % lineColors.length], strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                                 ))}
                               </LineChart>
                             )}
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
                      </div>
                    </>
                  )}
                </div>

                {/* Supervivencia */}
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                  {chartView === 'cosechas' ? (
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-indigo-500">📊</span> Desglose de Kilos por Etapa (kg)</h2>
                      <div className="flex-1 min-h-0">
                        {harvestChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={harvestChartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} kg`, '']} />
                              <Bar dataKey="pre1Kilos" stackId="a" name="1ra Pre-Cosecha" fill="#60a5fa" />
                              <Bar dataKey="pre2Kilos" stackId="a" name="2da Pre-Cosecha" fill="#34d399" />
                              <Bar dataKey="finalKilos" stackId="a" name="Cosecha Final" fill="#f97316" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos de cosechas para graficar</div>}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-emerald-500">🛡️</span> Supervivencia (%)</h2>
                      <div className="flex-1 min-h-0">
                        {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            {chartView === 'actual' ? (
                              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)}%`, 'Supervivencia']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="sobrevivencia" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-surv-${index}`} fill={entry.sobrevivencia > 75 ? '#10b981' : entry.sobrevivencia > 50 ? '#f59e0b' : '#ef4444'} />))}</Bar></BarChart>
                            ) : (
                              <LineChart data={historicalChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number, name: string) => [`${formatNumber(value)}%`, name.replace('_surv', '')]} labelFormatter={(label) => `Fecha: ${label}`} />
                                {uniqueEstanquesInHistory.map((est, idx) => (
                                   <Line key={est} type="monotone" dataKey={`${est}_surv`} name={`${est}_surv`} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={{ fill: lineColors[idx % lineColors.length], strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                                ))}
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
                      </div>
                    </>
                  )}
                </div>

                {/* Biomasa Total */}
                <div className="bg-[#0B4075] p-6 rounded-xl border border-[#125699] shadow-sm flex flex-col h-[320px]">
                  {chartView === 'cosechas' ? (
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-orange-400">🦐</span> Tallas Promedio por Etapa (g)</h2>
                      <div className="flex-1 min-h-0">
                        {harvestChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={harvestChartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} g`, '']} />
                              <Bar dataKey="pre1Gramos" name="1ra Pre-Cosecha (g)" fill="#818cf8" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="pre2Gramos" name="2da Pre-Cosecha (g)" fill="#a78bfa" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="finalGramos" name="Cosecha Final (g)" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos de cosechas para graficar</div>}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><span className="text-orange-400">🦐</span> Biomasa Total (kg)</h2>
                      <div className="flex-1 min-h-0">
                        {(chartView === 'actual' ? chartData.length : historicalChartData.length) > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                             {chartView === 'actual' ? (
                               <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" /><XAxis dataKey="estanque" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} label={{ value: 'Estanque', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} /><Tooltip cursor={{fill: '#0F4C8A'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number) => [`${formatNumber(value)} kg`, 'Biomasa']} labelFormatter={(label) => `Estanque ${label}`} /><Bar dataKey="biomasaTotal" radius={[4, 4, 0, 0]} fill="#fb923c" /></BarChart>
                             ) : (
                               <LineChart data={historicalChartData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#125699" />
                                 <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                 <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#093661', color: '#fff' }} formatter={(value: number, name: string) => [`${formatNumber(value)} kg`, name.replace('_biomasa', '')]} labelFormatter={(label) => `Fecha: ${label}`} />
                                 {uniqueEstanquesInHistory.map((est, idx) => (
                                    <Line key={est} type="monotone" dataKey={`${est}_biomasa`} name={`${est}_biomasa`} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={{ fill: lineColors[idx % lineColors.length], strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                                 ))}
                               </LineChart>
                             )}
                          </ResponsiveContainer>
                        ) : <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Sin datos para graficar</div>}
                      </div>
                    </>
                  )}
                </div>

              </div>
