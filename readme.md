<div align="center">

<img src="Ambulance_Frontend/public/favicon.svg" alt="ResQRide Logo" width="80" />

# ResQRide 🚑

**Real-time emergency ambulance dispatch & tracking platform**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](LICENSE)

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Screenshots](#-screenshots)

</div>

---

## 🌟 Overview

ResQRide is a full-stack, real-time ambulance booking and dispatch platform built for the Indian emergency healthcare ecosystem. It connects patients with nearby ambulance drivers, tracks rides live on a map, and gives administrators complete control over driver onboarding and approvals.

> **Built with**: Express · Mongoose · Socket.IO · React 19 · Tailwind CSS v4 · Leaflet · MSG91 OTP · Cloudinary · Nodemailer

---

## ✨ Features

### 👤 For Patients (Users)
- 📱 **OTP-based authentication** via MSG91 — no passwords, just your phone number
- 📍 **GPS-powered pickup detection** with one-tap location capture
- 🏥 **Smart hospital search** — finds nearby hospitals within 12 km using Mappls & Nominatim
- 🚑 **Three ambulance tiers** — Basic (BLS), Advanced (ALS), and Mortuary
- 💰 **Instant fare estimation** before confirming a booking
- 🗺️ **Live driver tracking** on an interactive map (Leaflet + OpenStreetMap)
- 📞 **One-tap driver call** directly from the ride screen
- 🔴 **Emergency SOS button** — quick dial to 108
- 🕓 **Booking history** with full trip details
- ❌ **Cancel anytime** before the driver arrives

### 🚘 For Drivers
- ✅ **Multi-step registration** — details, documents (photo + license), and phone OTP verification
- 📩 **Instant admin notification** via email upon registration
- 🟢 **Online/Offline toggle** with real-time GPS broadcasting
- 📬 **Incoming booking cards** with 30-second auto-reject timer
- 📊 **Session stats** — trips completed & earnings per session
- 🗺️ **Live map view** of pickup and drop locations
- 🔄 **Ride status flow**: Confirmed → En-Route → Arrived → Completed
- 🔌 **Auto-recovery** — if a driver disconnects mid-ride, the booking is cancelled and the user is notified

### 🛡️ For Admins
- 🔔 **Email alerts** when a new driver registers
- ✅ **One-click approval** / ❌ **rejection** of driver applications directly from email action links
- 📋 **Admin dashboard** to view, approve, reject, or suspend drivers
- 🔒 **Role-based access control** — User / Driver / Admin
- 🗂️ **Document verification** — view uploaded license and photo from Cloudinary

### 🔧 System & Infrastructure
- ⚡ **Real-time bidirectional events** via Socket.IO
- 📦 **Cloudinary** for driver photo and document storage
- 🔐 **JWT-based sessions** (15-day token, stateless)
- 🌐 **Reverse geocoding** via Nominatim (OpenStreetMap)
- 🛡️ **Rate limiting** on all public routes
- 🌍 **CORS-protected** API
- 📡 **Geospatial queries** with MongoDB 2dsphere indexes
- 🔁 **Graceful driver disconnect** cleanup

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                │
│  AuthPage  │  UserBookingPage  │  DriverDashboard        │
│  AuthContext │ useSocket │ useGeocoding │ useMsg91        │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP (Axios) + WebSocket (Socket.IO)
┌──────────────────────▼──────────────────────────────────┐
│                  BACKEND (Express + Node.js)             │
│                                                          │
│  /api/v1/auth    → userAuth.controllers                  │
│  /api/v1/driver  → driverAuth.controllers                │
│  /api/v1/booking → booking.controllers                   │
│  /api/v1/places  → places.routes (Mappls proxy)         │
│  /api/v1/admin   → admin.controllers                     │
│                                                          │
│  Socket.IO ──→ socket.js (events: online/offline,        │
│                accept/reject, location_update, status)   │
│                                                          │
│  Services: MSG91 · Cloudinary · Nominatim · Nodemailer   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                     MongoDB Atlas                        │
│  Users  │  Drivers  │  Bookings                         │
│  2dsphere geo-index on Driver.location                   │
│  2dsphere geo-index on Booking.pickupLocation            │
└─────────────────────────────────────────────────────────┘
```

### Fare Calculation

| Type     | Base Fare | Per KM  |
|----------|-----------|---------|
| Basic    | ₹800      | ₹25/km  |
| Advanced | ₹1,000    | ₹40/km  |
| Mortuary | ₹500      | ₹20/km  |

Distance is calculated using the **Haversine formula**.

---

## 📁 Project Structure

```
ResQRide/
├── Ambulance_Backend/
│   └── src/
│       ├── Controllers/        # Business logic
│       ├── Models/             # Mongoose schemas
│       ├── Routes/             # Express routers
│       ├── Middlewares/        # JWT, RBAC, Multer
│       ├── services/           # MSG91, Cloudinary, Nominatim, Nodemailer
│       ├── sockets/            # Socket.IO event handlers
│       ├── Utils/              # Error class, JWT gen, fare calc
│       ├── config/             # dotenv loader
│       ├── Database/           # Mongoose connection
│       ├── app.js              # Express app setup
│       └── index.js            # Server entry point
│
└── Ambulance_Frontend/
    └── src/
        ├── components/
        │   ├── auth/           # AuthCard, PhoneStep, OtpStep, ProtectedRoute
        │   └── ui/             # Map, Button, Card, Tabs, InputOTP
        ├── context/            # AuthContext (global auth state)
        ├── hooks/              # useMsg91, useSocket, useGeocoding, useHospitalSearch
        ├── lib/                # Axios instance, Leaflet fix, utils
        └── pages/              # AuthenticationPage, UserBookingPage,
                                # DriverDashboard, DriverRegisterPage
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **MongoDB Atlas** account (or local MongoDB with replica set for geo queries)
- **MSG91** account (OTP widget)
- **Cloudinary** account
- **Gmail** (or SMTP provider) for admin email notifications
- **Mappls API key** (optional — falls back to Nominatim)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/resqride.git
cd resqride
```

### 2. Backend setup

```bash
cd Ambulance_Backend
npm install
```

Create `.env`:

```env
# Server
PORT=3000
FRONTEND_DEPLOYMENT_URL=http://localhost:5173

# Database
MONGOCONN_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/resqride

# JWT
Access_Token_Secret=your_super_secret_jwt_key_here

# MSG91 OTP
MSG91_AUTHKEY=your_msg91_authkey

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Mappls (optional)
MAPPLS_REST_KEY=your_mappls_key

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
ADMIN_EMAIL=admin@yourdomain.com

# Admin
ADMIN_APPROVAL_SECRET=a_long_random_secret_for_approval_links
```

> **Gmail tip**: Use an [App Password](https://support.google.com/accounts/answer/185833) — not your regular Gmail password.

```bash
npm run dev    # development (nodemon)
npm start      # production
```

### 3. Frontend setup

```bash
cd Ambulance_Frontend
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_MSG91_WIDGETID=your_widget_id
VITE_MSG91_TOKEN=your_token_auth
```

```bash
npm run dev      # development
npm run build    # production build
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/verify` | Verify MSG91 OTP token, returns JWT | ❌ |
| `GET`  | `/api/v1/auth/user` | Get current user/driver profile | ✅ JWT |

### Driver

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/driver/register` | Register new driver (multipart/form-data) | ❌ |

### Booking

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST`  | `/api/v1/booking` | Create a new booking | ✅ User |
| `GET`   | `/api/v1/booking/history` | Get booking history | ✅ User |
| `GET`   | `/api/v1/booking/:id` | Get single booking | ✅ Owner/Driver/Admin |
| `PATCH` | `/api/v1/booking/:id/cancel` | Cancel a booking | ✅ JWT |

### Places

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/places/search` | General place search | ✅ JWT |
| `GET` | `/api/v1/places/hospitals` | Hospital-filtered search | ✅ JWT |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`  | `/api/v1/admin/drivers` | List all drivers with filters | ✅ Admin |
| `PATCH`| `/api/v1/admin/drivers/:id/approve` | Approve driver | ✅ Admin |
| `PATCH`| `/api/v1/admin/drivers/:id/reject` | Reject driver | ✅ Admin |
| `PATCH`| `/api/v1/admin/drivers/:id/suspend` | Suspend driver | ✅ Admin |
| `GET`  | `/api/v1/admin/approve-email` | Email approval link handler | Token |
| `GET`  | `/api/v1/admin/reject-email` | Email rejection link handler | Token |

---

## 📡 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `driver_online` | `{ lat, lng }` | Driver comes online & shares location |
| `driver_offline` | — | Driver goes offline |
| `location_update` | `{ lat, lng, bookingId }` | Periodic GPS update during ride |
| `accept_booking` | `{ bookingId }` | Driver accepts a ride |
| `reject_booking` | `{ bookingId }` | Driver rejects a ride |
| `booking_status_update` | `{ bookingId, status }` | Driver updates ride status |
| `booking_cancellation` | `{ bookingId }` | User cancels their booking |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `new_booking_request` | Booking details | Sent to nearby drivers |
| `booking_confirmed` | Driver details | Sent to user when driver accepts |
| `booking_taken` | `{ bookingId }` | Sent to other drivers when booking is taken |
| `booking_cancelled` | `{ bookingId, reason? }` | Booking was cancelled |
| `driver_location` | `{ lat, lng, bookingId }` | Driver GPS update sent to user |
| `booking_status_update` | `{ bookingId, status }` | Status change sent to user |

---

## 📧 Driver Approval Flow (Nodemailer)

When a driver registers, the admin receives an email like this:

```
Subject: [ResQRide] New Driver Application — Rahul Sharma

A new driver has applied:
  Name:    Rahul Sharma
  Phone:   +919876543210
  Vehicle: MH12AB1234 (BLS)

[✅ Approve Driver]   [❌ Reject Driver]
```

Clicking **Approve** or **Reject** hits a signed URL endpoint that updates the driver's `accStatus` in MongoDB and sends a confirmation email to the admin. The driver is then able (or unable) to log in immediately.

---

## 🌍 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | ✅ | Server port |
| `MONGOCONN_URL` | ✅ | MongoDB connection string |
| `Access_Token_Secret` | ✅ | JWT signing secret |
| `FRONTEND_DEPLOYMENT_URL` | ✅ | CORS allowed origin |
| `MSG91_AUTHKEY` | ✅ | MSG91 authentication key |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `MAPPLS_REST_KEY` | ⚠️ Optional | Mappls API key (falls back to Nominatim) |
| `SMTP_HOST` | ✅ | SMTP host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | ✅ | SMTP port (587 for TLS) |
| `SMTP_USER` | ✅ | SMTP username / email |
| `SMTP_PASS` | ✅ | SMTP password or app password |
| `ADMIN_EMAIL` | ✅ | Email address to receive driver alerts |
| `ADMIN_APPROVAL_SECRET` | ✅ | Secret for signing email approval tokens |

---

## 🛣️ Roadmap

- [ ] Admin dashboard (web UI) for driver management
- [ ] Push notifications (FCM) for driver booking alerts
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Driver ratings & reviews
- [ ] Multi-language support (Hindi, Marathi)
- [ ] Ride analytics dashboard
- [ ] SOS panic button with auto-booking
- [ ] Driver earnings history & payout tracking

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

ISC © ResQRide Contributors

---

<div align="center">
Built with ❤️ for emergency response in India 🇮🇳
</div>
