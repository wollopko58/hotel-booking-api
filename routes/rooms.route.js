const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const { getRooms, getRoomById, postRooms, putRooms, deleteRooms } = require("../controllers/rooms.controller");
const authorizeRole = require("../middleware/authorizeRole");


router.get("/", authenticateToken, getRooms);
router.get("/:id", authenticateToken, authorizeRole("admin"), getRoomById);
router.post("/", authenticateToken, authorizeRole("admin"), postRooms);
router.put("/:id", authenticateToken, authorizeRole("admin"), putRooms);
router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteRooms);

module.exports = router;