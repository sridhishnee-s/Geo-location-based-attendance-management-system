# Quick Verification Steps

## ✅ Step 1: Check if Dependencies are Installed
```bash
npm list --depth=0
```
If you see packages listed, dependencies are installed ✓

## ✅ Step 2: Configure Firebase (REQUIRED)

**Option A: Create `.env` file** (Recommended)
Create a file named `.env` in the root directory with:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

**Option B: Edit `src/config/firebase.js` directly**
Replace the placeholder values with your Firebase credentials.

## ✅ Step 3: Start the Development Server
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```

## ✅ Step 4: Open Browser
1. Open: **http://localhost:3000**
2. You should see the **Login page**

## ✅ Step 5: Test Authentication

### Quick Test (Without Firebase):
Even without Firebase configured, you can verify:
- ✅ Page loads without errors
- ✅ UI is styled (TailwindCSS working)
- ✅ Forms are visible
- ❌ But authentication won't work (needs Firebase)

### Full Test (With Firebase):
1. **Sign Up**: Create a new account
2. **Login**: Sign in with your credentials
3. **Dashboard**: Should redirect to Employee Dashboard
4. **Location**: Click "Get Current Location" (allow permission)
5. **Mark Attendance**: Click "Mark Attendance"
6. **View History**: Check attendance appears in table

## 🔍 What to Check in Browser Console (F12)

### If Working Correctly:
- ✅ No red errors
- ✅ Firebase connection messages (if configured)
- ✅ Network requests return 200 status

### If Not Working:
- ❌ Firebase errors → Check `.env` file
- ❌ Module not found → Run `npm install`
- ❌ Port in use → Change port in `vite.config.js`

## 🎯 Quick Status Check

Run this to see current status:
```bash
# Check if node_modules exists
Test-Path node_modules

# Check if .env exists  
Test-Path .env

# Check package.json
Get-Content package.json | Select-String "name"
```

## 📱 Visual Verification Checklist

When you open http://localhost:3000, you should see:

- [ ] **Login Page** with:
  - [ ] Email input field
  - [ ] Password input field
  - [ ] "Sign In" button
  - [ ] "Sign in with Google" button
  - [ ] "Don't have an account? Sign up" link
  - [ ] Blue gradient background
  - [ ] Clean, modern UI

If you see this, the **frontend is working** ✓

If you see errors or blank page:
- Check browser console (F12)
- Check terminal for build errors
- Verify all files are in place

## 🚨 Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "Cannot find module" | Run `npm install` |
| "Port 3000 already in use" | Change port in `vite.config.js` or kill process |
| "Firebase: Error" | Check `.env` file or `firebase.js` config |
| Blank page | Check browser console for errors |
| "Location not available" | Allow browser location permission |

## ✅ Success Indicators

Your app is working if:
1. ✅ Server starts without errors
2. ✅ Browser shows login page
3. ✅ No console errors (F12)
4. ✅ UI is styled and responsive
5. ✅ Can interact with forms (even if Firebase not configured yet)

---

**Next Steps:**
1. If frontend loads → Configure Firebase to test full functionality
2. If errors → Check browser console and terminal output
3. See `TESTING_GUIDE.md` for detailed testing steps

