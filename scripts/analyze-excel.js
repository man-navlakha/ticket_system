const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'laptop data (3).xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        if (data.length > 0) {
            console.log('Headers:', data[0]);
            console.log('Sample Row:', data[1]);
        } else {
            console.log('Sheet is empty');
        }
    });
} catch (error) {
    console.error('Error reading excel:', error);
}
