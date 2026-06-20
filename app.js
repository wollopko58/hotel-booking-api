const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const db = require("./db/connect");
const authRouter = require("./routes/auth.route");
const roomsRouter = require("./routes/rooms.route");
const bookingsRouter = require("./routes/bookings.route");
const paymentsRouter = require("./routes/payments.route");

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/payments", paymentsRouter);

app.listen(process.env.PORT, () => {
    console.log(`API on port ${process.env.PORT}`);
});