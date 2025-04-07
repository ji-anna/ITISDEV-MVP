document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const editButton = document.getElementById('editButton');
    const cancelButton = document.getElementById('cancelButton');


    if (loggedInUser) {
        document.getElementById('profileName').textContent = loggedInUser.name;
        document.getElementById('profileEmail').textContent = loggedInUser.email;
        document.getElementById('profileRole').textContent = loggedInUser.role;
        document.getElementById('profileDepartment').textContent = loggedInUser.department;
        document.getElementById('profileDescription').textContent = loggedInUser.profileDesc;

        const firstName = loggedInUser.name.split(' ')[0].toLowerCase();
        const profileImage = document.getElementById('profileImage');
        profileImage.src = `/assets/${firstName}.jpg`;

        profileImage.onerror = function () {
            profileImage.src = '/assets/default.jpg';
        };


        try {
            const response = await fetch('/api/reservations');
            if (!response.ok) {
                throw new Error('Failed to fetch reservations');
            }
            const reservations = await response.json();
            displayReservations(reservations);
        } catch (error) {
            console.error('Error fetching reservations:', error);
        }
    } else {
        window.location.href = '/';
    }
});

    function displayReservations(reservations) {
    const tableBody = document.querySelector('#userReservations tbody');
    tableBody.innerHTML = '';

    reservations.forEach((reservation) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reservation.space}</td>
            <td>${new Date(reservation.date).toLocaleDateString()}</td>
            <td>${reservation.time}</td>
            <td>${reservation.slotId}</td>
            <td>${reservation.anonymous ? 'Yes' : 'No'}</td>
            <td><button class="delete-button" data-reservation-id="${reservation._id}">Delete</button></td>
            <td><button class="editButton" data-reservation-id="${reservation._id}">Edit</button></td>

        `;
        tableBody.appendChild(row);
    });
    const editButtons = document.querySelectorAll('.editButton');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const reservationId = button.dataset.reservationId;
            editReservation(reservationId);
        });
    });

    function editReservation(reservationId) {
        try {

            fetch(`/api/reservation/${reservationId}`)
                .then(response => response.json())
                .then(reservation => {

                    const queryString = new URLSearchParams({
                        reservationId: reservation._id,
                        space: reservation.space,
                        date: reservation.date,
                        time: reservation.time,
                        slotId: reservation.slotId,
                        anonymous: reservation.anonymous
                    }).toString();

                    window.location.href = `/editreservations?${queryString}`;
                })
                .catch(error => {
                    console.error('Error fetching reservation details:', error);
                    alert('Failed to fetch reservation details');
                });
        } catch (error) {
            console.error('Error redirecting to editreservations:', error);
            alert('Failed to redirect to edit reservations');
        }
    }



    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const objectId = button.dataset.reservationId;
            try {
                const response = await fetch('/api/deleteReservation', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ _id: objectId })
                });

                const result = await response.json();

                if (response.ok) {
                    alert(`Reservation deleted successfully!`);
                    displayReservations(reservations.filter((r) => r._id !== objectId));
                } else {
                    alert(result.message || 'Failed to delete reservation!');
                }
            } catch {
                alert('Error deleting reservation!');
            }
        });
    });
}

cancelButton.addEventListener('click', async () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    window.location.href = (loggedInUser.role === 'student') ? 'profilepage' : 'adminProfile';
});
