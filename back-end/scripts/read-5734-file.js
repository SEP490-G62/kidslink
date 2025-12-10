const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../docs/unittest/5734_APHL_SEP490_G75_Report5.1_Unit_Test.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('=== FILE: 5734_APHL_SEP490_G75_Report5.1_Unit_Test.xlsx ===\n');
console.log('Sheets:', workbook.SheetNames);
console.log('\n');

// Read MethodList to see structure
if (workbook.SheetNames.includes('MethodList')) {
    console.log('=== METHODLIST SHEET ===');
    const ws = workbook.Sheets['MethodList'];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    for (let i = 0; i < Math.min(20, data.length); i++) {
        console.log(`Row ${i+1}:`, data[i]);
    }
    console.log('\n');
}

// Read a sample test sheet (take first method sheet after statistics)
const testSheetIndex = workbook.SheetNames.findIndex(s => 
    !['Guideline', 'Cover', 'MethodList', 'Statistics', 'Example'].includes(s)
);

if (testSheetIndex >= 0) {
    const sheetName = workbook.SheetNames[testSheetIndex];
    console.log(`=== SAMPLE TEST SHEET: ${sheetName} ===`);
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    for (let i = 0; i < Math.min(50, data.length); i++) {
        if (data[i].some(cell => cell !== '')) {
            console.log(`Row ${i+1}:`, data[i]);
        }
    }
}
