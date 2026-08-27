const val = '2026-06-27T07:00';
const fixNumberFromDate = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    if (!isNaN(Number(val)) && val.trim() !== '') return Number(val);
    if (val.startsWith('1899-') || val.startsWith('1900-')) {
      const d = new Date(val);
      const base = new Date('1899-12-30T00:00:00.000Z');
      const diffDays = (d.getTime() - base.getTime()) / (1000 * 3600 * 24);
      if (Math.abs(diffDays - Math.round(diffDays)) < 0.05) return Math.round(diffDays);
      return Number(diffDays.toFixed(2));
    }
  }
  return val || 0;
};
console.log(fixNumberFromDate(val));
