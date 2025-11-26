# 🚀 Quick Reference - AR Food Ordering System

## 📞 Login Credentials
```
Admin Phone:    8148545814
Customer Phone: Any 10-digit number
OTP:           Check browser console (dev mode)
```

## 🌐 URLs
```
Backend:  http://localhost:5000
Frontend: http://localhost:3000
API Docs: http://localhost:5000/api/health
```

## ⚡ Quick Commands

### Initial Setup (Run Once)
```powershell
cd "c:\Users\Praveen\OneDrive\Desktop\3D food"
.\setup.ps1
```

### Start Application (Every Time)

**Terminal 1 - Backend:**
```powershell
.\start-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
.\start-frontend.ps1
```

### Manual Start

**Backend:**
```powershell
cd ar-food-backend
npm run dev
```

**Frontend:**
```powershell
cd ar-food-app
npm start
```

### Database Operations
```powershell
# Seed database
cd ar-food-backend
npm run seed

# Connect to MongoDB
mongo
use ar-food-db
db.fooditems.find()
```

## 📊 Admin Features
- Dashboard (Today's & Monthly Stats)
- Daily Reports (Hourly breakdown)
- Monthly Reports (Daily trends)
- Order Management (Status updates)
- Customer List

## 🛒 Customer Features
- Browse Menu (By category)
- Add to Cart
- View Cart
- Place Order
- Order History

## 🔑 API Endpoints

### Auth
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`

### Food
- `GET /api/food`
- `GET /api/food/:id`

### Orders
- `GET /api/orders`
- `POST /api/orders`

### Admin
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:id`
- `GET /api/analytics/dashboard`
- `GET /api/analytics/daily-report`
- `GET /api/analytics/monthly-report`

## 🗄️ Database Collections
- `users` - Customer & Admin accounts
- `fooditems` - Menu items (15 pre-loaded)
- `orders` - Order history

## 🎨 Tech Stack
- **Frontend:** React 18 + TypeScript + MUI
- **Backend:** Node.js + Express + MongoDB
- **Auth:** JWT + OTP
- **Charts:** Recharts

## 📝 Order Status Flow
```
Pending → Confirmed → Preparing → Ready → Delivered
```

## 🐛 Quick Fixes

**MongoDB Not Running:**
```powershell
net start MongoDB
```

**Port Conflict:**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Clear Cache:**
```powershell
cd ar-food-app
Remove-Item -Recurse node_modules
npm install
```

## 📁 Key Files
```
ar-food-backend/
  ├── server.js          (Main server)
  ├── seed.js            (Database seeder)
  └── .env               (Configuration)

ar-food-app/
  ├── src/App.tsx        (Main app)
  ├── src/pages/Login.tsx
  └── .env               (Configuration)
```

## 🔐 Security Notes
- JWT expires in 7 days
- OTP expires in 5 minutes
- Admin access: Phone-based
- Protected routes: JWT required

## 📞 Need Help?
Check `README_FULLSTACK.md` for detailed documentation
Check `PROJECT_SUMMARY.md` for complete feature list

---
**Made with ❤️ for Restaurant Management**
