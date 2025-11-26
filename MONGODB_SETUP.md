# MongoDB Setup Guide for AR Food Backend

## Issue: MongoDB Not Running ❌

The backend needs MongoDB to store data (users, orders, food items).

---

## ✅ Solution: Install & Start MongoDB

### Option 1: Install MongoDB (Recommended)

1. **Download MongoDB Community Server:**
   - Visit: https://www.mongodb.com/try/download/community
   - Choose: Windows → Download MSI installer
   - Version: Latest stable (7.x or 6.x)

2. **Install:**
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Check "Install MongoDB Compass" (GUI tool)
   - Click Install

3. **Verify Installation:**
   ```powershell
   Get-Service MongoDB
   ```

4. **Start MongoDB:**
   ```powershell
   net start MongoDB
   ```

---

### Option 2: Use MongoDB Atlas (Cloud - Free)

If you don't want to install MongoDB locally:

1. **Create Free Account:**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up (free forever tier available)

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose "Free Shared" cluster
   - Select region closest to you
   - Click "Create"

3. **Get Connection String:**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

4. **Update Backend .env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ar-food-db?retryWrites=true&w=majority
   ```

---

## 🔧 After MongoDB is Running

1. **Check Connection:**
   ```powershell
   cd "c:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-backend"
   npm run check-db
   ```

2. **Seed Database:**
   ```powershell
   npm run seed
   ```

3. **Start Backend:**
   ```powershell
   npm run dev
   ```

---

## Expected Output When Working ✅

### When MongoDB Connects:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ MongoDB Connected Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Database: ar-food-db
🌐 Host: localhost
📝 Connection State: Connected
📁 Collections (3): users, fooditems, orders
🗂️  Models Registered (3): User, FoodItem, Order
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### When Server Starts:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 AR Food Backend Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server URL: http://localhost:5000
📡 API Base: http://localhost:5000/api
❤️  Health Check: http://localhost:5000/api/health
📱 Admin Phone: 8148545814
🔧 Environment: development
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Server is ready to accept requests!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Troubleshooting

### MongoDB Service Not Found
```powershell
# Install MongoDB from:
# https://www.mongodb.com/try/download/community
```

### Port 27017 Already in Use
```powershell
# Find process using port
netstat -ano | findstr :27017

# Kill the process (replace <PID>)
taskkill /PID <PID> /F

# Start MongoDB again
net start MongoDB
```

### Connection Refused
```powershell
# Check if MongoDB is running
Get-Service MongoDB

# If stopped, start it
Start-Service MongoDB
```

---

## Quick Commands Reference

```powershell
# Check MongoDB status
Get-Service MongoDB

# Start MongoDB
net start MongoDB

# Stop MongoDB
net stop MongoDB

# Check database connection
npm run check-db

# Seed database with sample data
npm run seed

# Start backend server
npm run dev
```

---

## Next Steps

Once MongoDB is running:

1. ✅ Run `npm run check-db` to verify connection
2. ✅ Run `npm run seed` to load sample food items
3. ✅ Run `npm run dev` to start the backend
4. ✅ Open frontend and start using the system!

---

**Need Help?**
- MongoDB Docs: https://www.mongodb.com/docs/manual/installation/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
