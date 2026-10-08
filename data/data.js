const fs = require("fs");
const path = require("path");

const dataDir = __dirname;

function readData(fileName) {
    const filePath = path.join(dataDir, fileName);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeData(fileName, data) {
    const filePath = path.join(dataDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Users
function getUsers() {
    return readData("users.json");
}

function saveUsers(users) {
    writeData("users.json", users);
}

// Doubts
function getDoubts() {
    return readData("doubts.json");
}

function saveDoubts(doubts) {
    writeData("doubts.json", doubts);
}

// Matches
function getMatches() {
    return readData("matches.json");
}

function saveMatches(matches) {
    writeData("matches.json", matches);
}
// Notifications
function getNotifications() {
    return readData("notifications.json");
}

function saveNotifications(notifications) {
    writeData("notifications.json", notifications);
}
module.exports = {
    getUsers,
    saveUsers,
    getDoubts,
    saveDoubts,
    getMatches,
    saveMatches,
    getNotifications,
    saveNotifications
};