async function searchUsers(searchTerm) {
    const response = await fetch(`/api/usersAdmin?name=${encodeURIComponent(searchTerm)}`);
    const users = await response.json();
    const tableBody = document.getElementById('user-table-body');
    tableBody.innerHTML = '';

    users.forEach((user) => {
        const rowHTML = `
            <tr>
                <td>${user._id}</td>
                <td><a href="/adminViewUser/${user._id}">${user.name}</a></td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.department}</td>
            </tr>
        `;
        tableBody.innerHTML += rowHTML;
    });
}

const searchInput = document.getElementById('search');
searchInput.addEventListener('input', (e) => searchUsers(e.target.value));

document.getElementById("cancel").addEventListener("click", function () {
    window.location.href = "adminMenu";
});
