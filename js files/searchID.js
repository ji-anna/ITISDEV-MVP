const slots = {};
const generatedSpaces = new Set();

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

async function markReservationCompleted(userId, slotId, date, time) {
    try {
        const response = await fetch(`/api/markReservationCompleted`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                slotId,
                date,
                time,
                status: 'completed',
            }),
        });

        const result = await response.json();
        if (result.success) {
            alert('Reservation marked as completed.');
        } else {
            alert('Failed to mark reservation as completed.');
        }
    } catch (error) {
        console.error('Error marking reservation as completed:', error);
        alert('Error completing reservation.');
    }
}

async function updateOverdueReservations() {
    const today = new Date().toISOString().split('T')[0];

    try {
        const response = await fetch(`/api/reservations/all`);
        const reservations = await response.json();

        const overdue = reservations.filter(res => {
            return res.status === 'active' && res.date < today;
        });

        for (const res of overdue) {
            await fetch(`/api/updateReservationStatus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reservationId: res._id,
                    newStatus: 'overtime'
                }),
            });
        }

        if (overdue.length > 0) {
            console.log(`${overdue.length} reservation(s) marked as overtime.`);
        }

    } catch (error) {
        console.error("Error updating overdue reservations:", error);
    }
}


async function loadAvailability(forcedSpace = null) {
    const spaceDropdown = document.getElementById('spaces');
    const space = forcedSpace || spaceDropdown?.value;

    if (!space) return;

    const availabilityDiv = document.getElementById('space-availability');
    if (!availabilityDiv) return;

    clearSlots();
    generatedSpaces.clear();

    if (!generatedSpaces.has(space)) {
        slots[space] = generateSlots(5, 5); 
        generatedSpaces.add(space);
    }

    const now = new Date();
    const selectedDate = now.toISOString().split('T')[0];
    const selectedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    availabilityDiv.classList.add('space-availability');


    const response = await fetch(`/api/reservations?space=${space}`);
    const reservations = await response.json();

    const activeReservations = reservations.filter(reservation => {
        const resDate = new Date(reservation.date).toISOString().split('T')[0];
        return reservation.status === 'overtime' ||
               (reservation.status === 'active' && resDate === selectedDate);
    });
    

    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    slots[space].forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'slot';

        const reservation = activeReservations.find(res => res.slotId === slot.id);

        if (reservation) {
            if (reservation.status === 'overtime') {
                slotDiv.classList.add('space-overtime');
            } else {
                slotDiv.classList.add('space-reserved');
            }


            if (loggedInUser.role === 'technician') {
                const infoDiv = document.createElement('div');
                infoDiv.textContent = reservation.anonymous
                ? `Reserved (Anonymous)  ${reservation.status}`
                : `ID: ${reservation.userId} ${reservation.status}`;

                slotDiv.appendChild(infoDiv);


                slotDiv.addEventListener('click', () => {
                    const confirmRemove = confirm('Complete Reservation. Mark as Completed?');
                    if (confirmRemove) {

                        slotDiv.innerHTML = 'Available';
                        slotDiv.classList.remove('space-reserved');
                        slotDiv.classList.add('space-available');
                        
                        const slotName = document.createElement('div');
                        slotName.textContent = slot.slot;
                        slotDiv.appendChild(slotName);

                        slotDiv.addEventListener('click', () => {
                            handleReservationLink(space, selectedDate, selectedTime, slot.id);
                            highlightSlot(slotDiv);
                        });


                        markReservationCompleted(reservation.userId, reservation.slotId, reservation.date, reservation.time);

                    }
                });

            } else {
                slotDiv.textContent = 'Reserved';
            }

        } else {
            slot.available = true;
            slot.reservationDate = null;

            slotDiv.textContent = 'Available';
            slotDiv.classList.add('space-available');

            if (loggedInUser.role === 'technician') {
                slotDiv.addEventListener('click', () => {
                    handleReservationLink(space, selectedDate, selectedTime, slot.id);
                    highlightSlot(slotDiv);
                });
            } else if (loggedInUser.role === 'student') {
                slotDiv.classList.add('disabled-slot');
                slotDiv.style.cursor = 'not-allowed';
            }
        }

        const slotName = document.createElement('div');
        slotName.textContent = slot.slot;
        slotDiv.appendChild(slotName);

        availabilityDiv.appendChild(slotDiv);
    });
}




function clearSlots() {
    const availabilityDiv = document.getElementById('space-availability');
    while (availabilityDiv.firstChild) {
        availabilityDiv.removeChild(availabilityDiv.firstChild);
    }
}



async function handleReservationLink(space, date, time, slotId) {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (loggedInUser.role === 'technician') {
        const studentName = formatName(document.getElementById('name')?.value || '');
        const userID = document.getElementById('id')?.value || '';

        if (!userID || userID.length !== 8 || isNaN(userID)) {
            alert('Please enter a valid 8-digit ID number.');
            return;
        }

        const isValidUser = await checkUserInDatabase(userID);
        if (!isValidUser) {
            alert('The entered user ID does not exist.');
            return;
        }


        window.selectedReservation = {
            space,
            date,
            time,
            slotId,
            userName: studentName,
            userId: userID
        };


        window.location.href = `/adminReserveDetails?space=${space}&date=${date}&time=${time}&slotId=${slotId}&userId=${userID}`;

    }
}

function formatName(name) {
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

async function checkUserInDatabase(userId) {
    try {
        const response = await fetch(`/api/usersById?userId=${encodeURIComponent(userId)}`);
        const users = await response.json();
        return users.length > 0;
    } catch (err) {
        console.error('Error checking user:', err);
        return false;
    }
}

function highlightSlot(selectedSlotDiv) {
    const allSlots = document.querySelectorAll('.slot');
    allSlots.forEach(slot => slot.classList.remove('selected-slot'));
    selectedSlotDiv.classList.add('selected-slot');
}

function updateDateTimeDisplay() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');

    if (dateInput) dateInput.value = todayStr;
    if (timeInput) timeInput.value = timeStr;
}

async function findAndHighlightReservation(userID) {
    if (!userID || userID.length !== 8 || isNaN(userID)) {
        alert("Please enter a valid 8-digit ID.");
        return;
    }


    const date = new Date().toISOString().split('T')[0];


    try {
        const response = await fetch(`/api/reservationsByUser?userId=${userID}&date=${date}`);
        const reservations = await response.json();


        if (!reservations.length) {
            alert("No reservations found for this ID today.");
            return;
        }


        const reservation = reservations[0];


        const spaceDropdown = document.getElementById('spaces');
        spaceDropdown.value = reservation.space;
        await loadAvailability(reservation.space);


        const allSlots = document.querySelectorAll('.slot');
allSlots.forEach(slotDiv => {
    if (slotDiv.textContent.includes(`ID: ${reservation.userId}`)) {
        highlightSlot(slotDiv);
        slotDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});



    } catch (error) {
        console.error("Error finding reservation:", error);
        alert("Something went wrong while finding the reservation.");
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const spaceDropdown = document.getElementById('spaces');
    updateDateTimeDisplay();


    updateOverdueReservations();

    const defaultSpace = "Third Floor";
    if (!spaceDropdown?.value) {
        loadAvailability(defaultSpace);
    } else {
        loadAvailability();
    }

    spaceDropdown?.addEventListener('change', () => {
        updateDateTimeDisplay();
        loadAvailability();
    });

    setInterval(() => {
        updateDateTimeDisplay();
        loadAvailability();
        updateOverdueReservations();
    }, 60000);

    document.getElementById("cancel").addEventListener("click", function () {
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        window.location.href = (loggedInUser.role === 'student') ? 'mainMenu' : 'adminMenu';
    });

    document.getElementById("search-id-button")?.addEventListener("click", () => {
        const userID = document.getElementById('id')?.value;
        findAndHighlightReservation(userID);
    });
});

