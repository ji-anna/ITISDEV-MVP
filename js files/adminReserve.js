document.addEventListener('DOMContentLoaded', () => {
    const labSelect = document.getElementById('lab-select');
    const dateSelect = document.getElementById('date-select');
    const timeSelect = document.getElementById('time-select');
    const seatSelect = document.getElementById('seat-select');
    const studentId = document.getElementById('id'); 
    const reservationForm = document.getElementById('reservation-form');
    const successMessage = document.getElementById('success-message');
   
    const urlParams = new URLSearchParams(window.location.search);
    const initialLab = urlParams.get('lab');
    const initialDate = urlParams.get('date');
    const initialTime = urlParams.get('time');
    const initialSeatId = urlParams.get('seatId');
    const initialUserId = urlParams.get('userId'); // 👈 get userId from URL

    // Update the UI
    labSelect.textContent = initialLab || 'Not selected';
    dateSelect.textContent = initialDate ? new Date(initialDate).toLocaleDateString() : 'Not selected';
    timeSelect.textContent = initialTime || 'Not selected';
    seatSelect.textContent = initialSeatId ? `Seat ${initialSeatId}` : 'Not selected';
    studentId.textContent = initialUserId || 'Not provided'; // 👈 Display userId

    async function submitReservation(event) {
        event.preventDefault();

        successMessage.style.display = 'none';

        const anonymous = document.getElementById('anonymous').checked;

        const reservationData = {
            lab: initialLab,
            date: initialDate,
            time: initialTime,
            seatId: initialSeatId,
            userId: initialUserId, // 👈 Send userId instead of userName
            anonymous
        };

        try {
            const response = await fetch('/submit-admin-reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservationData),
            });

            if (response.ok) {
                successMessage.style.display = 'block';
                reservationForm.reset();
            } else {
                const errorData = await response.json();
                console.error('Error:', errorData.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function goBack() {
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        window.location.href = 'adminMenu';
    }

    reservationForm.addEventListener('submit', submitReservation);
    document.getElementById('backButton').addEventListener('click', goBack);
});
