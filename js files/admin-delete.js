function generateSlots(rows, cols) {
    const slots = [];
    let id = 1;
    for (let row = 1; row <= rows; row++) { 
        for (let col = 1; col <= cols; col++) { 
            slots.push({ id: id, available: true, user: null, reservationDate: null, slot: `Slot ${id}` });
            id++; 
        }
    }
    return slots;
}  
const slots = {
    A: generateSlots(5, 5),
    B: generateSlots(5, 5),
    C: generateSlots(5, 5),
    D: generateSlots(5, 5),
    E: generateSlots(5, 5)
};

async function loadAvailability() {
    const space = document.getElementById('spaces').value;
    const selectedDate = new Date(document.getElementById('date').value);
    const selectedTime = document.getElementById('time').value;
    const availabilityDiv = document.getElementById('space-availability');
    availabilityDiv.innerHTML = '';
    availabilityDiv.classList.add('space-availability');

  
    const response = await fetch(`/api/reservations?space=${space}&date=${selectedDate.toISOString().split('T')[0]}&time=${selectedTime}`);
    const reservations = await response.json();

    slots[space].forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';

        const reservation = reservations.find(res => res.slotId === slot.id);

        if (reservation) {
            slot.user = reservation.anonymous ? 'Anonymous' : reservation.userName;
            slot.reservationDate = new Date(reservation.date);
            slot.available = false;

            const userLink = document.createElement('a');
            userLink.href = '#';
            userLink.textContent = slot.user;
            slotDiv.appendChild(userLink);
            slotDiv.classList.add('space-reserved');
        } else {
            slot.available = true;
            slot.reservationDate = null;

            slotDiv.textContent = 'Available';
            slotDiv.classList.add('space-available');
            slotDiv.addEventListener('click', () => {
                handleReservationLink(space, selectedDate.toISOString(), selectedTime, slot.id);
            });
        }

        const slotName = document.createElement('div');
        slotName.textContent = slot.slot;
        slotDiv.appendChild(slotName);

        availabilityDiv.appendChild(slotDiv);
    });
}

function handleReservationLink(space, date, time, slotId) {
    window.location.href = `reserve?space=${space}&date=${date}&time=${time}&slotId=${slotId}`;
}

function isSameDateTime(reservationDate, selectedDate, selectedTime) {
    const formattedReservationDate = new Date(reservationDate);
    const formattedSelectedDate = new Date(selectedDate);
    const formattedSelectedTime = new Date(`2000-01-01T${selectedTime}`);

    return (
        formattedReservationDate.getFullYear() === formattedSelectedDate.getFullYear() &&
        formattedReservationDate.getMonth() === formattedSelectedDate.getMonth() &&
        formattedReservationDate.getDate() === formattedSelectedDate.getDate() &&
        formattedReservationDate.getHours() === formattedSelectedTime.getHours() &&
        formattedReservationDate.getMinutes() === formattedSelectedTime.getMinutes()
    );
}

function updateAvailability() {
    loadAvailability();
}

function generateTimeOptions() {
    const select = document.getElementById('time');
    select.innerHTML = ''; 

    for (let hour = 9; hour <= 15; hour++) {
        for (let minute = 0; minute <= 30; minute += 30) {
            const option = document.createElement('option');
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            option.text = time;
            option.value = time;
            select.add(option);
        }
    }
}

document.addEventListener('DOMContentLoaded', generateTimeOptions);
loadAvailability();
setInterval(updateAvailability, 60000);

document.getElementById("cancel").addEventListener("click", function() {
    window.location.href = "mainMenu";
});

document.addEventListener('DOMContentLoaded', function() {
    generateTimeOptions();
    loadAvailability();
    setInterval(updateAvailability, 60000);

    document.getElementById("cancel").addEventListener("click", function() {
        window.location.href = "mainMenu";
    });
});