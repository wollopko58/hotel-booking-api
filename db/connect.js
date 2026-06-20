const mysql = require("mysql2");

const pool = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

pool.connect((err) => {
    if(err) {
        console.log("DB connect failed");
    }

    console.log("DB connected!");
});

const db = pool.promise();

module.exports = db;