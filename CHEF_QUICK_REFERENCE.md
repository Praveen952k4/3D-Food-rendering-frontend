# 👨‍🍳 Chef Panel - Quick Reference Card

## 🔑 Login Credentials

```
Phone: 9999999999
OTP: 123456 (any code works)
```

## 🌐 URLs

- **Chef Dashboard**: http://localhost:3000/chef/dashboard
- **Login Page**: http://localhost:3000/login

## 📱 Test Workflow

### 1️⃣ Login as Chef
```
1. Open http://localhost:3000
2. Enter phone: 9999999999
3. Enter OTP: 123456
4. → Redirected to /chef/dashboard
```

### 2️⃣ Create Test Order
```
1. Open incognito/private window
2. Login as customer (any phone)
3. Add items to cart
4. Place order (status: pending)
```

### 3️⃣ Confirm Order (Admin)
```
1. Open another browser/tab
2. Login as admin (1234567890)
3. Go to Order Management
4. Click "Confirm Payment" on test order
5. Order status → confirmed
```

### 4️⃣ View in Chef Panel
```
1. Back to chef dashboard
2. Order appears automatically
3. Shows: table #, items, customizations
4. Click "Mark as Delivered"
5. Order disappears from chef panel
```

## 🎨 What Chef Sees

```
╔═══════════════════════════════════════╗
║        👨‍🍳 Chef Dashboard            ║
╠═══════════════════════════════════════╣
║                                       ║
║  📊 Total Orders: 3                   ║
║  🍽️ Total Items: 12                   ║
║                                       ║
║  ┌─────────────────────────────────┐ ║
║  │ TABLE #5       [Confirmed]      │ ║
║  │                                 │ ║
║  │ 🍕 Chicken Pizza x2             │ ║
║  │    • Extra cheese               │ ║
║  │    • No onions                  │ ║
║  │                                 │ ║
║  │ 🍔 Burger x1                    │ ║
║  │    • Well done                  │ ║
║  │                                 │ ║
║  │ Total: ₹500                     │ ║
║  │ Time: 5 minutes ago             │ ║
║  │                                 │ ║
║  │  [Mark as Delivered] →          │ ║
║  └─────────────────────────────────┘ ║
║                                       ║
╚═══════════════════════════════════════╝
```

## ⚡ Features

✅ Real-time order updates (Socket.IO)
✅ Auto-refresh every 30 seconds
✅ Shows only confirmed orders
✅ One-click delivery marking
✅ Responsive design (tablet-friendly)
✅ Order details with customizations

## 🔄 Order Status Flow

```
Customer → pending
   ↓
Admin → confirmed → 👨‍🍳 APPEARS IN CHEF PANEL
   ↓
Chef → delivered → ❌ REMOVED FROM CHEF PANEL
```

## 🎯 Key Files

### Frontend
- `src/pages/Chef/Dashboard.jsx` - Main UI
- `src/pages/Chef/ChefLayout.jsx` - Layout wrapper
- `src/components/routing/AppRoutes.jsx` - Routes
- `src/services/api.js` - API calls

### Backend
- `routes/chef.js` - Chef endpoints
- `models/User.js` - User model (role: chef)
- `server.js` - Route registration

## 📞 API Calls

```javascript
// Get orders
GET /api/chef/orders
Headers: { Authorization: Bearer {token} }

// Mark delivered
PUT /api/chef/orders/{orderId}/deliver
Headers: { Authorization: Bearer {token} }
```

## 🐛 Quick Debug

### Dashboard blank?
```javascript
// Browser console
localStorage.getItem('token')  // Should return JWT
localStorage.getItem('user')   // Should show role: "chef"
```

### Orders not showing?
```bash
# Backend logs should show:
✅ Chef routes registered: /api/chef
🔐 Request with auth token to: /chef/orders
```

### Can't mark delivered?
- Check browser console for errors
- Verify Socket.IO connection: `socket.connected`
- Check backend logs for PUT request

## 📚 Documentation

- **Complete Guide**: `CHEF_PANEL_GUIDE.md`
- **Implementation Summary**: `CHEF_IMPLEMENTATION_COMPLETE.md`

## 🚀 Start Application

```bash
cd "c:\Users\Praveen\OneDrive\Desktop\3D food"
.\start-all.ps1
```

---

**Status**: ✅ READY FOR TESTING  
**Chef User**: ✅ CREATED (9999999999)  
**Routes**: ✅ CONFIGURED  
**Backend**: ✅ INTEGRATED

🎉 **CHEF PANEL IS LIVE!** 🎉
