const db = require("../db/connect");

const getPayments = async (req, res) => {
    const role = req.user.role;
    let query;
    let params = [];

    if(role === "admin") {
        query = "SELECT * FROM payments";
    } else {
        query = `SELECT  p.id,
                         p.booking_id,
                         p.amount,
                         p.status,
                         p.payment_method,
                         p.transaction_ref,
                         p.paid_at,
                         p.created_at
                    FROM payments p
                    INNER JOIN bookings b
                    ON b.id = p.booking_id
                    WHERE b.user_id = ?`
        params = [req.user.id];
    }

    try {

        const [result] = await db.execute(query, params);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            message : "error occurred retrieving payments",
            error : error.message
        })
    }
}

const getPaymentById = async (req, res) => {
    const id = Number(req.params.id);
    const role = req.user.role;
    let query;
    let params = [];

    if(Number.isNaN(id) || id <= 0) {
        return res.status(400).json({
            message : "Invalid id"
        });
    }

    if(role === "admin") {
        query = "SELECT * FROM payments WHERE id = ?";
        params = [id];
    } else {
        query = `SELECT  p.id,
                         p.booking_id,
                         p.amount,
                         p.status,
                         p.payment_method,
                         p.transaction_ref,
                         p.paid_at,
                         p.created_at
                    FROM payments p
                    INNER JOIN bookings b
                    ON b.id = p.booking_id
                    WHERE p.id = ? AND b.user_id = ?`
        params = [id, req.user.id];
    }

    try {

        const [result] = await db.execute(query, params);

        if(result.length === 0) {
            return res.status(404).json({
                message : "Payment not found"
            });
        }

        return res.status(200).json(result[0]);

    } catch (error) {
        return res.status(500).json({
            message : "error occurred retrieving payment",
            error : error.message
        });
    }
}

const postPayments = async (req, res) => {
    const { booking_id, status, payment_method } = req.body;
    const bookingId = Number(booking_id);
    const isValidStatus = ["pending", "paid", "failed", "refunded"];
    const isValidMethod = ["cash", "transfer", "credit-card"];
    const role = req.user.role;
    let query;
    let params = [];
    let bookingQuery;
    let bookingParams = [];
    const statusForUser = "pending";

    if(booking_id == null || !payment_method) {
        return res.status(400).json({
            message : "Invalid input"
        });
    }

    if(Number.isNaN(bookingId) || bookingId <= 0) {
        return res.status(400).json({
            message : "Invalid booking id"
        });
    }

    if(!isValidMethod.includes(payment_method)) {
        return res.status(400).json({
            message : "Invalid payment method"
        });
    }

    try {

        if(role === "admin") {

            bookingQuery = "SELECT id, total_price, status FROM bookings WHERE id = ?";
            bookingParams = [bookingId];

        } else {

            bookingQuery = "SELECT id, total_price, status FROM bookings WHERE id = ? AND user_id = ?";
            bookingParams = [bookingId, req.user.id];

        }

        const [existingBooking] = await db.execute(bookingQuery, bookingParams);

        if(existingBooking.length === 0) {
            return res.status(404).json({
                message : "Booking not found"
            });
        }

        if(existingBooking[0].status !== "pending") {
            return res.status(409).json({
                message : "booking is not pending"
            });
        }

        const total = existingBooking[0].total_price;

        const [existingPayment] = await db.execute("SELECT * FROM payments WHERE booking_id = ? AND status IN ('pending', 'paid')", [bookingId]);

        if(existingPayment.length > 0) {
            return res.status(409).json({
                message : "Payment already exists"
            });
        }

        if(role === "admin") {

            if(!status) {
                return res.status(400).json({
                    message : "Invalid input"
                });
            }

            if(!isValidStatus.includes(status)) {
                return res.status(400).json({
                    message : "Invalid status"
                });
            }

            query = "INSERT INTO payments (booking_id, amount, status, payment_method) VALUES (?, ?, ?, ?)";
            params = [bookingId, total, status, payment_method]
        } else {

            query = "INSERT INTO payments (booking_id, amount, status, payment_method) VALUES (?, ?, ?, ?)";
            params = [bookingId, total, statusForUser, payment_method]
        }

        const [result] = await db.execute(query, params);

        const finalStatus = role === "admin" ? status : statusForUser;

        if(finalStatus === "paid") {
            await db.execute("UPDATE bookings SET status = 'paid' WHERE id = ?",
                [bookingId]
            );
        } 

        return res.status(201).json({
            id: result.insertId,
            booking_id: bookingId,
            amount: total,
            status : finalStatus,
            payment_method
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred creating payment",
            error : error.message
        });
    }
}

