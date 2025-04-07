//baka di na need eto kase for student self-res

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reservationId = urlParams.get('reservationId');

    if (reservationId) {
        try {
            const response = await fetch(`/api/reservation/${reservationId}`);
            const reservation = await response.json();

            document.getElementById('space').value = reservation.space;
            document.getElementById('date').value = new Date(reservation.date).toISOString().split('T')[0];
            document.getElementById('time').value = reservation.time;
            document.getElementById('slotId').value = reservation.slotId;
            document.getElementById('anonymous').checked = reservation.anonymous;
        } catch (error) {
            console.error('Error fetching reservation details:', error);
        }
    }
});

document.getElementById('editReservationForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const reservationId = new URLSearchParams(window.location.search).get('reservationId');
    const formData = new FormData(event.target);

    try {
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        const response = await fetch('/api/updateReservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reservationId,
                space: formData.get('space'),
                date: formData.get('date'),
                time: formData.get('time'),
                slotId: formData.get('slotId'),
                anonymous: formData.get('anonymous') === 'on'
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Reservation updated successfully!');
            window.location.href = (loggedInUser.role === 'student') ? 'profilepage' : 'adminProfile';
        } else {
            alert(result.message || 'Failed to update reservation');
        }
    } catch (error) {
        console.error('Error updating reservation:', error);
        alert('Failed to update reservation');
    }
});

 document.getElementById('cancelButton').addEventListener('click', () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    window.location.href = (loggedInUser.role === 'student') ? 'profilepage' : 'adminProfile';
});

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);
});
