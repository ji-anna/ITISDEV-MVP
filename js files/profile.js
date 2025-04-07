document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
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

        `;
        tableBody.appendChild(row);
    });

}

cancelButton.addEventListener('click', async () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    window.location.href = (loggedInUser.role === 'student') ? 'profilepage' : 'adminProfile';
});
