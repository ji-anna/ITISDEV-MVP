document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logoutButton');
    const registerForm = document.getElementById('registerForm');

    // LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
    
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, password })
                });
    
                const user = await response.json();
    
                if (response.ok) {
                    alert(`Welcome, ${user.name}`);
                    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
    
                    if (rememberMe) {
                        const rememberMeData = {
                            user,
                            expiry: new Date().getTime() + 3 * 7 * 24 * 60 * 60 * 1000
                        };
                        localStorage.setItem('rememberMe', JSON.stringify(rememberMeData));
                    }
    
                    window.location.href = (user.role === 'technician') ? 'adminMenu' : 'mainMenu';
                } else {
                    alert(user.message || 'Login failed!');
                }
            } catch {
                alert('Error logging in!');
            }
        });
    }
    

    //REGISTER
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
    
            try {
                const response = await fetch('/submit-registration', {
                    method: 'POST',
                    body: formData
                });
    
                if (response.redirected) {
                    alert('Registration successful!');
                    window.location.href = response.url;
                } else {
                    const result = await response.json();
                    alert(result.message || 'Registration failed!');
                }
            } catch (err) {
                console.error('Registration error:', err);
                alert('Error during registration!');
            }
        });
    }
    

    // REMEMBER ME
    const currentPage = window.location.pathname === '/' ? 'landingpage' : '';
    if (currentPage === 'landingpage') {
        const rememberMeData = JSON.parse(localStorage.getItem('rememberMe'));
        if (rememberMeData) {
            const currentTime = new Date().getTime();
            if (currentTime < rememberMeData.expiry) {
                sessionStorage.setItem('loggedInUser', JSON.stringify(rememberMeData.user));
                const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

                window.location.href = (loggedInUser.role === 'student') ? 'mainMenu' : 'adminMenu';
            } else {
                localStorage.removeItem('rememberMe');
            }
        }
    }

    //LOGOUT
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('loggedInUser');
            localStorage.removeItem('rememberMe');
            window.location.href = '/';
        });

    }

});

// FOR VIEW SPACE AVAIL PROFILE
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