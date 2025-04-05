document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const deleteUserButton = document.getElementById('deleteUserButton');
    const editButton = document.getElementById('editButton');
    const cancelButton = document.getElementById('cancelButton');


    // DELETE USER
    async function deleteUserAccount() {
        const confirmDelete = confirm("Are you sure you want to delete your account?");
        if (confirmDelete) {
            try {
                const response = await fetch('/api/deleteUser', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok) {
                    sessionStorage.removeItem('loggedInUser');
                    localStorage.removeItem('rememberMe');
                    alert(result.message);
                    window.location.href = '/';
                } else {
                    alert(result.message || 'Failed to delete account!');
                }
            } catch {
                alert('Error deleting account!');
            }
        }
    }

    if (deleteUserButton) {
        deleteUserButton.addEventListener('click', deleteUserAccount);
    }

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


//EDIT PROFILE
window.editField = function (fieldId) {
    const span = document.getElementById(fieldId);
    const text = span.textContent;
    span.innerHTML = `<input type="text" id="${fieldId}Input" value="${text}">`;
    document.querySelector(`button[onclick="editField('${fieldId}')"]`).style.display = 'none';
    document.querySelector(`button[onclick="saveChanges('${fieldId}')"]`).style.display = 'inline';
}


window.saveChanges = async function (fieldId) {
    if (!fieldId) return;

    const input = document.getElementById(`${fieldId}Input`);
    const newValue = input.value;
    const span = document.getElementById(fieldId);
    span.textContent = newValue;


    document.querySelector(`button[onclick="editField('${fieldId}')"]`).style.display = 'inline';
    document.querySelector(`button[onclick="saveChanges('${fieldId}')"]`).style.display = 'none';
}

if (editButton) {
    editButton.addEventListener('click', async () => {
        const unsavedFields = [];
        const fields = ['profileName', 'profileEmail', 'profileRole', 'profileDepartment', 'profileDescription'];

        fields.forEach((field) => {
            const input = document.getElementById(`${field}Input`);
            if (input && input.value !== document.getElementById(field).textContent) {
                unsavedFields.push(field);
            }
        });

        if (unsavedFields.length > 0) {
            alert(`Please save changes to the following fields: ${unsavedFields.join(', ')}`);
            return;
        }

        const name = document.getElementById('profileName').textContent;
        const email = document.getElementById('profileEmail').textContent;
        const role = document.getElementById('profileRole').textContent;
        const department = document.getElementById('profileDepartment').textContent;
        const description = document.getElementById('profileDescription').textContent;

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('role', role);
        formData.append('department', department);
        formData.append('profileDesc', description);

        const imageInput = document.getElementById('image');
        if (imageInput.files.length > 0) {
            formData.append('image', imageInput.files[0]);
        }

        try {
            const response = await fetch('/api/updateProfile', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.message === 'Profile updated successfully!') {
                alert('Profile updated successfully!');

                const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
                loggedInUser.name = name;
                loggedInUser.email = email;
                loggedInUser.role = role;
                loggedInUser.department = department;
                loggedInUser.profileDesc = description;
                loggedInUser.profileImg = result.profileImg;

                sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));

                window.location.href = (loggedInUser.role === 'student') ? 'profilepage' : 'adminProfile';
            } else {
                alert(result.message || 'Failed to update profile!');
            }
        } catch {
            alert('Error updating profile!');
        }
    });
}

cancelButton.addEventListener('click', async () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    window.location.href = (loggedInUser.role === 'student') ? 'profilepage' : 'adminProfile';
});
