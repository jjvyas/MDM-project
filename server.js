const express = require("express");
const db = require("./db");
const app = express();

app.use(express.json());

// Test API
app.get("/", (req, res) => {
    res.send("BOOKMYGAME Backend Running");
});

// Get all games
app.get("/games", (req, res) => {
    db.query("SELECT * FROM games", (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});