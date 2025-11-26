# 📱 Mobile Testing Guide - AR Food App

## ✅ Backend is Ready!
- **Backend Server**: Running on port **5001**
- **Your Computer IP**: `192.168.0.10`
- **API URL**: `http://192.168.0.10:5001/api`

---

## 🔧 Setup Instructions

### Step 1: Ensure Same Network
- ✅ Your computer and mobile phone must be on the **same Wi-Fi network**
- ✅ Both connected to: **Wi-Fi** (192.168.0.10)

### Step 2: Configure Firewall
Run this command to allow port 5001:
```powershell
New-NetFirewallRule -DisplayName "AR Food Backend" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow
```

### Step 3: Restart Frontend
The frontend is configured to use your local IP. Restart the React app:
```bash
cd "C:\Users\Praveen\OneDrive\Desktop\3D food\ar-food-app"
npm start
```

---

## 🧪 Test the Connection

### From Your Computer (Desktop Browser):
1. Open: `http://localhost:3000`
2. Should work as before

### From Your Mobile Phone:
1. **Find your computer's IP**: `192.168.0.10` ✅
2. Open mobile browser
3. Navigate to: `http://192.168.0.10:3000`
4. Test OTP login with phone: `8148545814`
5. Use OTP: `123456`

---

## 🐛 Troubleshooting

### Issue: "Failed to send OTP"

**Check #1: Can mobile reach backend?**
Open on mobile browser: `http://192.168.0.10:5001/api/health`
- ✅ Should see: `{"status":"ok","message":"AR Food API is running"}`
- ❌ If timeout/error: Firewall blocking connection

**Check #2: Is backend running?**
Look for backend terminal output:
```
✅ MongoDB Connected Successfully!
🚀 AR Food Backend Server Started!
🌐 Server URL: http://localhost:5001
```

**Check #3: Network connectivity**
On your computer, run:
```powershell
Test-NetConnection -ComputerName 192.168.0.10 -Port 5001
```
Should show: `TcpTestSucceeded : True`

**Check #4: Check firewall**
```powershell
Get-NetFirewallRule -DisplayName "AR Food Backend"
```
Should exist with Action: Allow

---

## 🔍 Backend Logs

The backend now shows detailed logs:
```
📨 POST /api/auth/send-otp - 2025-11-26T...
📦 Body: {
  "phone": "8148545814"
}
📞 Cleaned phone: 8148545814
🔑 Generated OTP: 123456
✅ User saved successfully
✅ OTP sent successfully
```

---

## 📝 Quick Test Steps

### Test 1: Health Check
**Mobile Browser**: `http://192.168.0.10:5001/api/health`
**Expected**: JSON response with status "ok"

### Test 2: Send OTP API
**Using mobile browser console or Postman:**
```bash
curl -X POST http://192.168.0.10:5001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"8148545814"}'
```
**Expected**:
```json
{
  "success": true,
  "message": "OTP sent successfully. Use 123456 to login.",
  "otp": "123456"
}
```

### Test 3: Full App Login
1. Open app: `http://192.168.0.10:3000`
2. Enter phone: `8148545814`
3. Click "Send OTP"
4. Enter OTP: `123456`
5. Click "Verify & Login"
6. Should redirect to home/dashboard

---

## 🔐 Demo Accounts

### Customer Login:
- Phone: `8148545814`
- OTP: `123456` (always works)

### Admin Login:
- Phone: `8148545814` (same number)
- OTP: `123456`
- Role is determined by database

---

## 🚨 Common Errors & Solutions

### Error: "Network Error" or "Failed to send OTP"
**Cause**: Mobile can't reach backend
**Solution**: 
1. Check Wi-Fi connection (same network)
2. Add firewall rule (see Step 2 above)
3. Verify backend is running on port 5001
4. Try health check endpoint first

### Error: "Connection Refused"
**Cause**: Backend not running or wrong port
**Solution**: 
1. Check backend terminal for "Server Started" message
2. Verify port is 5001 (not 5000)
3. Restart backend if needed

### Error: "Timeout"
**Cause**: Firewall blocking or wrong IP
**Solution**:
1. Double-check IP address: `192.168.0.10`
2. Add firewall exception for port 5001
3. Disable Windows Firewall temporarily to test
4. Check router settings (AP isolation might be enabled)

### Error: "CORS Error"
**Cause**: Old browser cache or CORS not configured
**Solution**: Already fixed! Backend now accepts all origins in development

---

## 🌐 Network Configuration

### Current Setup:
```
Computer (Backend)     Mobile Phone (Frontend)
------------------     ----------------------
IP: 192.168.0.10      IP: 192.168.0.x
Port: 5001            Browser: Chrome/Safari
Wi-Fi: ✅             Wi-Fi: ✅ (same network)
Firewall: Allow 5001  
```

### What Changed:
1. ✅ Enhanced CORS configuration (allows mobile access)
2. ✅ Added detailed logging for debugging
3. ✅ Created .env.local with your IP address
4. ✅ Better error messages in OTP endpoint
5. ✅ Request logging shows all API calls

---

## 📊 Expected Console Output

### Backend Console (when OTP is sent):
```
📨 POST /api/auth/send-otp - 2025-11-26T07:21:45.123Z
📦 Body: {
  "phone": "8148545814"
}
📱 Send OTP request received: { phone: '8148545814', body: [Object] }
📞 Cleaned phone: 8148545814
🔑 Generated OTP: 123456
👤 Creating new user
✅ User saved successfully
📱 OTP for 8148545814: 123456 (Use this to login)
✅ OTP sent successfully
```

### Frontend Console (successful):
```
Sending OTP to: 8148545814
OTP sent successfully: 123456
```

### Frontend Console (error):
```
Failed to send OTP: Network Error
Check backend connection: http://192.168.0.10:5001/api/auth/send-otp
```

---

## 🎯 Next Steps

1. **Test backend health**: Visit `http://192.168.0.10:5001/api/health` on mobile
2. **Add firewall rule**: Run the PowerShell command above
3. **Restart frontend**: Stop and restart `npm start`
4. **Open on mobile**: Navigate to `http://192.168.0.10:3000`
5. **Test login**: Use phone `8148545814` with OTP `123456`

---

## 💡 Pro Tips

- Keep backend terminal visible to see logs
- Use Chrome DevTools on mobile (chrome://inspect)
- Check mobile browser console for errors
- Test API endpoints with Postman first
- Ensure phone isn't on VPN or mobile data

---

## 📞 Support

If still having issues:
1. Check backend logs for error messages
2. Verify IP address hasn't changed: `ipconfig`
3. Test with another mobile device
4. Try disabling firewall temporarily
5. Check router AP isolation settings

**The backend is ready and waiting! 🚀**
