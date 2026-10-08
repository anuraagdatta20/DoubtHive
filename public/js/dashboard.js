const user = JSON.parse(localStorage.getItem("doubtHiveUser"));

if (!user) {
    window.location.href = "login.html";
}

document.getElementById("welcomeText").textContent =
    `Welcome, ${user.name}!`;

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("doubtHiveUser");
    window.location.href = "login.html";
});

// Post doubt
document.getElementById("doubtForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const response = await fetch("/api/doubts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userId: user.id,
            title: document.getElementById("title").value,
            description: document.getElementById("description").value
        })
    });

    const data = await response.json();

    document.getElementById("message").textContent = data.message;

    if (data.success) {
        document.getElementById("doubtForm").reset();
        loadDoubts();
    }
});

// Load doubts
async function loadDoubts() {
    const response = await fetch(`/api/doubts?userId=${user.id}`);
    const data = await response.json();

    if (!data.success) {
        document.getElementById("doubtsList").innerHTML =
            "<p>Unable to load doubts.</p>";
        return;
    }

    if (data.doubts.length === 0) {
        document.getElementById("doubtsList").innerHTML =
            "<p>No doubts posted yet.</p>";
        return;
    }

    document.getElementById("doubtsList").innerHTML =
        data.doubts.slice().reverse().map(doubt => `
            <div class="doubt-card">
                <h3>${doubt.title}</h3>
                <p>${doubt.description}</p>

                <span class="topic">${doubt.topic}</span>

                <p>Status: ${doubt.status}</p>

                <a
                    class="view-btn"
                    href="doubt.html?id=${doubt.id}"
                >
                    View Doubt →
                </a>
            </div>
        `).join("");
}

// Load notifications
async function loadNotifications() {
    const response = await fetch(`/api/notifications/${user.id}`);
    const data = await response.json();

    const notificationsList =
        document.getElementById("notificationsList");

    if (!data.success || data.notifications.length === 0) {
        notificationsList.innerHTML =
            "<p>No notifications yet.</p>";
        return;
    }

    notificationsList.innerHTML =
        data.notifications.map(notification => `
            <div class="notification">
                🔔 ${notification.message}
            </div>
        `).join("");
}

loadDoubts();
loadNotifications();