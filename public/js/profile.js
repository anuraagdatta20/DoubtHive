const user = JSON.parse(localStorage.getItem("doubtHiveUser"));

if (!user) {
    window.location.href = "login.html";
}

async function loadProfile() {
    const response = await fetch(`/api/users/${user.id}`);
    const data = await response.json();

    if (!data.success) return;

    const profile = data.user;

    document.getElementById("profile").innerHTML = `
        <div class="card">
            <h1>👤 ${profile.name}</h1>
            <p>Email: ${profile.email}</p>
            <p>Expertise Level: ${profile.expertiseLevel}</p>
            <p>Points: ${profile.points}</p>

            <h3>Strong Topics</h3>
            <p>${profile.topics.join(", ") || "No topics added"}</p>

            <h3>Badges</h3>
            <div>
                ${
                    profile.badges.length
                    ? profile.badges.map(badge =>
                        `<span class="badge">${badge}</span>`
                    ).join("")
                    : "No badges yet"
                }
            </div>
        </div>
    `;
}

loadProfile();