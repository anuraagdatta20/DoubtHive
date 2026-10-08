const express = require("express");

const {
    getUsers,
    saveUsers,
    getDoubts,
    saveDoubts,
    getMatches,
    saveMatches,
    getNotifications,
    saveNotifications
} = require("./data/data");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Home route
app.get("/", (req, res) => {
    res.send("DoubtHive API is running!");
});

// Test route
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "DoubtHive backend is working!"
    });
});

// Signup
app.post("/api/signup", (req, res) => {
    const { name, email, password, topics } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email and password are required"
        });
    }

    const users = getUsers();

    const existingUser = users.find(
        user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "Email already registered"
        });
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        topics: topics || [],
        expertiseLevel: 1,
        currentLoad: 0,
        points: 0,
        badges: []
    };

    users.push(newUser);
    saveUsers(users);

    res.status(201).json({
        success: true,
        message: "Signup successful",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }
    });
});

// Login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    const users = getUsers();

    const user = users.find(
        user =>
            user.email.toLowerCase() === email.toLowerCase() &&
            user.password === password
    );

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    res.json({
        success: true,
        message: "Login successful",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            topics: user.topics
        }
    });
});

// Topic keywords
const topicKeywords = {
    javascript: ["javascript", "js", "dom", "promise", "async", "node"],
    python: ["python", "pandas", "numpy", "django"],
    java: ["java", "jvm", "inheritance", "class"],
    dbms: ["dbms", "database", "sql", "query", "normalization"],
    dsa: ["dsa", "algorithm", "array", "stack", "queue", "linked list", "tree"],
    ai: ["ai", "artificial intelligence", "machine learning", "ml", "model"],
    web: ["html", "css", "frontend", "backend", "website", "express"]
};

function autoTagTopic(title, description) {
    const text = `${title} ${description}`.toLowerCase();

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return topic;
        }
    }

    return "general";
}

// Create notification
function createNotification(userId, message, doubtId) {
    const notifications = getNotifications();

    const notification = {
        id: Date.now().toString(),
        userId,
        message,
        doubtId,
        read: false,
        createdAt: new Date().toISOString()
    };

    notifications.push(notification);
    saveNotifications(notifications);

    return notification;
}

// Post a doubt
app.post("/api/doubts", (req, res) => {
    const { userId, title, description } = req.body;

    if (!userId || !title || !description) {
        return res.status(400).json({
            success: false,
            message: "userId, title and description are required"
        });
    }

    const doubts = getDoubts();

    const newDoubt = {
        id: Date.now().toString(),
        userId,
        title,
        description,
        topic: autoTagTopic(title, description),
        status: "open",
        replies: [],
        createdAt: new Date().toISOString()
    };

    doubts.push(newDoubt);
    saveDoubts(doubts);

    res.status(201).json({
        success: true,
        message: "Doubt posted successfully",
        doubt: newDoubt
    });
});

// Match helpers to a doubt
function findMatches(doubt) {
    const users = getUsers();

    return users
        .filter(user => user.id !== doubt.userId)
        .map(user => {
            let score = 0;

            if (
                user.topics
                    .map(t => t.toLowerCase())
                    .includes(doubt.topic)
            ) {
                score += 50;
            }

            score += user.expertiseLevel * 10;
            score += Math.max(0, 20 - user.currentLoad * 5);

            return {
                userId: user.id,
                name: user.name,
                topic: doubt.topic,
                expertiseLevel: user.expertiseLevel,
                currentLoad: user.currentLoad,
                score
            };
        })
        .sort((a, b) => b.score - a.score);
}

// Get matches for a doubt
app.get("/api/doubts/:doubtId/matches", (req, res) => {
    const doubts = getDoubts();
    const doubt = doubts.find(d => d.id === req.params.doubtId);

    if (!doubt) {
        return res.status(404).json({
            success: false,
            message: "Doubt not found"
        });
    }

    const matches = findMatches(doubt);

    res.json({
        success: true,
        matches
    });
});

