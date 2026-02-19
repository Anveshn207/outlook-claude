const XLSX = require('xlsx');

// Read the combined file
const wb = XLSX.readFile('C:\\Outlook Claude\\Kurweball\\bench-sales-airtable.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' });

console.log('Total rows:', rows.length);

// Check what statuses exist
const statuses = {};
const sources = {};
const workAuths = {};
rows.forEach(r => {
  const s = (r['Applicant Status'] || '').trim();
  const src = (r['Source'] || '').trim();
  const wa = (r['Work Authorization'] || '').trim();
  statuses[s] = (statuses[s] || 0) + 1;
  sources[src] = (sources[src] || 0) + 1;
  workAuths[wa] = (workAuths[wa] || 0) + 1;
});

console.log('\n--- Applicant Statuses ---');
Object.entries(statuses).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\n--- Sources ---');
Object.entries(sources).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\n--- Work Authorizations ---');
Object.entries(workAuths).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

// Show a few sample rows
console.log('\n--- Sample rows ---');
rows.slice(0, 3).forEach((r, i) => {
  console.log(`\nRow ${i+1}:`);
  Object.entries(r).forEach(([k,v]) => {
    if (v) console.log(`  ${k}: ${v}`);
  });
});
