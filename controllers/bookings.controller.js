const db = require("../db/connect");

const getBookings = async (req, res) => {
    const role = req.user.role;
    let query;
    let params = [];

    if(role === "admin") {
        query = "SELECT * FROM bookings";
    } else {
        query = "SELECT * FROM bookings WHERE user_id = ? AND status IN ('pending', 'paid')";
        params = [req.user.id];
    }

    try {

        const [result] = await db.execute(query, params);
        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            message : "error occurred retrieving bookings",
            error : error.message
        });
    }
}

const getBookingById = async (req, res) => {
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
        query = "SELECT * FROM bookings WHERE id = ?";
        params = [id];
    } else {
        query = "SELECT * FROM bookings WHERE id = ? AND user_id = ?";
        params = [id, req.user.id];
    }

    try {

        const [result] = await db.execute(query, params);

        if(result.length === 0) {
            return res.status(404).json({
                message : "booking not found"
            });
        }

        return res.status(200).json(result[0]);

    } catch (error) {
        return res.status(500).json({
            message : "error occurred retrieving booking",
            error : error.message
        });
    }
}

const postBookings = async (req, res) => {
    const { user_id, room_id, display_name, status, check_in, check_out } = req.body;
    const userId = Number(user_id);
    const roomId = Number(room_id);
    const cleanDisplayName = display_name.trim();
    const isValidStatus = ["pending", "paid", "cancelled"];
    const role = req.user.role;
    let query;
    let params = [];

    if(room_id == null || !cleanDisplayName || !check_in || !check_out) {
        return res.status(400).json({
            message : "Invalid input"
        });
    }

    if(Number.isNaN(roomId) || roomId <= 0) {
        return res.status(400).json({
            message : "Invalid room id"
        });
    }

    if(new Date(check_out) <= new Date(check_in)) {
        return res.status(400).json({
            message : "Invalid date"
        });
    }

    try {

        const [existingRoom] = await db.execute("SELECT * FROM rooms WHERE id = ?",
            [roomId]
        );

        if(existingRoom.length === 0) {
            return res.status(404).json({
                message : "Room not found"
            });
        }

        if(existingRoom[0].status !== "available") {
            return res.status(409).json({
                message : "Room is not available"
            });
        }

        const [existingDate] = await db.execute("SELECT * FROM bookings WHERE room_id = ? AND status IN ('pending', 'paid') AND (check_in < ? AND check_out > ?)",
            [roomId, check_out, check_in]
        );

        if(existingDate.length > 0) {
            return res.status(409).json({
                message : "Room already booked"
            });
        }

        const days = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
        const total = existingRoom[0].price * days;

        if(role === "admin") {
            if(Number.isNaN(userId) || userId <= 0) {
                return res.status(400).json({
                    message : "Invalid user id"
                });
            }

            if(!isValidStatus.includes(status)) {
                return res.status(400).json({
                    message : "Invalid status"
                });
            }

            query = "INSERT INTO bookings (user_id, room_id, display_name, total_price, status, check_in, check_out) VALUES (?, ?, ?, ?, ?, ?, ?)";
            params = [userId, roomId, cleanDisplayName, total, status, check_in, check_out];
        } else {
            query = "INSERT INTO bookings (user_id, room_id, display_name, total_price, status, check_in, check_out) VALUES (?, ?, ?, ?, ?, ?, ?)";
            params = [req.user.id, roomId, cleanDisplayName, total, "pending", check_in, check_out];
        }

        const [result] = await db.execute(query, params);

        return res.status(201).json({
            id: result.insertId,
            user_id: role === "admin" ? userId : req.user.id,
            room_id: roomId,
            display_name: cleanDisplayName,
            total_price: total,
            status: role === "admin" ? status : "pending",
            check_in,
            check_out
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred creating booking",
            error : error.message
        });
    }
}

