document.addEventListener('DOMContentLoaded', () => {
    const deleteButtons = document.querySelectorAll('.delete-button');
    const editButtons = document.querySelectorAll('.edit-button');

    deleteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const reservationId = event.target.getAttribute('data-reservation-id');
            if (confirm('Are you sure you want to delete this reservation?')) {
                try {
                    const response = await fetch('/api/deleteSearchReservation', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ _id: reservationId }),
                    });

                    const result = await response.json();
                    alert(result.message);

                    if (response.ok) {
                        location.reload();
                    }
                } catch (error) {
                    console.error('Error deleting reservation:', error);
                    alert('Failed to delete reservation');
                }
            }
        });
    });

    editButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const reservationId = event.target.getAttribute('data-reservation-id');
            window.location.href = `/adminEditReserve?reservationId=${reservationId}`;
        });
    });
});

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
            document.getElementById('slotId').value = reservation.seatId;
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
            window.location.href = '/adminSearchUser';
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
    window.location.href = 'adminSearchUser';
});

document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);
});

