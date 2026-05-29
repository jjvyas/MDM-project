const mysql = require("mysql2");

// Create a connection pool to MySQL database
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Jishant@123",
  database: "bookmygame",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
