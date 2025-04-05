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

                    if(user.role === role){
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
