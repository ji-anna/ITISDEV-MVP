document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const cancelButton = document.getElementById('cancelButton');

    if (loggedInUser) {
        document.getElementById('profileName').textContent = loggedInUser.name;
        document.getElementById('userId').textContent = loggedInUser.userId;
        document.getElementById('profileEmail').textContent = loggedInUser.email;
        document.getElementById('profileRole').textContent = loggedInUser.role;
        document.getElementById('profileDepartment').textContent = loggedInUser.department;
        document.getElementById('profileDescription').textContent = loggedInUser.profileDesc;
        document.getElementById('plateNumber').textContent = loggedInUser.carPlate;

        const firstName = loggedInUser.name.split(' ')[0].toLowerCase();
        const profileImage = document.getElementById('profileImage');
        profileImage.src = `/assets/${firstName}.jpg`;

        profileImage.onerror = function () {
            profileImage.src = '/assets/default.jpg';
        };

        // Fetch reservations
        try {
            const response = await fetch('/api/reservations');
            if (!response.ok) {
                throw new Error('Failed to fetch reservations');
            }
            const reservations = await response.json();
            displayReservations(reservations);

            // Check for unpaid overtime
            const hasUnpaidOvertime = reservations.some(res => res.status === 'overtime');
            if (hasUnpaidOvertime) {
                alert('You have unpaid overtime charges. Please settle them before making a new reservation.');
                sessionStorage.setItem('accountDisabled', 'true');
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
        }
    } else {
        window.location.href = '/';
    }
});

function displayReservations(reservations) {
    const activeTableBody = document.querySelector('#userReservations tbody');
    const overtimeTableBody = document.querySelector('#overtimeReservations tbody');
    activeTableBody.innerHTML = '';
    overtimeTableBody.innerHTML = '';

    reservations.forEach((reservation) => {
        const row = document.createElement('tr');

        if (reservation.status === 'overtime') {
            row.innerHTML = `
                <td>${reservation.space}</td>
                <td>${new Date(reservation.date).toLocaleDateString()}</td>
                <td>${reservation.time}</td>
                <td>${reservation.slotId}</td>
                <td>${reservation.anonymous ? 'Yes' : 'No'}</td>
                <td>₱1,200</td>
            `;
            overtimeTableBody.appendChild(row);
        } else {
            row.innerHTML = `
                <td>${reservation.space}</td>
                <td>${new Date(reservation.date).toLocaleDateString()}</td>
                <td>${reservation.time}</td>
                <td>${reservation.slotId}</td>
                <td>${reservation.anonymous ? 'Yes' : 'No'}</td>
            `;
            activeTableBody.appendChild(row);
        }
    });
}


function showAddCarForm() {
  document.getElementById('addCarForm').style.display = 'block';
}

async function confirmAddCar() {
  const newPlateNumber = document.getElementById('newPlateNumber').value.trim();
  if (!newPlateNumber) {
    alert('Please enter a valid plate number.');
    return;
  }

  const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
  if (!loggedInUser) {
    alert('No logged-in user found.');
    return;
  }

  try {
    const response = await fetch('/api/addCar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: loggedInUser.userId, 
        plateNumber: newPlateNumber
      })
    });

    if (!response.ok) {
      throw new Error('Failed to add new car plate. Server responded with an error.');
    }

    const data = await response.json();
    alert(data.message);  

    document.getElementById('plateNumber').textContent = newPlateNumber;
    loggedInUser.carPlate = newPlateNumber;
    sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));

    document.getElementById('newPlateNumber').value = '';
    document.getElementById('addCarForm').style.display = 'none';
  } catch (error) {
    console.error(error);
    alert('Failed to save the plate number. Please try again.');
  }
}

cancelButton.addEventListener('click', async () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    window.location.href = (loggedInUser.role === 'student') ? 'profilepage' : 'adminProfile';
});
