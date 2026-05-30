CREATE DATABASE bookmygame;
USE bookmygame;
CREATE TABLE users (
user_id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(100),
PHONE_NO INT,
password VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 );
 CREATE TABLE games (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    platform VARCHAR(50),
    price DECIMAL(8,2),
    rent_price DECIMAL(8,2),
    stock INT
);
CREATE TABLE rentals (
    rental_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    game_id INT,
    rent_date DATE,
    return_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (game_id) REFERENCES games(game_id)
);
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10,2),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE cafes (
    cafe_id INT AUTO_INCREMENT PRIMARY KEY,
    cafe_name VARCHAR(100),
    location VARCHAR(100),
    price_per_hour DECIMAL(6,2)
);
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    cafe_id INT,
    booking_date DATE,
    hours INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (cafe_id) REFERENCES cafes(cafe_id)
);