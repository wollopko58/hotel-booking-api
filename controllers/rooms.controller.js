const db = require("../db/connect");

const getRooms = async(req, res) => {
    const role = req.user.role;
    let query;

    if(role === "admin") {
        query = "SELECT * FROM rooms";
    } else {
        query = "SELECT * FROM rooms WHERE status = 'available'";
    }

    try {

        const [result] = await db.execute(query);

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            message : "error occurred retrieving rooms",
            error : error.message
        })
    }
}

const getRoomById = async (req, res) => {
    const id = Number(req.params.id);
    if(Number.isNaN(id) || id <= 0) {
        return res.status(400).json({
            message : "Invalid Id"
        });
    }

    try {

        const [result] = await db.execute("SELECT * FROM rooms WHERE id = ?",
            [id]
        );

        if(result.length === 0) {
            return res.status(404).json({
                message : "room not found"
            });
        }

        return res.status(200).json(result[0]);

    } catch (error) {
        return res.status(500).json({
            message : "error occurred retrieving room",
            error : error.message
        });
    }

}

const postRooms = async (req, res) => {
    const { room_number, price, status } = req.body;
    const numPrice = Number(price);
    const isValidStatus = ["available", "maintenance"];

    if(!room_number || price == null || !status) {
        return res.status(400).json({
            message : "Invalid input"
        });
    }

    const cleanRoomNumber = room_number.trim();

    if(Number.isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({
            message : "Invalid price"
        });
    }

    if(!isValidStatus.includes(status)) {
        return res.status(400).json({
            message : "Invalid status"
        });
    }

    try {

        const [existingRoom] = await db.execute("SELECT * FROM rooms WHERE room_number = ?",
            [cleanRoomNumber]
        );

        if(existingRoom.length > 0) {
            return res.status(409).json({
                message : "Room number already exists"
            });
        }

        const [result] = await db.execute("INSERT INTO rooms(room_number, price, status) VALUES(?, ?, ?)",
            [cleanRoomNumber, numPrice, status]
        );

        return res.status(201).json({
            id: result.insertId,
            room_number: cleanRoomNumber,
            price: numPrice,
            status
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred creating room",
            error : error.message
        });
    }
}

const putRooms = async (req, res) => {
    const id = Number(req.params.id);
    const { room_number, price, status } = req.body;
    const numPrice = Number(price);
    const isValidStatus = ["available", "maintenance"];

    if(Number.isNaN(id) || id <= 0) {
        return res.status(400).json({
            message : "Invalid id"
        });
    }

    if(!room_number || price == null || !status) {
        return res.status(400).json({
            message : "Invalid input"
        });
    }

    const cleanRoomNumber = room_number.trim();

    if(Number.isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({
            message : "Invalid price"
        });
    }

    if(!isValidStatus.includes(status)) {
        return res.status(400).json({
            message : "Invalid status"
        });
    }

    try {

        const [existingRoom] = await db.execute("SELECT * FROM rooms WHERE id = ?",
            [id]
        );

        if(existingRoom.length === 0) {
            return res.status(404).json({
                message : "Room not found"
            });
        }

        const [duplicateRoom] = await db.execute( `SELECT * 
                                                    FROM rooms 
                                                    WHERE room_number = ? AND id != ?`, 
            [cleanRoomNumber, id] 
        ); 
        
        if (duplicateRoom.length > 0) { 
            return res.status(409).json({ 
                message: "Room number already exists" 
            }); 
        }

        const [result] = await db.execute(`UPDATE rooms SET
                                                        room_number = ?,
                                                        price = ?,
                                                        status = ?
                                                    WHERE id = ?`,
            [cleanRoomNumber, numPrice, status, id]
        );

        return res.status(200).json({
            id,
            room_number: cleanRoomNumber,
            price: numPrice,
            status
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred updating room",
            error : error.message
        });
    }
}

const deleteRooms = async (req, res) => {
    const id = Number(req.params.id);
    if(Number.isNaN(id) || id <= 0) {
        return res.status(400).json({
            message : "Invalid id"
        });
    }

    try {

        const [existingRoom] = await db.execute("SELECT * FROM rooms WHERE id = ?",
            [id]
        );

        if(existingRoom.length === 0) {
            return res.status(404).json({
                message : "Room not found"
            });
        }

        if(existingRoom[0].status === "maintenance") {
            return res.status(409).json({
                message : "Status room already maintenance"
            });
        }

        const [result] = await db.execute("UPDATE rooms SET status = 'maintenance' WHERE id = ?",
            [id]
        );

        return res.status(200).json({
            message : "Room status updated successfully", id
        });

    } catch (error) {
        return res.status(500).json({
            message : "error occurred deleting room",
            error : error.message
        });
    }
}

module.exports = {
    getRooms,
    getRoomById,
    postRooms,
    putRooms,
    deleteRooms
}