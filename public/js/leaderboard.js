async function loadLeaderboard() {
    const response = await fetch("/api/leaderboard");
    const data = await response.json();

    if (!data.success) return;

    document.getElementById("leaderboard").innerHTML =
        data.leaderboard.map((user, index) => `
            <div class="user-row">
                <div>
                    <strong>#${index + 1} ${user.name}</strong>
                    <p>${user.badges.join(", ") || "No badges"}</p>
                </div>
                <strong>${user.points} pts</strong>
            </div>
        `).join("");
}

loadLeaderboard();