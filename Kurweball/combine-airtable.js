const XLSX = require('xlsx');
const path = require('path');

const downloadsDir = path.join('C:', 'Users', 'E2 Training', 'Downloads');
const outputFile = path.join('C:', 'Outlook Claude', 'Kurweball', 'bench-sales-airtable.xlsx');

const files = [
  'applicants_list_3106171748533455-1.xlsx',
  'applicants_list_3106171748533455-2.xlsx',
  'applicants_list_3106171748533455-3.xlsx',
  'applicants_list_3106171748533455-4.xlsx',
  'applicants_list_3106171748533455-5.xlsx',
  'applicants_list_3106171748533455-6.xlsx',
  'applicants_list_3106171748533455-7.xlsx',
];

let realHeaders = null;
let allRows = [];

for (const file of files) {
  const filePath = path.join(downloadsDir, file);
  console.log('Reading: ' + file);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!data || data.length === 0) {
    console.log('  -> Empty file, skipping');
    continue;
  }

  // Find the actual header row (first row where column A looks like 'Applicant ID')
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    const firstCell = String(row[0] || '').trim();
    if (firstCell === 'Applicant ID') {
      headerRowIdx = i;
      break;
    }
  }

  if (realHeaders === null) {
    if (headerRowIdx === -1) {
      console.log('  -> ERROR: Could not find header row!');
      process.exit(1);
    }
    realHeaders = data[headerRowIdx];
    const rows = data.slice(headerRowIdx + 1).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));
    allRows.push(...rows);
    console.log('  -> Headers found at row ' + headerRowIdx + ' (' + realHeaders.length + ' columns), ' + rows.length + ' data rows');
  } else {
    let startIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    // Also skip any meta rows before the header
    const rows = data.slice(startIdx).filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));
    allRows.push(...rows);
    console.log('  -> ' + (headerRowIdx !== -1 ? 'Header+meta rows skipped, ' : '') + rows.length + ' data rows');
  }
}

console.log('');
console.log('===== COMBINED DATASET =====');
console.log('Total columns: ' + realHeaders.length);
console.log('Total data rows: ' + allRows.length);

console.log('');
console.log('===== HEADERS =====');
realHeaders.forEach((h, i) => console.log('  [' + i + '] ' + h));

console.log('');
console.log('===== FIRST 3 ROWS (sample) =====');
for (let r = 0; r < Math.min(3, allRows.length); r++) {
  console.log('');
  console.log('--- Row ' + (r + 1) + ' ---');
  realHeaders.forEach((h, i) => {
    const val = allRows[r][i];
    if (val !== '' && val !== null && val !== undefined) {
      console.log('  ' + h + ': ' + String(val).substring(0, 150));
    }
  });
}

console.log('');
console.log('Writing combined file to: ' + outputFile);
const combinedData = [realHeaders, ...allRows];
const newSheet = XLSX.utils.aoa_to_sheet(combinedData);
const newWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Combined');
XLSX.writeFile(newWorkbook, outputFile);

console.log('');
console.log('Done! ' + allRows.length + ' rows written to bench-sales-airtable.xlsx');