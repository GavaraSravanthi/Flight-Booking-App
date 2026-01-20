// State Management
const state = {
    search: {
        from: '',
        to: '',
        date: '',
        passengers: 1
    },
    selectedFlight: null,
    selectedClass: null
};

// Mock Data
const AIRLINES = [
    { name: 'SkyLuxe', logo: 'SL' },
    { name: 'AeroJet', logo: 'AJ' },
    { name: 'Nimbus', logo: 'NI' },
    { name: 'RoyalAir', logo: 'RA' }
];

// DOM Elements
const views = {
    search: document.getElementById('search-view'),
    results: document.getElementById('results-view'),
    booking: document.getElementById('booking-view'),
    success: document.getElementById('success-view')
};

// Helper: Switch Views
function switchView(viewName) {
    Object.values(views).forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });
    
    // Small delay for fade in
    const target = views[viewName];
    target.classList.remove('hidden');
    
    // Force reflow
    void target.offsetWidth; 
    
    target.classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Helper: Generate Random Flights
function generateFlights(from, to) {
    const flightCount = 4 + Math.floor(Math.random() * 3); // 4-6 flights
    const flights = [];

    for (let i = 0; i < flightCount; i++) {
        const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
        const hour = 6 + Math.floor(Math.random() * 14); // 6 AM to 8 PM
        const min = Math.floor(Math.random() * 4) * 15;
        const durationH = 2 + Math.floor(Math.random() * 8);
        const durationM = Math.floor(Math.random() * 4) * 15;
        
        const depTime = new Date();
        depTime.setHours(hour, min, 0);
        
        const arrTime = new Date(depTime);
        arrTime.setHours(hour + durationH, min + durationM);
        
        const basePrice = 200 + (durationH * 50) + Math.floor(Math.random() * 100);

        flights.push({
            id: i,
            airline: airline.name,
            logo: airline.logo,
            from: from,
            to: to,
            depTime: depTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            arrTime: arrTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            duration: `${durationH}h ${durationM > 0 ? durationM + 'm' : ''}`,
            basePrice: basePrice
        });
    }
    return flights.sort((a,b) => a.basePrice - b.basePrice);
}

// 1. Search Logic
document.getElementById('flight-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const from = document.getElementById('from-input').value;
    const to = document.getElementById('to-input').value;
    const date = document.getElementById('date-depart').value;
    
    // Validation
    if(!from || !to || !date) return alert('Please fill in all fields');

    state.search = { from, to, date };

    // Update Results Header
    document.getElementById('route-display').innerHTML = `${from} <i class="fa-solid fa-arrow-right"></i> ${to}`;
    document.getElementById('date-display').textContent = new Date(date).toLocaleDateString([], {weekday: 'short', day: 'numeric', month: 'short'});

    // Generate Flights
    const flights = generateFlights(from, to);
    renderFlights(flights);

    switchView('results');
});

// Render Flights
function renderFlights(flights) {
    const container = document.getElementById('flight-list');
    container.innerHTML = '';

    flights.forEach((flight, index) => {
        const card = document.createElement('div');
        card.className = 'flight-card glass';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="flight-main" onclick="toggleFlight(${index})">
                <div class="airline-info">
                    <div class="airline-logo">${flight.logo}</div>
                    <div>
                        <h3>${flight.airline}</h3>
                        <small>Non-stop</small>
                    </div>
                </div>
                <div class="flight-details">
                    <div class="dep">
                        <div class="time">${flight.depTime}</div>
                        <small>${flight.from}</small>
                    </div>
                    <div class="duration-line">
                        <small>${flight.duration}</small>
                        <div class="line"><i class="fa-solid fa-plane"></i></div>
                    </div>
                    <div class="arr">
                        <div class="time">${flight.arrTime}</div>
                        <small>${flight.to}</small>
                    </div>
                </div>
                <div class="price-action">
                    <span class="price">$${flight.basePrice}</span>
                    <span class="per-person">per person</span>
                </div>
            </div>
            <div class="flight-classes" id="classes-${index}">
                 <!-- Classes injected here -->
            </div>
        `;
        
        // Inject Classes
        const classesDiv = card.querySelector(`#classes-${index}`);
        const classes = [
            { name: 'Economy', mult: 1, features: ['Standard Seat', '1 Carry-on'] },
            { name: 'Business', mult: 2.2, features: ['Lounge Access', 'Priority Boarding', 'Recliner Seat'] },
            { name: 'First Class', mult: 4, features: ['Private Suite', 'Gourmet Dining', 'Full Bed'] }
        ];

        classes.forEach(cls => {
            const price = Math.round(flight.basePrice * cls.mult);
            const el = document.createElement('div');
            el.className = 'class-option';
            el.innerHTML = `
                <span class="class-name">${cls.name}</span>
                <span class="class-price">$${price}</span>
                <ul class="class-features">
                    ${cls.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
            `;
            el.onclick = (e) => {
                e.stopPropagation(); // prevent collapsing
                selectFlight(flight, cls.name, price);
            };
            classesDiv.appendChild(el);
        });

        container.appendChild(card);
    });
}

