const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const { getPayments, getPaymentById, postPayments, putPayments, deletePayments } = require("../controllers/payments.controller");

router.get("/", authenticateToken, getPayments);
router.get("/:id", authenticateToken, getPaymentById);
router.post("/", authenticateToken, postPayments);
router.put("/:id", authenticateToken, authorizeRole("admin"), putPayments);
router.delete("/:id", authenticateToken, authorizeRole("admin"), deletePayments);

module.exports = router;