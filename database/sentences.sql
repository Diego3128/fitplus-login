CREATE TABLE users(
    id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(60) NOT NULL UNIQUE,
    userName VARCHAR(60) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
);