// 2. Flight Selection
window.toggleFlight = function(index) {
    const allCards = document.querySelectorAll('.flight-card');
    const targetCard = allCards[index];
    
    // Close others
    allCards.forEach((c, i) => {
        if(i !== index) c.classList.remove('expanded');
    });
    
    targetCard.classList.toggle('expanded');
};

function selectFlight(flight, className, price) {
    state.selectedFlight = flight;
    state.selectedClass = { name: className, price: price };
    
    // Update Booking View
    updateBookingSummary();
    switchView('booking');
}

// 3. Booking Logic
function updateBookingSummary() {
    const summaryEl = document.getElementById('booking-summary-card');
    const f = state.selectedFlight;
    const c = state.selectedClass;

    summaryEl.innerHTML = `
        <h3>Booking Summary</h3>
        <div class="summary-header">
            <div class="summary-flight-info">
                <strong>${f.from} to ${f.to}</strong>
            </div>
            <div class="summary-flight-info">
                <span>${f.airline} • ${c.name}</span>
            </div>
            <div class="summary-flight-info">
                <span>${f.depTime} - ${f.arrTime}</span>
            </div>
        </div>
        <div>
            <div class="flex-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>Ticket Price</span>
                <span>$${c.price}</span>
            </div>
             <div class="flex-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>Taxes & Fees</span>
                <span>$45</span>
            </div>
             <div class="total-price">
                <span>Total</span>
                <span>$${c.price + 45}</span>
            </div>
        </div>
    `;
}

document.getElementById('booking-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Simulate API call
    const btn = document.querySelector('.book-confirm-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Processing...';
    btn.style.opacity = '0.7';

    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.opacity = '1';
        
        // Generate Ticket
        generateTicket();
        switchView('success');
    }, 1500);
});

function generateTicket() {
    const f = state.selectedFlight;
    const c = state.selectedClass;
    const name = document.querySelector('input[placeholder="John"]').value + ' ' + document.querySelector('input[placeholder="Doe"]').value;
    
    const ticketEl = document.getElementById('final-ticket');
    ticketEl.innerHTML = `
        <div style="border-bottom: 2px dashed #ccc; padding-bottom: 1rem; margin-bottom: 1rem;">
            <h3 style="margin-bottom:0.5rem;">${f.airline} Boarding Pass</h3>
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <small>Passenger</small>
                    <div>${name || 'Guest'}</div>
                </div>
                 <div>
                    <small>Class</small>
                    <div>${c.name}</div>
                </div>
            </div>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between;">
            <div class="ticket-route" style="font-size:1.5rem; font-weight:700;">
                ${f.from.substring(0,3).toUpperCase()} 
                <i class="fa-solid fa-plane" style="font-size:1rem; color:#ccc;"></i> 
                ${f.to.substring(0,3).toUpperCase()}
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.2rem; font-weight:700;">${f.depTime}</div>
                <small>Gate A4</small>
            </div>
        </div>
    `;
}

// Navigation Back Buttons
document.getElementById('back-to-search').onclick = () => switchView('search');
document.getElementById('back-to-results').onclick = () => switchView('results');
document.getElementById('go-home').onclick = () => {
    // Reset Form
    document.getElementById('flight-search-form').reset();
    document.getElementById('booking-form').reset();
    switchView('search');
};

// Swap Inputs
document.querySelector('.swap-icon').onclick = () => {
    const from = document.getElementById('from-input');
    const to = document.getElementById('to-input');
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
};

// Initialize Date Input to Today
document.getElementById('date-depart').valueAsDate = new Date();
