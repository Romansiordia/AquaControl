const fs = require('fs');
const path = require('path');

const files = [
  './components/Sidebar.tsx',
  './components/ProductionProgram.tsx',
  './components/StatisticsTable.tsx',
  './components/EstadisticasView.tsx',
  './components/FilterPanel.tsx',
  './components/DashboardStats.tsx',
  './components/PondForm.tsx',
  './App.tsx',
];

const replaces = {
  '#0B1423': '#093661',
  '#080E18': '#072C52',
  '#0F1D32': '#0B4075',
  '#1F304B': '#125699',
  '#1C2C42': '#0F4C8A',
  '#132338': '#0E4680',
  '#2A3E5A': '#1B66B0'
};

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [search, replace] of Object.entries(replaces)) {
      content = content.split(search).join(replace);
    }
    fs.writeFileSync(file, content);
  }
});
