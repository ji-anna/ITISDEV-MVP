document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const studentID = document.getElementById('id');
    const submitButton = document.getElementById('submit');
    const reservationForm = document.getElementById('reservation-form'); // Optional: if you wrap form around submit
    const successMessage = document.getElementById('success-message');

    // Ensure current time is always shown (this matches the current UI behavior)
    function updateCurrentDateTime() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        if (dateInput) dateInput.value = todayStr;
        if (timeInput) timeInput.value = timeStr;
    }

    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 60000); // update every minute

    // Submit logic
    submitButton = 'some value';  // This would trigger the error

    submitButton?.addEventListener('click', async () => {
        successMessage?.style?.display = 'none';
    
        const userId = studentID.value;
        const anonymous = document.getElementById('anonymous')?.checked || false;
    
        if (!window.selectedReservation) {
            alert("Please select a parking slot first.");
            return;
        }
    
        if (!userId) {
            alert("Please enter a valid ID number.");
            return;
        }
    
        const reservationData = {
            ...window.selectedReservation,
            userId,
            date: dateInput.value,
            time: timeInput.value,
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
                successMessage?.style?.display = 'block';
                studentID.value = '';
                submitButton.style.display = 'none';
            } else {
                const errorData = await response.json();
                alert("Error: " + errorData.message);
            }
        } catch (error) {
            console.error('Error submitting reservation:', error);
            alert("Something went wrong.");
        }
    });
    
    document.getElementById('backButton').addEventListener('click', goBack);
    // Cancel button
    document.getElementById('cancel')?.addEventListener('click', () => {
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        window.location.href = (loggedInUser?.role === 'student') ? 'mainMenu' : 'adminMenu';
    });
});
