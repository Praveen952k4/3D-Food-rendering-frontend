# 📁 Complete Project Structure

```
c:\Users\Praveen\OneDrive\Desktop\3D food\
│
├── 📄 PROJECT_DOCUMENTATION.md      # Original AR project docs
├── 📄 README_FULLSTACK.md           # Complete setup guide
├── 📄 PROJECT_SUMMARY.md            # Implementation summary
├── 📄 QUICK_REFERENCE.md            # Quick command reference
│
├── 🔧 setup.ps1                     # Initial setup script
├── 🔧 start-backend.ps1             # Start backend server
├── 🔧 start-frontend.ps1            # Start React app
│
├── 📂 ar-food-backend/              # Node.js Backend API
│   ├── 📂 models/
│   │   ├── User.js                  # User model (customers & admin)
│   │   ├── FoodItem.js              # Food menu items
│   │   └── Order.js                 # Order details
│   │
│   ├── 📂 routes/
│   │   ├── auth.js                  # Login & OTP verification
│   │   ├── orders.js                # Customer orders
│   │   ├── food.js                  # Food items API
│   │   ├── admin.js                 # Admin operations
│   │   └── analytics.js             # Reports & dashboard
│   │
│   ├── 📂 middleware/
│   │   └── auth.js                  # JWT authentication
│   │
│   ├── 📂 node_modules/             # Backend dependencies
│   │
│   ├── 📄 .env                      # Environment variables
│   ├── 📄 package.json              # Dependencies & scripts
│   ├── 📄 server.js                 # Main Express server
│   └── 📄 seed.js                   # Database seeder
│
├── 📂 ar-food-app/                  # React Frontend
│   ├── 📂 public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── AdminLayout.tsx      # Admin panel sidebar
│   │   │   └── CustomerLayout.tsx   # Customer wrapper
│   │   │
│   │   ├── 📂 pages/
│   │   │   ├── Login.tsx            # Phone + OTP login
│   │   │   │
│   │   │   ├── 📂 Admin/
│   │   │   │   ├── Dashboard.tsx    # Analytics dashboard
│   │   │   │   └── OrderManagement.tsx  # Order status updates
│   │   │   │
│   │   │   └── 📂 Customer/
│   │   │       └── Menu.tsx         # Food menu & cart
│   │   │
│   │   ├── 📂 context/
│   │   │   └── AuthContext.tsx      # Global auth state
│   │   │
│   │   ├── 📂 services/
│   │   │   └── api.ts               # Axios API client
│   │   │
│   │   ├── App.tsx                  # Main app with routing
│   │   ├── App.css
│   │   ├── index.tsx                # Entry point
│   │   └── index.css
│   │
│   ├── 📂 node_modules/             # Frontend dependencies
│   │
│   ├── 📄 .env                      # API URL config
│   ├── 📄 package.json              # Dependencies
│   ├── 📄 tsconfig.json             # TypeScript config
│   └── 📄 README.md
│
└── 📂 [Original Files]              # Your existing AR files
    ├── new1.html
    ├── cart.html
    ├── payment.html
    ├── success.html
    ├── failure.html
    ├── script.js
    ├── cart.js
    └── ... (all other AR files)
```

---

## 📊 File Count Summary

### Backend (ar-food-backend/)
- **Models:** 3 files
- **Routes:** 5 files
- **Middleware:** 1 file
- **Config:** 3 files (server.js, seed.js, .env)
- **Total:** ~12 core files + node_modules

### Frontend (ar-food-app/)
- **Components:** 2 files
- **Pages:** 4 files (Login + 2 Admin + 1 Customer)
- **Context:** 1 file
- **Services:** 1 file
- **Config:** 4 files (App.tsx, index.tsx, .env, etc.)
- **Total:** ~15 core files + node_modules

### Scripts & Docs
- **Setup Scripts:** 3 files (.ps1)
- **Documentation:** 4 files (.md)
- **Total:** 7 files

---

## 🎯 Key Entry Points

### Backend
**Start Here:** `ar-food-backend/server.js`
- Loads routes from `/routes` folder
- Connects to MongoDB
- Starts Express server on port 5000

### Frontend
**Start Here:** `ar-food-app/src/App.tsx`
- Sets up routing (React Router)
- Wraps app in AuthProvider
- Configures Material-UI theme

### Authentication
**Start Here:** `ar-food-app/src/context/AuthContext.tsx`
- Manages login state
- Stores JWT token
- Provides auth functions to all components

### API Client
**Start Here:** `ar-food-app/src/services/api.ts`
- Axios instance with base URL
- Auto-adds JWT token to requests
- All API endpoints defined here

---

## 🔄 Data Flow

