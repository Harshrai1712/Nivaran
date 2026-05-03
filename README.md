# 🚭 SmokeGuard — Cigarette Detecting Wristband System

A full-stack IoT health tracking mobile application for detecting and monitoring cigarette smoking via a smart wristband. Built as a Final Year EDP Project.

## 📱 Screenshots

The app features a modern health-tracking UI with:
- **Home Dashboard** — Status banner, calendar, heart rate card, summary
- **Day Detail** — Hourly charts for smoking and heart rate
- **Analytics** — Weekly/monthly trends with bar and line charts
- **Profile** — User stats and achievements
- **Settings** — Dark mode, daily limit stepper, notifications

---

## 🛠️ Tech Stack

| Component     | Technology                          |
| ------------- | ----------------------------------- |
| **Frontend**  | React Native (Expo SDK 52)          |
| **Backend**   | Node.js + Express.js                |
| **Database**  | Firebase Realtime Database           |
| **Auth**      | JWT (JSON Web Tokens)               |
| **Charts**    | react-native-chart-kit              |
| **Navigation**| React Navigation v7                 |

---

## 📁 Project Structure

```
Smoke_Detector/
├── backend/                    # Express API server
│   ├── config/firebase.js      # Firebase Admin SDK
│   ├── controllers/            # Route handlers
│   ├── middleware/auth.js      # JWT verification
│   ├── routes/                 # API routes
│   ├── utils/                  # Status calculator, seed data
│   └── server.js               # Entry point
│
├── frontend/                   # React Native Expo app
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── screens/            # App screens
│   │   ├── context/            # Auth & Theme providers
│   │   ├── navigation/         # React Navigation setup
│   │   ├── services/           # API client (Axios)
│   │   ├── theme/              # Colors & typography
│   │   ├── utils/              # Helpers & mock data
│   │   └── config/             # Firebase config
│   └── App.js                  # Root component
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v18+ (LTS recommended)
- **npm** or **yarn**
- **Expo Go** app on your phone (iOS/Android)
- **Firebase** project (for database)

---

### Step 1: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., "SmokeGuard")
3. Enable **Realtime Database**:
   - Go to Build → Realtime Database → Create Database
   - Start in **Test Mode** (for development)
4. **Register a Web App** (for frontend):
   - Go to Project Settings → General → Add App → Web
   - Copy the config object
5. **Generate a Service Account Key** (for backend):
   - Go to Project Settings → Service Accounts → Generate New Private Key
   - Save the JSON file

---

### Step 2: Set Up Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your Firebase details:

```env
PORT=5000
JWT_SECRET=your_super_secret_key_here
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_DATABASE_URL=https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com
```

Place your downloaded `firebase-service-account.json` in the `backend/` folder.

```bash
# Seed dummy data (30 days of health data)
npm run seed

# Start the server
npm run dev
```

The server will start at `http://localhost:5000`

---

### Step 3: Set Up Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
```

**Configure Firebase** (in `src/config/firebase.js`):
Replace the placeholder config with your Firebase Web app config:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Configure API URL** (in `src/services/api.js`):
Update `API_BASE_URL` to match your backend:
- Android Emulator: `http://10.0.2.2:5000`
- iOS Simulator: `http://localhost:5000`
- Physical Device: `http://YOUR_COMPUTER_IP:5000`

```bash
# Start Expo
npx expo start
```

Scan the QR code with the Expo Go app on your phone.

---

### Step 4: Test the App

**Demo Credentials** (after running seed script):
- Email: `demo@smoke-detector.com`
- Password: `demo123`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| POST   | /auth/register   | Register new user      |
| POST   | /auth/login      | Login and get JWT      |
| GET    | /auth/me         | Get current user       |
| PUT    | /auth/settings   | Update user settings   |

### Health Data
| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| POST   | /data/add        | Log cigarette + HR     |
| GET    | /data/today      | Today's aggregated data|
| GET    | /data/date/:date | Specific date data     |
| GET    | /data/month      | Monthly summary        |
| GET    | /data/weekly     | Weekly analytics       |

---

## 🧠 Core Logic

### Smoking Status Calculation
| Cigarettes | Status     | Color      |
| ---------- | ---------- | ---------- |
| 0          | Normal     | 🟢 Green   |
| 1-2        | Very Few   | 🔵 Blue    |
| 3-5        | Moderate   | 🟡 Yellow  |
| > limit    | High       | 🔴 Red     |

---

## ✨ Features

- ✅ JWT Authentication (Register/Login)
- ✅ Real-time polling (30s intervals)
- ✅ Interactive color-coded calendar
- ✅ Heart rate & smoking charts
- ✅ Dark mode with smooth toggle
- ✅ Daily cigarette limit stepper
- ✅ Mock wristband data generation
- ✅ Pull-to-refresh
- ✅ Motivational messages
- ✅ Profile with achievements
- ✅ Offline fallback (mock data)

---

## 📦 Dependencies

### Backend
- express, cors, helmet, morgan
- jsonwebtoken, bcryptjs
- firebase-admin
- dotenv

### Frontend
- expo, react-native
- @react-navigation/native, bottom-tabs, native-stack
- react-native-chart-kit, react-native-svg
- axios, firebase
- @react-native-async-storage/async-storage
- expo-linear-gradient, expo-font

---

## 👨‍💻 EDP Project — Team

> _Cigarette Detecting Wristband System_
>
> Final Year Project

---

## 📄 License

This project is for educational purposes as part of an EDP (Engineering Design Project).
