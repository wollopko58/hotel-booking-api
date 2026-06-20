const express = require("express");
const authenticateToken = require("../middleware/auth");
const { getBookings, getBookingById, postBookings, putBookings, deleteBookings } = require("../controllers/bookings.controller");
const authorizeRole = require("../middleware/authorizeRole");
const router = express.Router();

router.get("/", authenticateToken, getBookings);
router.get("/:id", authenticateToken, getBookingById);
router.post("/", authenticateToken, postBookings);
router.put("/:id", authenticateToken, putBookings);
router.delete("/:id", authenticateToken, deleteBookings);

module.exports = router;