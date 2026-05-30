const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

// Enable CORS for frontend cross-origin requests
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
    res.send("BOOKMYGAME Backend Running");
});

// Authentication: Register
app.post("/api/register", (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if email already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
            console.error("Register Error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length > 0) {
            return res.status(400).json({ success: false, message: "Email is already registered" });
        }

        // Insert new user
        db.query(
            "INSERT INTO users (name, email, PHONE_NO, password) VALUES (?, ?, ?, ?)",
            [name, email, phone, password],
            (insertErr, result) => {
                if (insertErr) {
                    console.error("Insert Error:", insertErr);
                    return res.status(500).json({ success: false, message: "Failed to register user" });
                }

                res.status(201).json({
                    success: true,
                    message: "User registered successfully",
                    user: {
                        userId: result.insertId,
                        name: name,
                        email: email,
                        phone: phone
                    }
                });
            }
        );
    });
});

// Authentication: Sign In
app.post("/api/signin", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    db.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, results) => {
        if (err) {
            console.error("Sign-in Error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const user = results[0];
        res.json({
            success: true,
            message: "Signed in successfully",
            user: {
                userId: user.user_id,
                name: user.name,
                email: user.email,
                phone: user.PHONE_NO
            }
        });
    });
});

// Get all games
app.get("/api/games", (req, res) => {
    db.query("SELECT * FROM games", (err, result) => {
        if (err) {
            console.error("Get Games Error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json(result);
    });
});

// Purchase Game
app.post("/api/purchase", (req, res) => {
    const { userId, gameId, price } = req.body;

    if (!userId || !gameId || !price) {
        return res.status(400).json({ success: false, message: "Missing purchase details" });
    }

    db.query(
        "INSERT INTO orders (user_id, game_id, total_amount) VALUES (?, ?, ?)",
        [userId, gameId, price],
        (err, result) => {
            if (err) {
                console.error("Purchase Error:", err);
                return res.status(500).json({ success: false, message: "Failed to record purchase" });
            }

            // Decrement stock by 1
            db.query("UPDATE games SET stock = GREATEST(stock - 1, 0) WHERE game_id = ?", [gameId]);

            res.json({
                success: true,
                message: "Purchase recorded successfully",
                orderId: result.insertId
            });
        }
    );
});

// Purchase Cart Items (Batch Checkout)
app.post("/api/purchase-cart", (req, res) => {
    const { userId, cart } = req.body;

    if (!userId || !cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ success: false, message: "Missing purchase details" });
    }

    const queries = cart.map(item => {
        return new Promise((resolve, reject) => {
            db.query(
                "INSERT INTO orders (user_id, game_id, total_amount) VALUES (?, ?, ?)",
                [userId, item.gameId, item.price],
                (err, result) => {
                    if (err) return reject(err);
                    // Decrement stock
                    db.query("UPDATE games SET stock = GREATEST(stock - 1, 0) WHERE game_id = ?", [item.gameId]);
                    resolve(result.insertId);
                }
            );
        });
    });

    Promise.all(queries)
        .then(results => {
            res.json({
                success: true,
                message: "Cart items checked out successfully!",
                orderIds: results
            });
        })
        .catch(err => {
            console.error("Cart Checkout Error:", err);
            res.status(500).json({ success: false, message: "Failed to checkout cart items" });
        });
});


// Rent Game
app.post("/api/rent", (req, res) => {
    const { userId, gameId, rentDays } = req.body;

    if (!userId || !gameId || !rentDays) {
        return res.status(400).json({ success: false, message: "Missing rental details" });
    }

    const rentDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(rentDate.getDate() + parseInt(rentDays));

    db.query(
        "INSERT INTO rentals (user_id, game_id, rent_date, return_date) VALUES (?, ?, ?, ?)",
        [userId, gameId, rentDate, returnDate],
        (err, result) => {
            if (err) {
                console.error("Rental Error:", err);
                return res.status(500).json({ success: false, message: "Failed to record rental" });
            }

            res.json({
                success: true,
                message: "Game rented successfully",
                rentalId: result.insertId,
                returnDate: returnDate.toISOString().split("T")[0]
            });
        }
    );
});

// Book Cafe Seat
app.post("/api/booking", (req, res) => {
    const { userId, cafeId, bookingDate, hours, seatNumber } = req.body;

    if (!userId || !cafeId || !bookingDate || !hours || !seatNumber) {
        return res.status(400).json({ success: false, message: "Missing booking details" });
    }

    db.query(
        "INSERT INTO bookings (user_id, cafe_id, booking_date, hours, seat_number) VALUES (?, ?, ?, ?, ?)",
        [userId, cafeId, bookingDate, hours, seatNumber],
        (err, result) => {
            if (err) {
                console.error("Booking Error:", err);
                return res.status(500).json({ success: false, message: "Failed to record seat booking" });
            }

            res.json({
                success: true,
                message: "Seat booked successfully",
                bookingId: result.insertId
            });
        }
    );
});

// Get active seat bookings (where booking date >= current date)
app.get("/api/bookings/active", (req, res) => {
    db.query(
        "SELECT cafe_id, seat_number, booking_date FROM bookings WHERE booking_date >= CURDATE()",
        (err, results) => {
            if (err) {
                console.error("Fetch Active Bookings Error:", err);
                return res.status(500).json({ success: false, message: "Database error" });
            }
            res.json({ success: true, bookings: results });
        }
    );
});

// Get User Profile & History
app.get("/api/profile/:userId", (req, res) => {
    const userId = req.params.userId;

    // Fetch user details
    db.query("SELECT name, email, PHONE_NO as phone, created_at FROM users WHERE user_id = ?", [userId], (userErr, userResults) => {
        if (userErr || userResults.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const userDetails = userResults[0];

        // Fetch Purchases (Orders)
        db.query(
            "SELECT o.order_id, o.total_amount, o.order_date, g.title, g.platform FROM orders o JOIN games g ON o.game_id = g.game_id WHERE o.user_id = ? ORDER BY o.order_date DESC",
            [userId],
            (ordersErr, ordersResults) => {
                if (ordersErr) console.error("Profile Orders Error:", ordersErr);

                // Fetch Rentals
                db.query(
                    "SELECT r.rental_id, r.rent_date, r.return_date, g.title, g.platform FROM rentals r JOIN games g ON r.game_id = g.game_id WHERE r.user_id = ? ORDER BY r.rent_date DESC",
                    [userId],
                    (rentalsErr, rentalsResults) => {
                        if (rentalsErr) console.error("Profile Rentals Error:", rentalsErr);

                        // Fetch Bookings
                        db.query(
                            "SELECT b.booking_id, b.booking_date, b.hours, b.seat_number, c.cafe_name, c.location FROM bookings b JOIN cafes c ON b.cafe_id = c.cafe_id WHERE b.user_id = ? ORDER BY b.booking_date DESC",
                            [userId],
                            (bookingsErr, bookingsResults) => {
                                if (bookingsErr) console.error("Profile Bookings Error:", bookingsErr);

                                res.json({
                                    success: true,
                                    profile: {
                                        name: userDetails.name,
                                        email: userDetails.email,
                                        phone: userDetails.phone,
                                        joinedAt: userDetails.created_at
                                    },
                                    purchases: ordersResults || [],
                                    rentals: rentalsResults || [],
                                    bookings: bookingsResults || []
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});