### Login Flow
```
Login.tsx (Frontend)
    ↓ sendOTP()
api.ts
    ↓ POST /api/auth/send-otp
auth.js (Backend Route)
    ↓ Generate OTP
User.js (Model)
    ↓ Save to MongoDB
    ↓ Return OTP (dev mode)
Login.tsx
    ↓ User enters OTP
    ↓ verifyOTP()
auth.js
    ↓ Verify & generate JWT
AuthContext.tsx
    ↓ Store token & user
    ↓ Redirect based on role
Dashboard.tsx or Menu.tsx
```

### Order Flow
```
Menu.tsx (Customer adds to cart)
    ↓ createOrder()
api.ts
    ↓ POST /api/orders
orders.js (Backend)
    ↓ Create order document
Order.js (Model)
    ↓ Save to MongoDB
    ↓ Return order details
Menu.tsx
    ↓ Show success message
```

### Admin Dashboard Flow
```
Dashboard.tsx
    ↓ getDashboard()
    ↓ getDailyReport()
    ↓ getMonthlyReport()
api.ts
    ↓ GET /api/analytics/*
analytics.js (Backend)
    ↓ Query MongoDB
    ↓ Aggregate data
Order.js (Model)
    ↓ Calculate stats
Dashboard.tsx
    ↓ Render charts (Recharts)
```

---

## 🗃️ Database Structure

### MongoDB Database: `ar-food-db`

**Collections:**
1. **users**
   - Stores admin & customer accounts
   - Role determined by phone number

2. **fooditems**
   - 15 pre-seeded items
   - Managed by admin

3. **orders**
   - All customer orders
   - Status tracking
   - Payment info

---

## 🔗 How Files Connect

### Backend Connection
```
server.js
  ├─→ routes/auth.js → models/User.js
  ├─→ routes/orders.js → models/Order.js
  ├─→ routes/food.js → models/FoodItem.js
  ├─→ routes/admin.js → (all models)
  └─→ routes/analytics.js → models/Order.js
```

### Frontend Connection
```
App.tsx
  ├─→ AuthContext.tsx → services/api.ts
  ├─→ AdminLayout.tsx
  │     ├─→ Dashboard.tsx → api.ts
  │     └─→ OrderManagement.tsx → api.ts
  └─→ CustomerLayout.tsx
        └─→ Menu.tsx → api.ts
```

---

## 📝 File Purposes Quick Reference

### Backend Files
| File | Purpose |
|------|---------|
| `server.js` | Express server setup |
| `seed.js` | Populate database with food items |
| `models/User.js` | User schema (admin/customer) |
| `models/FoodItem.js` | Food menu items |
| `models/Order.js` | Order tracking |
| `routes/auth.js` | Login & OTP |
| `routes/orders.js` | Order CRUD |
| `routes/food.js` | Food items API |
| `routes/admin.js` | Admin operations |
| `routes/analytics.js` | Reports & stats |
| `middleware/auth.js` | JWT verification |

### Frontend Files
| File | Purpose |
|------|---------|
| `App.tsx` | Main app with routing |
| `Login.tsx` | Phone authentication |
| `Dashboard.tsx` | Admin analytics |
| `OrderManagement.tsx` | Admin order updates |
| `Menu.tsx` | Customer food menu |
| `AdminLayout.tsx` | Admin sidebar |
| `CustomerLayout.tsx` | Customer wrapper |
| `AuthContext.tsx` | Auth state management |
| `api.ts` | API client |

---

## 🎨 Visual Component Tree

```
App
├── AuthProvider
│   └── Router
│       ├── Login Page
│       │   └── Phone + OTP Form
│       │
│       ├── Admin Routes (Protected)
│       │   └── AdminLayout
│       │       ├── Sidebar
│       │       │   ├── Dashboard Link
│       │       │   ├── Orders Link
│       │       │   └── Logout Button
│       │       │
│       │       └── Outlet
│       │           ├── Dashboard
│       │           │   ├── Stats Cards
│       │           │   ├── Tabs (Daily/Monthly)
│       │           │   ├── Charts (Line/Bar/Pie)
│       │           │   └── Reports
│       │           │
│       │           └── OrderManagement
│       │               ├── Orders Table
│       │               └── Status Update Modal
│       │
│       └── Customer Routes (Protected)
│           └── CustomerLayout
│               └── Outlet
│                   └── Menu
│                       ├── Category Tabs
│                       ├── Food Grid
│                       │   └── Food Cards
│                       │       ├── Image
│                       │       ├── Name/Price
│                       │       └── Add/Remove Buttons
│                       │
│                       └── Cart Button (Fixed)
```

---

## 🚀 Deployment Structure (Future)

```
Production Setup:
├── Backend (Heroku/Railway/Render)
│   ├── MongoDB Atlas (Cloud DB)
│   └── Environment Variables
│
└── Frontend (Vercel/Netlify)
    └── Connect to Backend API URL
```

---

**This structure gives you complete visibility into the project!** 🎉