const putPayments = async (req, res) => {
    const id = Number(req.params.id);
    const { status, payment_method } = req.body;

    const isValidStatus = ["pending", "paid", "failed", "refunded"];
    const isValidMethod = ["cash", "transfer", "credit-card"];

    if(Number.isNaN(id) || id <= 0) {
        return res.status(400).json({
            message : "Invalid id"
        });
    }

    if(!status || !payment_method) {
        return res.status(400).json({
            message : "Invalid input"
        });
    }

    if(!isValidStatus.includes(status)) {
        return res.status(400).json({
            message : "Invalid status"
        });
    }

    if(!isValidMethod.includes(payment_method)) {
        return res.status(400).json({
            message : "Invalid payment method"
        });
    }

    try {

        const [existingPayment] = await db.execute("SELECT * FROM payments WHERE id = ?",
            [id]
        );

        if(existingPayment.length === 0) {
            return res.status(404).json({
                message : "Payment not found"
            });
        }

        if(existingPayment[0].status === "refunded") {
            return res.status(409).json({
                message : "Payment already refunded"
            });
        }

        const [existingBooking] = await db.execute("SELECT id, total_price, status FROM bookings WHERE id = ?",
            [existingPayment[0].booking_id]
        );

        if(existingBooking.length === 0) {
            return res.status(404).json({
                message : "Booking not found"
            });
        }


        await db.execute(`UPDATE payments SET
                                                            status = ?,
                                                            payment_method = ?
                                                WHERE id = ?`,
                [status, payment_method, id]
        );

        if(status === "paid") {
            await db.execute(
                    "UPDATE bookings SET status = 'paid' WHERE id = ?",
                [existingPayment[0].booking_id]
            );
        }

        if(status === "failed") {
            await db.execute(
                    "UPDATE bookings SET status = 'pending' WHERE id = ?",
                [existingPayment[0].booking_id]
            );
        }

        return res.status(200).json({
            id,
            booking_id: existingPayment[0].booking_id,
            amount: existingPayment[0].amount,
            status,
            payment_method
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred updating payment",
            error : error.message
        });
    }
}

const deletePayments = async (req, res) => {
    const id = Number(req.params.id);

    if(Number.isNaN(id) || id <= 0) {
        return res.status(400).json({
            message : "Invalid id"
        });
    }

    try {

        const [existingPayment] = await db.execute("SELECT * FROM payments WHERE id = ?",
            [id]
        );

        if(existingPayment.length === 0) {
            return res.status(404).json({
                message : "Payment not found"
            });
        }

        if(existingPayment[0].status === "refunded") {
            return res.status(409).json({
                message : "Payment already refunded"
            });
        }

        if(existingPayment[0].status === "paid") {
            await db.execute(
                    "UPDATE bookings SET status = 'pending' WHERE id = ?",
                [existingPayment[0].booking_id]
            );
        }

        await db.execute("DELETE FROM payments WHERE id = ?",
            [id]
        );

        return res.status(200).json({
            message : "Payment deleted successfully", id
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred deleting payment",
            error : error.message
        });
    }
}

module.exports = {
    getPayments,
    getPaymentById,
    postPayments,
    putPayments,
    deletePayments
}