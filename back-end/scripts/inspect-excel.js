const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../docs/unittest/KidsLink_UnitTest_Final_v1.0.xlsx');
const workbook = XLSX.readFile(filePath);
console.log('Sheets:', workbook.SheetNames);

const sheetName = 'Sheet6';
const ws = workbook.Sheets[sheetName];
if (!ws) {
  console.log('Sheet6 not found');
  process.exit(0);
}
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
console.log('\nSheet6 - preview rows 1..60');
for (let i = 0; i < Math.min(60, data.length); i++) {
  console.log(String(i+1).padStart(3,' '), data[i]);
}
