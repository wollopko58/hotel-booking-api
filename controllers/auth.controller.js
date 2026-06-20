const db = require("../db/connect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    const { username, password, firstname, lastname, phone } = req.body;
    if(!username || !password || !firstname || !lastname || !phone) {
        return res.status(400).json({
            message : "Invalid Input"
        });
    }

    const cleanUsername = username.trim();

    if(password.length <= 8) {
        return res.status(400).json({
            message : "Password not security"
        });
    }

    try {

        const [existingUser] = await db.execute("SELECT * FROM users WHERE username = ?",
            [cleanUsername]
        );

        if(existingUser.length > 0) {
            return res.status(409).json({
                message : "Username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute("INSERT INTO users(username, password, firstname, lastname, phone) VALUES(?, ?, ?, ?, ?)",
            [cleanUsername, hashedPassword, firstname, lastname, phone]
        );

        return res.status(201).json({
            id: result.insertId,
            username: cleanUsername,
            firstname,
            lastname,
            phone
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred register user",
            error : error.message
        });
    }
}

const login = async (req, res) => {
    const { username, password } = req.body;
    if(!username || !password) {
        return res.status(400).json({
            message : "Invalid input"
        });
    }

    const cleanUsername = username.trim();

    try {

        const [rows] = await db.execute("SELECT * FROM users WHERE username = ?",
            [cleanUsername]
        );
        
        if(rows.length === 0) {
            return res.status(404).json({
                message : "Invalid incredential"
            });
        }

        const user = rows[0];

        const isValidPassword = await bcrypt.compare(password, user.password);
        if(!isValidPassword) {
            return res.status(409).json({
                message : "Invalid incredential"
            });
        }

        const token = jwt.sign(
            {id: user.id, username: user.username, role: user.role},
            process.env.SECRET_KEY,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message : "Login successfully", token
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred login",
            error : error.message
        });
    }
}

module.exports = {
    register,
    login
}