const fs = require('fs');
let content = fs.readFileSync('components/EstadisticasView.tsx', 'utf8');

// The issue is that the `<ResponsiveContainer>` is opened like:
// {chartView === 'actual' ? ( <BarChart.../> ) : ( <LineChart.../> )}
// So we need `)}` before `</ResponsiveContainer>`!
content = content.replace(/<\/LineChart>\s*<\/ResponsiveContainer>/g, "</LineChart>\n                            )}\n                          </ResponsiveContainer>");

fs.writeFileSync('components/EstadisticasView.tsx', content);
