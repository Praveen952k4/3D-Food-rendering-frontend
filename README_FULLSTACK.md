# AR Food Ordering System - Full Stack Application

A complete full-stack restaurant ordering system with phone authentication, admin dashboard, and AR menu viewer.

## 🚀 Features

### Authentication
- ✅ Phone number login with OTP verification
- ✅ Role-based access (Admin/Customer)
- ✅ JWT token authentication
- ✅ Default admin phone: **8148545814**

### Admin Panel
- ✅ **Dashboard** with real-time analytics
  - Today's orders and revenue
  - Monthly statistics
  - Total orders and pending orders
- ✅ **Daily Reports** 
  - Hourly sales breakdown
  - Top-selling items
  - Average order value
- ✅ **Monthly Reports**
  - Daily sales trends
  - Category breakdown (pie chart)
  - Revenue analytics
- ✅ **Order Management**
  - View all orders
  - Update order status (Pending → Confirmed → Preparing → Ready → Delivered)
  - Filter by status and date
- ✅ **Customer Management**
  - View all registered customers
  - Track customer orders

### Customer Interface
- ✅ Browse food menu by category
- ✅ Add items to cart
- ✅ Real-time cart updates
- ✅ View order history
- ✅ Integration with existing AR viewer

## 📦 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Recharts** for data visualization
- **Axios** for API calls
- **Three.js** for AR functionality

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ installed
- MongoDB installed and running
- Git

### Step 1: Install MongoDB (if not installed)

**Windows:**
```powershell
# Download MongoDB Community Server from:
# https://www.mongodb.com/try/download/community

# Or install via Chocolatey:
choco install mongodb

# Start MongoDB service:
net start MongoDB
```

### Step 2: Backend Setup

```powershell
# Navigate to backend directory
cd "c:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-backend"

# Install dependencies (already done)
npm install

# Configure environment variables
# Edit .env file and update if needed:
# - MONGODB_URI=mongodb://localhost:27017/ar-food-db
# - JWT_SECRET=your-secret-key
# - ADMIN_PHONES=8148545814

# Seed the database with sample food items
node seed.js

# Start the server
npm run dev
```

The backend will start on **http://localhost:5000**

### Step 3: Frontend Setup

```powershell
# Open new terminal
cd "c:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-app"

# Install dependencies (already done)
npm install

# Start the React app
npm start
```

The frontend will open on **http://localhost:3000**

## 🔐 Login Credentials

### Admin Login
- **Phone:** 8148545814
- **OTP:** Will be displayed in console (development mode)

### Customer Login
- **Phone:** Any 10-digit number
- **OTP:** Will be displayed in console (development mode)

## 📱 Usage Guide

### First-Time Setup

1. **Start MongoDB**
   ```powershell
   # Windows
   net start MongoDB
   ```

2. **Start Backend**
   ```powershell
   cd "c:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-backend"
   npm run dev
   ```

3. **Start Frontend**
   ```powershell
   cd "c:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-app"
   npm start
   ```

4. **Access the App**
   - Open http://localhost:3000
   - Login with phone: **8148545814** (Admin)
   - Check browser console for OTP

### Admin Workflow

1. Login with admin phone (8148545814)
2. View **Dashboard** for analytics
   - Today's sales
   - Monthly reports
   - Hourly/daily charts
3. Go to **Orders** to manage orders
4. Update order status as needed

### Customer Workflow

1. Login with any 10-digit phone number
2. Browse food menu
3. Add items to cart
4. View cart and checkout
5. Track order status

## 🗂️ Project Structure

```
ar-food-backend/
├── models/
│   ├── User.js          # User schema with role-based access
│   ├── FoodItem.js      # Food menu items
│   └── Order.js         # Order management
├── routes/
│   ├── auth.js          # Authentication endpoints
│   ├── orders.js        # Order CRUD operations
│   ├── food.js          # Food items API
│   ├── admin.js         # Admin-only endpoints
│   └── analytics.js     # Dashboard and reports
├── middleware/
│   └── auth.js          # JWT verification
├── .env                 # Environment variables
├── server.js            # Express server
└── seed.js              # Database seeder

ar-food-app/
├── src/
│   ├── components/
│   │   ├── AdminLayout.tsx      # Admin sidebar layout
│   │   └── CustomerLayout.tsx   # Customer layout
│   ├── pages/
│   │   ├── Login.tsx            # Phone auth page
│   │   ├── Admin/
│   │   │   ├── Dashboard.tsx    # Analytics dashboard
│   │   │   └── OrderManagement.tsx
│   │   └── Customer/
│   │       └── Menu.tsx         # Food menu
│   ├── context/
│   │   └── AuthContext.tsx      # Auth state management
│   ├── services/
│   │   └── api.ts               # API client
│   ├── App.tsx                  # Main app with routing
│   └── index.tsx
└── .env                         # Frontend config
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/update-profile` - Update user profile

### Food Items
- `GET /api/food` - Get all available food items
- `GET /api/food/:id` - Get single food item

### Orders (Customer)
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order

### Admin
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id` - Update order status
- `GET /api/admin/customers` - Get all customers
- `POST /api/admin/food` - Create food item
- `PUT /api/admin/food/:id` - Update food item
- `DELETE /api/admin/food/:id` - Delete food item

### Analytics (Admin)
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/daily-report` - Daily sales report
- `GET /api/analytics/monthly-report` - Monthly sales report

## 📊 Database Schema

### Users Collection
```javascript
{
  phone: String (unique),
  name: String,
  email: String,
  role: "customer" | "admin",
  isVerified: Boolean,
  lastLogin: Date
}
```

### FoodItems Collection
```javascript
{
  name: String,
  category: String,
  price: Number,
  description: String,
  imageUrl: String,
  modelPath: String,
  isVeg: Boolean,
  isAvailable: Boolean
}
```

### Orders Collection
```javascript
{
  userId: ObjectId,
  customerPhone: String,
  items: [{ foodId, name, price, quantity }],
  subtotal: Number,
  tax: Number,
  grandTotal: Number,
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered",
  paymentStatus: "pending" | "success" | "failed",
  createdAt: Date
}
```

## 🔧 Configuration

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ar-food-db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
ADMIN_PHONES=8148545814
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```powershell
# Start MongoDB service
net start MongoDB

# Or check if running
Get-Service MongoDB
```

### Port Already in Use
```powershell
# Kill process on port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 3000 (frontend)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### React Build Errors
```powershell
# Clear node_modules and reinstall
cd ar-food-app
Remove-Item -Recurse -Force node_modules
npm install
```

## 🚀 Production Deployment

### Backend
1. Set up MongoDB Atlas or use hosted MongoDB
2. Update environment variables
3. Deploy to Heroku/Railway/Render
4. Enable HTTPS

### Frontend
1. Build production version: `npm run build`
2. Deploy to Vercel/Netlify
3. Update API URL in .env

## 📝 TODO / Future Enhancements

- [ ] Real SMS gateway integration (Twilio/MSG91)
- [ ] Payment gateway integration (PhonePe/Razorpay)
- [ ] Image upload for food items
- [ ] Real-time order notifications (WebSockets)
- [ ] Customer ratings and reviews
- [ ] Food item search and filters
- [ ] Export reports to PDF/Excel
- [ ] Multi-language support
- [ ] Push notifications

## 🤝 Support

For issues or questions:
- Check the console logs (browser and terminal)
- Verify MongoDB is running
- Ensure all environment variables are set
- Check API endpoint connectivity

## 📄 License

All rights reserved © 2025

---

**Developer:** Pradeep S  
**Phone:** +91 8838909289  
**Project:** AR Food Ordering System