const putBookings = async (req, res) => {
    const id = Number(req.params.id);
    const { user_id, room_id, display_name, status, check_in, check_out } = req.body;
    const userId = Number(user_id);
    const roomId = Number(room_id);
    const cleanDisplayName = display_name?.trim() || "";
    const isValidStatus = ["pending", "paid", "cancelled"];
    const role = req.user.role;
    let query;
    let params = [];
    let bookingQuery;
    let bookingParams = [];

    if(Number.isNaN(id) || id <= 0) {
        return res.status(400).json({
            message : "Invalid id"
        });
    }

    if(room_id == null || !cleanDisplayName || !check_in || !check_out) {
        return res.status(400).json({
            message : "Invalid input"
        });
    }

    if(Number.isNaN(roomId) || roomId <= 0) {
        return res.status(400).json({
            message : "Invalid room id"
        });
    }

    if(new Date(check_out) <= new Date(check_in)) {
        return res.status(400).json({
            message : "Invalid date"
        });
    }

    try {

        const [existingRoom] = await db.execute("SELECT * FROM rooms WHERE id = ?",
            [roomId]
        );

        if(existingRoom.length === 0) {
            return res.status(404).json({
                message : "Room not found"
            });
        }

        if(existingRoom[0].status !== "available") {
            return res.status(400).json({
                message : "Room is not available"
            });
        }

        const [existingDate] = await db.execute("SELECT * FROM bookings WHERE room_id = ? AND status IN ('pending', 'paid') AND id != ? AND (check_in < ? AND check_out > ?)",
            [roomId, id, check_out, check_in]
        );

        if(existingDate.length > 0) {
            return res.status(409).json({
                message : "Booking already exists"
            });
        }

        const days = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
        const total = existingRoom[0].price * days;

        if(role === "admin") {
            if(Number.isNaN(userId) || userId <= 0) {
                return res.status(400).json({
                    message : "Invalid user id"
                });
            }

            if(!isValidStatus.includes(status)) {
                return res.status(400).json({
                    message : "Invalid status"
                });
            }

            bookingQuery = "SELECT * FROM bookings WHERE id = ?";
            bookingParams = [id];

            query = `UPDATE bookings SET
                                    user_id = ?,
                                    room_id = ?,
                                    display_name = ?,
                                    total_price = ?,
                                    status = ?,
                                    check_in = ?,
                                    check_out = ?
                        WHERE id = ?`;
            params = [userId, roomId, cleanDisplayName, total, status, check_in, check_out, id];
        } else {

            bookingQuery = "SELECT * FROM bookings WHERE id = ? AND user_id = ?";
            bookingParams = [id, req.user.id];

            query = `UPDATE bookings SET
                                    room_id = ?,
                                    display_name = ?,
                                    total_price = ?,
                                    check_in = ?,
                                    check_out = ?
                        WHERE id = ? AND user_id = ? AND status = 'pending'`;
            params = [roomId, cleanDisplayName, total, check_in, check_out, id, req.user.id];
        }

        const [existingBooking] = await db.execute(bookingQuery, bookingParams);

        if(existingBooking.length === 0) {
            return res.status(404).json({
                message : "Booking not found"
            });
        }

        if(existingBooking[0].status === "cancelled") {
            return res.status(409).json({
                message : "Booking already cancelled"
            })
        }

        const [result] = await db.execute(query, params);
        
        if(result.affectedRows === 0) {
            return res.status(404).json({
                message : "Booking not found"
            });
        }

        return res.status(200).json({
            id,
            user_id: role === "admin" ? userId : req.user.id,
            room_id: roomId,
            display_name: cleanDisplayName,
            total_price: total,
            status: role === "admin" ? status : existingBooking[0].status,
            check_in,
            check_out
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred updating booking",
            error : error.message
        });
    }
}

const deleteBookings = async (req, res) => {
    const id = Number(req.params.id);
    const role = req.user.role;
    let query;
    let params = [];

    if(Number.isNaN(id) || id <= 0) {
        return res.status(400).json({
            message : "Invalid id"
        });
    }

    try {

        const [existingBooking] = await db.execute("SELECT id, status FROM bookings WHERE id = ?",
            [id]
        );

        if(existingBooking.length === 0) {
            return res.status(404).json({
                message : "Booking not found"
            });
        }

        if(existingBooking[0].status === "cancelled") {
            return res.status(409).json({
                message : "Booking already cancelled"
            });
        }

        if(role === "admin") {
            query = "UPDATE bookings SET status = 'cancelled' WHERE id = ?";
            params = [id];
        } else {
            query = "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'pending'"
            params = [id, req.user.id]
        }

        const [result] = await db.execute(query, params);

        if(result.affectedRows === 0) {
            return res.status(409).json({
                message : "Cannot cancel booking"
            })
        }

        return res.status(200).json({
            message : "Booking cancelled successfully",
            id
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred deleting booking",
            error : error.message
        });
    }
}

module.exports = {
    getBookings,
    getBookingById,
    postBookings,
    putBookings,
    deleteBookings
}