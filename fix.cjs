const fs = require('fs');
let content = fs.readFileSync('components/EstadisticasView.tsx', 'utf8');

content = content.replace(/<\/LineChart>\s*<\/ResponsiveContainer>/g, "</LineChart>\n                            )}\n                          </ResponsiveContainer>");

fs.writeFileSync('components/EstadisticasView.tsx', content);
