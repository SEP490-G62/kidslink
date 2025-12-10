const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../docs/unittest/KidsLink_UnitTest_v2.0.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('=== KidsLink_UnitTest_v2.0.xlsx ===\n');
console.log('Total sheets:', workbook.SheetNames.length);
console.log('Sheet names:', workbook.SheetNames.slice(0, 10), '...\n');

// Check first method sheet (login)
const sheetName = 'login';
console.log(`=== SAMPLE SHEET: ${sheetName} ===`);
const ws = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('\n--- Rows 1-10 ---');
for (let i = 0; i < 10; i++) {
    if (data[i]) console.log(`Row ${i+1}:`, data[i].slice(0, 10));
}

console.log('\n--- Row 23 (Confirm/Return) ---');
if (data[22]) console.log('Row 23:', data[22].slice(0, 10));

console.log('\n--- Row 26 (Exception) ---');
if (data[25]) console.log('Row 26:', data[25].slice(0, 10));

console.log('\n--- Row 30 (Log message) ---');
if (data[29]) console.log('Row 30:', data[29].slice(0, 10));

console.log('\n--- Rows 34-38 (Result section) ---');
for (let i = 33; i < 38; i++) {
    if (data[i]) console.log(`Row ${i+1}:`, data[i].slice(0, 10));
}
