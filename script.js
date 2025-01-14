// Load SheetJS for Excel parsing
let scheduleData = [];

// Function to fetch and parse Excel file
document.getElementById('upload-excel').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Parse the relevant sheet (e.g., "Go where")
            const sheetName = 'Go where';
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            scheduleData = parseExcelData(jsonData);
            renderSchedule();
        };

        reader.readAsArrayBuffer(file);
    }
});

// Parse Excel data into structured format
function parseExcelData(data) {
    const result = [];
    const headers = data[0]; // First row as headers

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length > 0) {
            result.push({
                date: headers[i],
                activity: row[4] || '', // Assuming activities are in the 5th column
                accommodation: row[0] || '', // Assuming accommodations are in the 1st column
            });
        }
    }

    return result;
}

// Render schedule dynamically
function renderSchedule() {
    const scheduleSection = document.getElementById('schedule-section');
    scheduleSection.innerHTML = '';

    scheduleData.forEach((entry) => {
        const scheduleItem = document.createElement('div');
        scheduleItem.classList.add('schedule-item');

        scheduleItem.innerHTML = `
            <div class="schedule-date">${entry.date}</div>
            <div class="schedule-activity">${entry.activity}</div>
            <div class="schedule-accommodation">${entry.accommodation}</div>
        `;

        scheduleSection.appendChild(scheduleItem);
    });
}

// Example filter initialization
function initializeFilters() {
    const filterInput = document.getElementById('filter-date');
    filterInput.addEventListener('input', (event) => {
        const filterValue = event.target.value;
        const filteredData = scheduleData.filter(entry => entry.date.includes(filterValue));

        const scheduleSection = document.getElementById('schedule-section');
        scheduleSection.innerHTML = '';

        filteredData.forEach((entry) => {
            const scheduleItem = document.createElement('div');
            scheduleItem.classList.add('schedule-item');

            scheduleItem.innerHTML = `
                <div class="schedule-date">${entry.date}</div>
                <div class="schedule-activity">${entry.activity}</div>
                <div class="schedule-accommodation">${entry.accommodation}</div>
            `;

            scheduleSection.appendChild(scheduleItem);
        });
    });
}
