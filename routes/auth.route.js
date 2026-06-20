const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const authenticateToken = require("../middleware/auth");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/protected",authenticateToken, (req, res) => {
    return res.status(200).json({
        message : `Hello : ${req.user.username} Role : ${req.user.role}`
    });
});

module.exports = router;