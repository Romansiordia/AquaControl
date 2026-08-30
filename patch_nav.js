const fs = require('fs');

let app = fs.readFileSync('App.tsx', 'utf8');

const targetStr = `<button 
                      onClick={handleExportPDF} 
                      disabled={isExporting}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all"
                    >
                      {isExporting ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      )}
                      <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar a PDF'}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-[#0B4075] border border-[#1B66B0] hover:bg-[#0F4C8A] text-blue-100 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="hidden sm:inline">Cargar Archivo</span>
                    </button>`;

const replaceStr = `<button 
                      onClick={handleExportPDF} 
                      disabled={isExporting}
                      className="bg-[#0B4075] border border-[#125699] hover:bg-[#0F4C8A] hover:border-indigo-400 hover:text-white disabled:opacity-50 text-blue-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                    >
                      {isExporting ? (
                        <svg className="animate-spin h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      )}
                      <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar a PDF'}</span>
                    </button>`;

app = app.replace(targetStr, replaceStr);

fs.writeFileSync('App.tsx', app);
