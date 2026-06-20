# 🏨 Booking System API

A backend REST API for a simple hotel booking system with role-based access control and payment handling (cash-based flow).

This project is built for learning backend development, focusing on CRUD operations, authentication, authorization, and relational database design.

---

## 🚀 Tech Stack

- Node.js
- Express.js
- MySQL
- JWT Authentication
- RESTful API

---

## 🚀 How to Run

```bash
npm install
npm run dev
```

---

## 🔐 Environment Variables

Use `.env.example` as reference to create your `.env` file.

---

## 📌 Features

### 🔐 Authentication
- User registration (register)
- User login (JWT token generation)

### 🏠 Rooms
- Create, update, delete rooms (admin only)
- View available rooms
- Soft delete support

### 📅 Bookings
- Create and manage bookings
- Prevent duplicate bookings via date validation
- Role-based access control (user/admin)
- Automatic price calculation based on stay duration
- Soft cancellation via status update

### 💳 Payments
- Create payment linked to booking
- Prevent duplicate payments per booking
- Support multiple payment methods (cash, transfer, credit-card)
- Payment status management (pending, paid, failed, refunded)
- Sync payment status with booking status
- Payment status determines booking status update

---

## 📌 API Overview

Auth 
    - POST /auth/register
    - POST /auth/login
Rooms
    - GET /rooms
    - POST /rooms (admin)
    - PUT /rooms (admin)
    - DELETE /rooms (admin)
Bookings
    - GET /bookings
    - POST /bookings
    - PUT /bookings
    - DELETE /bookings
Payments
    - GET /payments
    - POST /payments
    - PUT /payments (admin)
    - DELETE /payments (admin)

---

## 🧠 Business Rules

- A booking can only be made for available rooms
- Bookings cannot overlap in date range
- Only pending bookings can be paid
- Each booking can have only one active payment
- Payment status affects booking status

---

## 🧪 Assumptions

- System uses cash-based payment simulation (no external payment gateway)
- Timezone handling is not implemented (server time only)
- Soft delete is partially implemented via status fields

---

## 📝 Notes

This project is designed as a backend-only API and will be extended in the future with a React frontend.

Planned improvements:
- Payment gateway integration
- Improved transaction safety (DB transactions)
- Frontend dashboard with React

---

## 📂 Project Structure

Backend architecture (MVC-like structure):

project-root/
│
├── controllers/
│   ├── auth.controller.js
│   ├── bookings.controller.js
│   ├── payments.controller.js
│   └── rooms.controller.js
│
├── routes/
│   ├── auth.routes.js
│   ├── bookings.routes.js
│   ├── payments.routes.js
│   └── rooms.routes.js
│
├── middleware/
│   ├── auth.js
│   └── authorizeRole.js
│
├── db/
│   └── connect.js
│
├── .env
├── .env.example
├── app.js / server.js
└── package.json

---

## 🎯 Learning Goals

- REST API design
- Authentication & authorization
- Database relationship handling
- Business logic implementation
- Git workflow practice (branch + PR)