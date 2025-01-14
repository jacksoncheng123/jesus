document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('timeline');
    const loader = document.getElementById('loader');
    const errorElement = document.getElementById('error');

    // Web App Install Prompt
    let deferredPrompt;

    // Show the install button if the browser supports the "beforeinstallprompt" event
    window.addEventListener('beforeinstallprompt', (event) => {
        // Prevent the mini-infobar from appearing on mobile
        event.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = event;

        // Optionally, show a custom install button
        const installButton = document.createElement('button');
        installButton.textContent = 'Install App';
        document.body.appendChild(installButton);

        installButton.addEventListener('click', () => {
            // Show the install prompt
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        });
    });

    // Register service worker to enable offline functionality and caching
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then((registration) => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }

    // Fetch the itinerary data
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

    // Parse CSV to extract event data
    function parseCSV(csvText) {
        const rows = csvText.split('\n');
        const headers = rows[0].split(',');
        const dateIndexes = headers.slice(1).map((_, index) => index + 1); // Skip the first column
        const events = [];

        dateIndexes.forEach((columnIndex) => {
            const date = headers[columnIndex]?.trim();
            if (!date) return;

            const activities = [];

            // Parse schedules from rows
            const scheduleRow = rows.find(row => row.startsWith('Schedule'));
            if (scheduleRow) {
                const scheduleCells = scheduleRow.split(',');
                if (scheduleCells[columnIndex]?.trim()) {
                    activities.push(scheduleCells[columnIndex].trim());
                }
            }

            // Parse hotel information
            const hotelRow = rows.find(row => row.startsWith('Hotel'));
            if (hotelRow) {
                const hotels = hotelRow.split(',');
                if (hotels[columnIndex]?.trim()) {
                    activities.push(`Hotel: ${hotels[columnIndex].trim()}`);
                }
            }

            // Parse pass information
            const passRow = rows.find(row => row.startsWith('Pass'));
            if (passRow) {
                const passes = passRow.split(',');
                if (passes[columnIndex]?.trim()) {
                    activities.push(`Pass: ${passes[columnIndex].trim()}`);
                }
            }

            if (activities.length > 0) {
                // Format date as yyyy-mm-dd
                const [day, month, year] = date.split('/');
                const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

                events.push({
                    date: formattedDate,
                    activities: activities
                });
            }
        });

        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Format date to human-readable format
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { // 'en-GB' for dd/mm/yyyy
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Create an event element
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
            if (activity.includes("http")) {
                // Make the activity clickable if it's a link
                const link = document.createElement('a');
                link.href = activity;
                link.target = '_blank';
                link.textContent = activity;
                li.appendChild(link);
            } else {
                li.textContent = activity;
            }
            activitiesList.appendChild(li);
        });

        eventDiv.appendChild(activitiesList);
        return eventDiv;
    }

    // Render events into the timeline
    function renderEvents(events) {
        timelineContainer.innerHTML = '';
        events.forEach(event => {
            const eventElement = createEventElement(event);
            timelineContainer.appendChild(eventElement);
        });
    }

    // Initialize the web app and load data
    async function initialize() {
        try {
            loader.style.display = 'block';
            errorElement.style.display = 'none';

            const events = await fetchData();

            if (events.length === 0) {
                throw new Error('No events found in the schedule');
            }

            renderEvents(events);

            // Scroll to the current date
            const currentDate = new Date().toISOString().split('T')[0]; // Get today's date in yyyy-mm-dd format
            const currentEvent = Array.from(timelineContainer.children).find(event => event.querySelector('.event-date').textContent.includes(currentDate));

            if (currentEvent) {
                currentEvent.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

        } catch (error) {
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        } finally {
            loader.style.display = 'none';
        }
    }

    // Call initialize to load data and render events
    initialize();
});
