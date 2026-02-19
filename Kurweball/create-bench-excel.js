const XLSX = require('xlsx');

const wb = XLSX.readFile('C:\\Outlook Claude\\Kurweball\\bench-sales-airtable.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const allRows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });

// Bench sales = visa-dependent candidates (H1B, OPT, EAD, GC-EAD, etc.)
const benchVisaTypes = [
  'Have H1 Visa',
  'Need H1 Visa',
  'H1-B',
  'Employment Auth. Document',
  'OPT-EAD',
  'GC-EAD',
];

const benchRows = allRows.filter(r => {
  const wa = (r['Work Authorization'] || '').trim();
  return benchVisaTypes.includes(wa);
});

console.log(`Filtered: ${benchRows.length} bench sales candidates from ${allRows.length} total`);

// Show breakdown
const breakdown = {};
benchRows.forEach(r => {
  const wa = r['Work Authorization'] || 'Unknown';
  breakdown[wa] = (breakdown[wa] || 0) + 1;
});
console.log('\nVisa breakdown:');
Object.entries(breakdown).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

// Write bench sales Excel
const newWb = XLSX.utils.book_new();
const newSheet = XLSX.utils.json_to_sheet(benchRows);

// Auto-size columns
const colWidths = {};
const headers = Object.keys(benchRows[0] || {});
headers.forEach(h => { colWidths[h] = h.length; });
benchRows.forEach(row => {
  headers.forEach(h => {
    const val = String(row[h] || '');
    colWidths[h] = Math.max(colWidths[h], Math.min(val.length, 40));
  });
});
newSheet['!cols'] = headers.map(h => ({ wch: colWidths[h] + 2 }));

XLSX.utils.book_append_sheet(newWb, newSheet, 'Bench Sales');
XLSX.writeFile(newWb, 'C:\\Outlook Claude\\Kurweball\\bench-sales-data.xlsx');
console.log('\nSaved: bench-sales-data.xlsx');

// Also create the full data file
const fullWb = XLSX.utils.book_new();
const fullSheet = XLSX.utils.json_to_sheet(allRows);
fullSheet['!cols'] = headers.map(h => ({ wch: colWidths[h] + 2 }));
XLSX.utils.book_append_sheet(fullWb, fullSheet, 'All Applicants');
XLSX.writeFile(fullWb, 'C:\\Outlook Claude\\Kurweball\\all-applicants-data.xlsx');
console.log('Saved: all-applicants-data.xlsx (full data)');
