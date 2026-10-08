const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const topics = document
            .getElementById("topics")
            .value
            .split(",")
            .map(topic => topic.trim().toLowerCase())
            .filter(Boolean);

        const response = await fetch("/api/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: document.getElementById("name").value,
                email: document.getElementById("email").value,
                password: document.getElementById("password").value,
                topics
            })
        });

        const data = await response.json();

        message.textContent = data.message;

        if (data.success) {
            window.location.href = "login.html";
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: document.getElementById("email").value,
                password: document.getElementById("password").value
            })
        });

        const data = await response.json();

        message.textContent = data.message;

        if (data.success) {
            localStorage.setItem("doubtHiveUser", JSON.stringify(data.user));
            window.location.href = "dashboard.html";
        }
    });
}