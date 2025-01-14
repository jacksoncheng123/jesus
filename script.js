document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timeline');
    const loader = document.getElementById('loader');
    const errorElement = document.getElementById('error');

    async function fetchData() {
        try {
            const response = await fetch('G8.csv');
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const csvText = await response.text();
            return parseCSV(csvText);
        } catch (error) {
            throw new Error('Failed to load itinerary data');
        }
    }

    function parseCSV(csvText) {
        const rows = csvText.split('\n');
        const headers = rows[0].split(','); // First row is headers (dates)
        const events = [];

        // Loop through each date (starting from index 1 as index 0 is for flight)
        headers.slice(1).forEach((date, columnIndex) => {
            const trimmedDate = date.trim();
            if (!trimmedDate) return;

            const activities = [];

            // Extract flight data (from the first row)
            const flightData = rows[1].split(',');
            if (flightData[columnIndex + 1]?.trim()) {
                activities.push(`<strong>Flight:</strong> ${flightData[columnIndex + 1].trim()}`);
            }

            // Extract schedule data (from rows starting with "Schedule" until before "Pass")
            const scheduleActivities = [];
            rows.slice(2, rows.findIndex(row => row.startsWith('Pass'))).forEach(row => {
                const cells = row.split(',');
                if (cells[columnIndex + 1]?.trim()) {
                    // Check if it's a URL and make it clickable
                    let activity = cells[columnIndex + 1].trim();
                    if (activity.match(/^https?:\/\//)) {
                        activity = `<a href="${activity}" target="_blank">${activity}</a>`;
                    }
                    scheduleActivities.push(activity);
                }
            });

            if (scheduleActivities.length > 0) {
                // Only add "Schedule" once, then list each activity separately
                activities.push('<strong>Schedule:</strong>');
                scheduleActivities.forEach(activity => activities.push(`- ${activity}`));
            }

            // Extract hotel data (from rows starting with "Hotel")
            const hotelRows = rows.filter(row => row.startsWith('Hotel'));
            const hotelsForThisDay = hotelRows.map(row => {
                const hotels = row.split(',');
                return hotels[columnIndex + 1]?.trim();
            }).filter(Boolean);

            // Add multiple hotels for the same day
            if (hotelsForThisDay.length > 0) {
                activities.push('<strong>Hotel:</strong>');
                hotelsForThisDay.forEach(hotel => activities.push(`- ${hotel}`));
            }

            // Extract pass data (from the rows starting with "Pass")
            const passRow = rows.find(row => row.startsWith('Pass'));
            if (passRow) {
                const passes = passRow.split(',');
                if (passes[columnIndex + 1]?.trim()) {
                    activities.push(`<strong>Pass:</strong> ${passes[columnIndex + 1].trim()}`);
                }
            }

            if (activities.length > 0) {
                // Format the date to yyyy-mm-dd format (dd/mm/yyyy -> yyyy-mm-dd)
                const [day, month, year] = trimmedDate.split('/');
                const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

                events.push({
                    date: formattedDate,
                    activities: activities
                });
            }
        });

        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { // 'en-GB' for dd/mm/yyyy
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function createEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event';

        const dateDiv = document.createElement('div');
        dateDiv.className = 'event-date';
        dateDiv.textContent = formatDate(event.date);
        eventDiv.appendChild(dateDiv);

        const activitiesList = document.createElement('ul');
        activitiesList.className = 'event-activities';

        event.activities.forEach(activity => {
            const li = document.createElement('li');
            // Handle clickable link (if HTML is present in activity)
            li.innerHTML = activity;
            activitiesList.appendChild(li);
        });

        eventDiv.appendChild(activitiesList);
        return eventDiv;
    }

    function renderEvents(events) {
        timelineContainer.innerHTML = '';
        events.forEach(event => {
            const eventElement = createEventElement(event);
            timelineContainer.appendChild(eventElement);
        });
    }

    async function initialize() {
        try {
            loader.style.display = 'block';
            errorElement.style.display = 'none';

            const events = await fetchData();

            if (events.length === 0) {
                throw new Error('No events found in the schedule');
            }

            renderEvents(events);
        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        } finally {
            loader.style.display = 'none';
        }
    }

    initialize();
});
