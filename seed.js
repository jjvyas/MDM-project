const db = require("./db");

async function seed() {
  const conn = db.promise();
  console.log("Starting database seeding and migrations in INR...");

  try {
    // 1. Add game_id to orders if it doesn't exist
    const [ordersColumns] = await conn.query("SHOW COLUMNS FROM orders");
    const hasGameId = ordersColumns.some(col => col.Field === "game_id");
    if (!hasGameId) {
      console.log("Adding game_id column to orders table...");
      await conn.query("ALTER TABLE orders ADD COLUMN game_id INT, ADD FOREIGN KEY (game_id) REFERENCES games(game_id)");
    }

    // 2. Add seat_number to bookings if it doesn't exist
    const [bookingsColumns] = await conn.query("SHOW COLUMNS FROM bookings");
    const hasSeatNumber = bookingsColumns.some(col => col.Field === "seat_number");
    if (!hasSeatNumber) {
      console.log("Adding seat_number column to bookings table...");
      await conn.query("ALTER TABLE bookings ADD COLUMN seat_number VARCHAR(10)");
    }

    // Clear old data to reseed in INR (Indian Rupees)
    console.log("Clearing old games and cafes listings to reseed in INR...");
    // Disable foreign key checks temporarily to safely truncate
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    await conn.query("TRUNCATE TABLE games");
    await conn.query("TRUNCATE TABLE cafes");
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // 3. Seed games in INR
    console.log("Seeding games with INR pricing...");
    const gamesToInsert = [
      ["God of War Ragnarök", "PS5", 3999.00, 399.00, 10],
      ["Assassin's Creed Valhalla", "PS5", 4499.00, 449.00, 8],
      ["Resident Evil 4", "PS5", 2999.00, 299.00, 5]
    ];
    await conn.query("INSERT INTO games (title, platform, price, rent_price, stock) VALUES ?", [gamesToInsert]);

    // 4. Seed cafes in INR
    console.log("Seeding cafes with INR pricing...");
    const cafesToInsert = [
      ["Nexus Gaming Lounge", "Downtown Plaza, 4th Floor", 250.00],
      ["Vortex Esports Arena", "Tech Park Avenue, Gate 2", 300.00],
      ["Overdrive Play Zone", "Marina Boardwalk, Shop 10", 200.00]
    ];
    await conn.query("INSERT INTO cafes (cafe_name, location, price_per_hour) VALUES ?", [cafesToInsert]);

    console.log("Database seeding and migrations completed in INR successfully!");
  } catch (error) {
    console.error("Migration/Seeding Error:", error);
  } finally {
    db.end();
  }
}

seed();
