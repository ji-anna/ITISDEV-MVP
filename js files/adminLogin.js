async function updateOverdueReservations(userId, role) {
    const today = new Date().toISOString().split('T')[0];

    try {
        const response = await fetch(`/api/reservations/all`);
        const reservations = await response.json();

        const overdue = reservations.filter(res => {
            const isOverdue = res.status === 'active' && res.date < today;
            const isTechnician = role === 'technician';
            const isCurrentUser = res.userId === userId;

            // Update all overdue reservations if the user is a technician, or only the current user's overdue reservations
            return isOverdue && (isTechnician || isCurrentUser);
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


document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const logoutButton = document.getElementById('logoutButton');

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            const role = 'technician';  
            try {
                const response = await fetch('/api/adminLogin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role })
                });
                const user = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('loggedInUser', JSON.stringify(user));

                    if (rememberMe) {
                        const rememberMeData = {
                            user,
                            expiry: new Date().getTime() + 3 * 7 * 24 * 60 * 60 * 1000
                        };
                        localStorage.setItem('rememberMe', JSON.stringify(rememberMeData));
                    }

                    if (user.role === role) {
                        // Technician has logged in, so update all overdue reservations
                        await updateOverdueReservations(user._id, user.role);  // Update all overdue reservations
                        alert(`Welcome, ${user.name}`);
                        window.location.href = 'adminMenu';
                    } else {
                        alert('Unauthorized access!');
                        window.location.href = '/';
                    }
                } else {
                    alert(user.message || 'Login failed!');
                }
            } catch {
                alert('Error logging in!');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            sessionStorage.removeItem('loggedInUser');
            localStorage.removeItem('rememberMe');
            await fetch('/api/logout', {
                method: 'POST'
            });
            window.location.href = '/';
        });
    }
});