// Get a doubt thread
app.get("/api/doubts/:doubtId", (req, res) => {
    const doubts = getDoubts();

    const doubt = doubts.find(d => d.id === req.params.doubtId);

    if (!doubt) {
        return res.status(404).json({
            success: false,
            message: "Doubt not found"
        });
    }

    res.json({
        success: true,
        doubt
    });
});

// Add a reply
app.post("/api/doubts/:doubtId/replies", (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({
            success: false,
            message: "userId and message are required"
        });
    }

    const doubts = getDoubts();
    const doubt = doubts.find(d => d.id === req.params.doubtId);

    if (!doubt) {
        return res.status(404).json({
            success: false,
            message: "Doubt not found"
        });
    }

    const reply = {
        id: Date.now().toString(),
        userId,
        message,
        createdAt: new Date().toISOString()
    };

    doubt.replies.push(reply);

    saveDoubts(doubts);

    // Award 10 points for helping another student
    updateUserRewards(userId, 10);

    // Notify the student who posted the doubt
    if (doubt.userId !== userId) {
        createNotification(
            doubt.userId,
            "Your doubt got a new reply!",
            doubt.id
        );
    }

    res.status(201).json({
        success: true,
        message: "Reply added",
        reply
    });
});

// Mark doubt as resolved
app.patch("/api/doubts/:doubtId/resolve", (req, res) => {
    const { userId } = req.body;

    const doubts = getDoubts();
    const doubt = doubts.find(d => d.id === req.params.doubtId);

    if (!doubt) {
        return res.status(404).json({
            success: false,
            message: "Doubt not found"
        });
    }

    doubt.status = "resolved";

    // Award 20 points for resolving a doubt
    if (userId) {
        updateUserRewards(userId, 20);
    }

    saveDoubts(doubts);

    res.json({
        success: true,
        message: "Doubt marked as resolved",
        doubt
    });
});

// Award points and badges
function updateUserRewards(userId, pointsToAdd) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) return null;

    user.points += pointsToAdd;

    if (user.points >= 100 && !user.badges.includes("Helper")) {
        user.badges.push("Helper");
    }

    if (user.points >= 250 && !user.badges.includes("Expert")) {
        user.badges.push("Expert");
    }

    if (user.points >= 500 && !user.badges.includes("DoubtHive Star")) {
        user.badges.push("DoubtHive Star");
    }

    saveUsers(users);

    return user;
}

// Leaderboard
app.get("/api/leaderboard", (req, res) => {
    const users = getUsers();

    const leaderboard = users
        .map(user => ({
            id: user.id,
            name: user.name,
            points: user.points,
            badges: user.badges
        }))
        .sort((a, b) => b.points - a.points);

    res.json({
        success: true,
        leaderboard
    });
});

// User profile
app.get("/api/users/:userId", (req, res) => {
    const users = getUsers();
    const user = users.find(u => u.id === req.params.userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            topics: user.topics,
            expertiseLevel: user.expertiseLevel,
            points: user.points,
            badges: user.badges
        }
    });
});

// Get doubts for dashboard
app.get("/api/doubts", (req, res) => {
    const { userId } = req.query;

    const doubts = getDoubts();

    // If no userId is provided, return all doubts
    if (!userId) {
        return res.json({
            success: true,
            doubts
        });
    }

    const users = getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    const selectedTopics = (user.topics || []).map(topic =>
        topic.toLowerCase()
    );

    // Show:
    // 1. The user's own doubts
    // 2. Other students' doubts from the user's expert topics
    const filteredDoubts = doubts.filter(doubt =>
        doubt.userId === userId ||
        selectedTopics.includes(doubt.topic.toLowerCase())
    );

    res.json({
        success: true,
        doubts: filteredDoubts
    });
});

// Get notifications for a user
app.get("/api/notifications/:userId", (req, res) => {
    const notifications = getNotifications();

    const userNotifications = notifications
        .filter(notification => notification.userId === req.params.userId)
        .sort(
            (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
        );

    res.json({
        success: true,
        notifications: userNotifications
    });
});

app.listen(PORT, () => {
    console.log(`DoubtHive server running at http://localhost:${PORT}`);
});