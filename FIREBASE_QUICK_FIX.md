# Quick Fix for Firebase Configuration Error

## ✅ Your Firebase Config Looks Good!

I can see you've already added your Firebase credentials to `firebase.js`. The error `auth/configuration-not-found` usually means:

1. **Authentication is not enabled** in Firebase Console
2. **Firestore database is not created**
3. **API key restrictions** (less common)

---

## 🔧 Quick Fix Steps

### Step 1: Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **geo-location-ams**
3. Click **"Authentication"** in left sidebar
4. Click **"Get started"** (if you see this button)
5. Go to **"Sign-in method"** tab
6. Click on **"Email/Password"**
7. Toggle **"Enable"** to ON
8. Click **"Save"**

### Step 2: Create Firestore Database

1. In Firebase Console, click **"Firestore Database"** (left sidebar)
2. Click **"Create database"** (if you see this)
3. Select **"Start in test mode"** (for now)
4. Choose a location (closest to you)
5. Click **"Enable"**
6. Wait for database to be created (takes ~30 seconds)

### Step 3: Restart Dev Server

After enabling Authentication and Firestore:

1. **Stop the dev server** (Press `Ctrl+C` in terminal)
2. **Start it again**:
   ```bash
   npm run dev
   ```
3. **Refresh browser** (or open http://localhost:3000)

---

## ✅ Verification Checklist

After completing the steps above:

- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Dev server restarted
- [ ] Browser refreshed
- [ ] No errors in browser console (F12)

---

## 🎯 Test It

1. Open http://localhost:3000
2. Try to **Sign Up** with:
   - Email: `test@example.com`
   - Password: `test123456`
   - Name: `Test User`
3. If it works → ✅ **Firebase is configured correctly!**

---

## 🐛 Still Getting Errors?

### Check Browser Console (F12)

Look for specific error messages:

- **"auth/configuration-not-found"** → Authentication not enabled
- **"permission-denied"** → Firestore not created or rules not deployed
- **"api-key-not-valid"** → Check API key in Firebase Console

### Common Issues:

1. **Authentication not enabled** → Follow Step 1 above
2. **Firestore not created** → Follow Step 2 above
3. **API key restrictions** → Check Firebase Console > Project Settings > API Keys

---

## 📝 Your Current Config

Your `firebase.js` has:
- ✅ API Key: Present
- ✅ Auth Domain: `geo-location-ams.firebaseapp.com`
- ✅ Project ID: `geo-location-ams`
- ✅ All required fields

**The config is correct!** You just need to enable the services in Firebase Console.

---

## 🚀 Next Steps After Fix

Once Authentication and Firestore are enabled:

1. ✅ Sign up works
2. ✅ Login works
3. ✅ Can mark attendance
4. ✅ Data saves to Firestore

Then you can:
- Set up a manager account (edit role in Firestore)
- Configure geo-fence settings
- Test all features

---

**Most likely fix:** Enable Authentication and create Firestore database in Firebase Console!

