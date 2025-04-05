document.addEventListener('DOMContentLoaded', () => {
    const spaceSelect = document.getElementById('space-select');
    const dateSelect = document.getElementById('date-select');
    const timeSelect = document.getElementById('time-select');
    const slotSelect = document.getElementById('slot-select');
    const studentName = document.getElementById('name'); // FOR ADMIN RESERVE
    const userID = document.getElementById('id');
    const reservationForm = document.getElementById('reservation-form');
    const successMessage = document.getElementById('success-message');
   
    const urlParams = new URLSearchParams(window.location.search);
    const initialSpace = urlParams.get('space');
    const initialDate = urlParams.get('date');
    const initialTime = urlParams.get('time');
    const initialSlotId = urlParams.get('slotId');
    const initialName = urlParams.get('userName'); // FOR ADMIN RESERVE
    const initialUserId = urlParams.get('userId');

    
    spaceSelect.textContent = initialSpace || 'Not selected';
    dateSelect.textContent = initialDate ? new Date(initialDate).toLocaleDateString() : 'Not selected';
    timeSelect.textContent = initialTime || 'Not selected';
    slotSelect.textContent = initialSlotId ? `Slot ${initialSlotId}` : 'Not selected';
    studentName.textContent = initialName || 'Anonymous';
    userID.textContent = initialUserId;

    async function submitReservation(event) {
        event.preventDefault();

        successMessage.style.display = 'none';

        const anonymous = document.getElementById('anonymous').checked;

        const reservationData = {
            space: initialSpace,
            date: initialDate,
            time: initialTime,
            slotId: initialSlotId,
            userName: initialName,
            anonymous,
            userId: initialUserId
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