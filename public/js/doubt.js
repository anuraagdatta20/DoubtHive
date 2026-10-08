const user = JSON.parse(localStorage.getItem("doubtHiveUser"));

if (!user) {
    window.location.href = "login.html";
}

const params = new URLSearchParams(window.location.search);
const doubtId = params.get("id");

async function loadDoubt() {
    const response = await fetch(`/api/doubts/${doubtId}`);
    const data = await response.json();

    if (!data.success) {
        document.getElementById("message").textContent = data.message;
        return;
    }

    const doubt = data.doubt;

    document.getElementById("doubtBox").innerHTML = `
        <h1>${doubt.title}</h1>
        <p>${doubt.description}</p>
        <span class="topic">${doubt.topic}</span>
        <p>Status: ${doubt.status}</p>
    `;

    const replyList = document.getElementById("replyList");

    if (doubt.replies.length === 0) {
        replyList.innerHTML = "<p>No replies yet.</p>";
    } else {
        replyList.innerHTML = doubt.replies.map(reply => `
            <div class="reply">
                <strong>Student</strong>
                <p>${reply.message}</p>
            </div>
        `).join("");
    }
}

// Reply
document.getElementById("replyForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("replyMessage").value;

    try {
        const response = await fetch(`/api/doubts/${doubtId}/replies`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: user.id,
                message: message
            })
        });

        const data = await response.json();

        document.getElementById("message").textContent = data.message;

        if (data.success) {
            document.getElementById("replyForm").reset();
            loadDoubt();
        }
    } catch (error) {
        document.getElementById("message").textContent =
            "Unable to add reply.";
    }
});

// Resolve
document.getElementById("resolveBtn").addEventListener("click", async () => {

    try {
        const response = await fetch(`/api/doubts/${doubtId}/resolve`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: user.id
            })
        });

        const data = await response.json();

        document.getElementById("message").textContent = data.message;

        if (data.success) {
            loadDoubt();
        }

    } catch (error) {
        document.getElementById("message").textContent =
            "Unable to resolve doubt.";
    }
});

loadDoubt();