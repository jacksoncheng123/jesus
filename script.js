let scheduleData = [];
let showPastSchedule = false;

const remarks = {
    1: "基本原則：每日不多於2個Test及1個補課",
    2: "請留意14~19/11 之循環週日子調動",
    3: "Core 1(WCP): R301 | Core 2(WYF): R302 | 6D(YKC): R303 | M1(LHJ): R304 | M2(KTY): R305",
    4: "詩三首, 勸學, 師說, 論仁, 魚我",
    5: "詞, 逍, 始, 岳, 廉",
    6: "加油！！！撐住！！！"
};

// Fetch JSON data and initialize tables
fetch('schedule_data.json')
    .then(response => response.json())
    .then(data => {
        scheduleData = data;
        initializeFilters(scheduleData);
        displayUpcomingSchedule(scheduleData); // Display upcoming schedule first
        displayFullSchedule(scheduleData);
    });

// Initialize dropdown filter options
function initializeFilters(data) {
    const subjectFilter = document.getElementById('subject-filter');
    const dateFilter = document.getElementById('date-filter');
    
    // Clear existing options
    subjectFilter.innerHTML = '';

    // Add an option for "All Subjects" or "No Filter"
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All Subjects';
    subjectFilter.appendChild(allOption);

    // Populate unique subjects for dropdown
    const subjects = [...new Set(data.map(item => item.RemedialClass))];

    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
    });

    // Add event listeners to auto-apply filter on selection change
    subjectFilter.addEventListener('change', applyFilters);
    dateFilter.addEventListener('input', applyFilters);
}

// Convert date from "2024年9月10日" to "YYYY-MM-DD"
function parseDate(dateString) {
    const year = dateString.slice(0, 4);
    const month = dateString.slice(5, dateString.indexOf('月')) - 1;
    const day = dateString.slice(dateString.indexOf('月') + 1, dateString.indexOf('日'));
    return new Date(Date.UTC(year, month, day));
}

// Display full schedule, showing only future events by default
function displayFullSchedule(data) {
    const tableBody = document.getElementById('schedule-table').querySelector('tbody');
    tableBody.innerHTML = '';
    const today = new Date().setHours(0, 0, 0, 0);
    const currentYear = new Date().getFullYear();

    data.forEach(item => {
        const itemDate = parseDate(item.Date).setHours(0, 0, 0, 0);
        if (!showPastSchedule && itemDate < today) return;

        const date = parseDate(item.Date);
        const displayDate = date.getFullYear() === currentYear ? `${date.getMonth() + 1}月${date.getDate()}日` : item.Date;

        let location = item.RemedialLocation;
        const locationMatch = location.match(/備註#(\d+)/);
        if (locationMatch) {
            const remarkNumber = locationMatch[1];
            location = location.replace(`備註#${remarkNumber}`, `<span class="remarks-link" onclick="showRemark(${remarkNumber})">備註#${remarkNumber}</span>`);
        }

        let notes = item.Notes;
        const notesMatch = notes.match(/備註#(\d+)/);
        if (notesMatch) {
            const remarkNumber = notesMatch[1];
            notes = notes.replace(`備註#${remarkNumber}`, `<span class="remarks-link" onclick="showRemark(${remarkNumber})">備註#${remarkNumber}</span>`);
        }

        const row = `<tr>
            <td>${displayDate}</td>
            <td>${item.Day}</td>
            <td>${item.Weekday}</td>
            <td>${item.RemedialClass}</td>
            <td>${location}</td>
            <td>${notes}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// Display today's schedule and the next available schedule date only
function displayUpcomingSchedule(data) {
    const tableBody = document.getElementById('upcoming-table').querySelector('tbody');
    tableBody.innerHTML = '';
    const today = new Date().setHours(0, 0, 0, 0);
    let nextAvailableDate = null;

    // Filter data for today
    const todayData = data.filter(item => {
        const itemDate = parseDate(item.Date).setHours(0, 0, 0, 0);
        return itemDate === today;
    });

    // Find the next available date
    for (const item of data) {
        const itemDate = parseDate(item.Date).setHours(0, 0, 0, 0);
        if (itemDate > today) {
            nextAvailableDate = itemDate;
            break;
        }
    }

    // Filter data for the next available date
    const nextData = data.filter(item => {
        const itemDate = parseDate(item.Date).setHours(0, 0, 0, 0);
        return itemDate === nextAvailableDate;
    });

    // Combine today's data and the next available date
    const combinedData = [...todayData, ...nextData];

    if (combinedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4">No upcoming schedule available.</td></tr>`;
    } else {
        const currentYear = new Date().getFullYear();
        combinedData.forEach(item => {
            const date = parseDate(item.Date);
            const displayDate = date.getFullYear() === currentYear ? `${date.getMonth() + 1}月${date.getDate()}日` : item.Date;

            let location = item.RemedialLocation;
            const locationMatch = location.match(/備註#(\d+)/);
            if (locationMatch) {
                const remarkNumber = locationMatch[1];
                location = location.replace(`備註#${remarkNumber}`, `<span class="remarks-link" onclick="showRemark(${remarkNumber})">備註#${remarkNumber}</span>`);
            }

            let notes = item.Notes;
            const notesMatch = notes.match(/備註#(\d+)/);
            if (notesMatch) {
                const remarkNumber = notesMatch[1];
                notes = notes.replace(`備註#${remarkNumber}`, `<span class="remarks-link" onclick="showRemark(${remarkNumber})">備註#${remarkNumber}</span>`);
            }

            const row = `<tr>
                <td>${displayDate}</td>
                <td>${item.RemedialClass}</td>
                <td>${location}</td>
                <td>${notes}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    }
}

// Show the corresponding remark based on the location
function showRemark(remarkNumber) {
    alert(remarks[remarkNumber]);
}

// Show all remarks
function showAllRemarks() {
    let allRemarks = '';
    for (let key in remarks) {
        allRemarks += `Remark #${key}: ${remarks[key]}\n`;
    }
    alert(allRemarks);
}

// Filter schedule based on user input for full schedule only
function applyFilters() {
    const subjectFilter = document.getElementById('subject-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    
    const filteredData = scheduleData.filter(item => {
        const subjectMatch = subjectFilter ? item.RemedialClass === subjectFilter : true;
        const dateMatch = dateFilter ? parseDate(item.Date).toISOString().slice(0, 10) === dateFilter : true;
        return subjectMatch && dateMatch;
    });
    
    displayFullSchedule(filteredData);
}

// Clear filters and reset to default future-only view in the full schedule
function clearFilters() {
    document.getElementById('subject-filter').value = '';
    document.getElementById('date-filter').value = '';
    showPastSchedule = false;
    displayFullSchedule(scheduleData);
}

// Toggle past schedule view for full schedule only
function togglePastSchedule() {
    showPastSchedule = !showPastSchedule;
    displayFullSchedule(scheduleData);
}
