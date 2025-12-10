const fs = require('fs');
const path = require('path');

// Đọc tất cả controller files
const controllersDir = path.join(__dirname, '../src/controllers');
const files = fs.readdirSync(controllersDir);

const methods = [];
let no = 1;

files.forEach(file => {
    if (file.endsWith('.js') && !fs.statSync(path.join(controllersDir, file)).isDirectory()) {
        const content = fs.readFileSync(path.join(controllersDir, file), 'utf-8');
        const moduleName = file.replace('.js', '');
        
        // Tìm tất cả exported functions
        const exportMatches = [
            ...content.matchAll(/exports\.(\w+)\s*=\s*async/g),
            ...content.matchAll(/const\s+(\w+)\s*=\s*async.*module\.exports.*\1/gs)
        ];
        
        exportMatches.forEach(match => {
            methods.push({
                no: no++,
                moduleName: moduleName,
                methodName: match[1],
                sheetName: match[1],
                description: '',
                preCondition: ''
            });
        });
    }
});

// In ra format cho Excel
console.log('No\tModule Name\tMethod Name\tSheet Name\tDescription\tPre-Condition');
methods.forEach(m => {
    console.log(`${m.no}\t${m.moduleName}\t${m.methodName}\t${m.sheetName}\t${m.description}\t${m.preCondition}`);
});

console.log(`\n\nTotal methods found: ${methods.length}`);
console.log('\nBạn có thể copy nội dung trên và paste vào Excel sheet "MethodList"');
