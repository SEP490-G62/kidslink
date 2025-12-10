const XLSX = require('xlsx');
const path = require('path');

// Đọc file Excel
const filePath = path.join(__dirname, '../../docs/unittest/_Report 5.1_Unit Test.xlsx');
const workbook = XLSX.readFile(filePath);

// Lấy tất cả sheet names
console.log('Sheets trong file:', workbook.SheetNames);
console.log('\n=================\n');

// Đọc từng sheet
workbook.SheetNames.forEach(sheetName => {
    console.log(`\n📋 SHEET: ${sheetName}`);
    console.log('='.repeat(80));
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    // In ra 20 dòng đầu
    jsonData.slice(0, 20).forEach((row, index) => {
        if (row.some(cell => cell !== '')) {
            console.log(`Row ${index + 1}:`, row);
        }
    });
    
    console.log(`\n... (Total rows: ${jsonData.length})\n`);
});
