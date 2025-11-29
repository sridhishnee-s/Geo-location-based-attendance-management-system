# Firebase Setup Guide - Step by Step

## 🚨 Current Error
You're seeing: `auth/configuration-not-found` or `auth/api-key-not-valid`

This means Firebase credentials are not configured. Follow these steps:

---

## 📋 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"** or **"Create a Project"**
3. Enter project name: `geo-location-attendance` (or any name)
4. Click **Continue**
5. Disable Google Analytics (optional) or enable it
6. Click **Create Project**
7. Wait for project to be created
8. Click **Continue**

---

## 🔐 Step 2: Get Firebase Configuration

1. In Firebase Console, click the **⚙️ Gear icon** (top left)
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`)
5. Register app:
   - App nickname: `Geo Location Attendance` (optional)
   - Check "Also set up Firebase Hosting" (optional)
   - Click **Register app**
6. **Copy the config object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## ⚙️ Step 3: Configure in Your Project

### Option A: Using .env file (Recommended)

1. Create a file named `.env` in the root directory (same level as `package.json`)
2. Add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Important:** 
- Replace the values with YOUR actual Firebase config
- No quotes around values
- No spaces around `=`

3. **Restart the dev server** (stop with Ctrl+C, then run `npm run dev` again)

### Option B: Direct Configuration

Edit `src/config/firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",  // Your actual API key
  authDomain: "your-project.firebaseapp.com",     // Your actual domain
  projectId: "your-project-id",                  // Your actual project ID
  storageBucket: "your-project.appspot.com",      // Your actual bucket
  messagingSenderId: "123456789012",              // Your actual sender ID
  appId: "1:123456789012:web:abcdef123456"        // Your actual app ID
}
```

---

## 🔑 Step 4: Enable Authentication

1. In Firebase Console, go to **"Authentication"** (left sidebar)
2. Click **"Get started"** (if first time)
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"**:
   - Click on "Email/Password"
   - Toggle **Enable**
   - Click **Save**
5. (Optional) Enable **"Google"**:
   - Click on "Google"
   - Toggle **Enable**
   - Enter support email
   - Click **Save**

---

## 💾 Step 5: Create Firestore Database

1. In Firebase Console, go to **"Firestore Database"** (left sidebar)
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
   - ⚠️ **Important:** Deploy security rules later for production
4. Choose a location (closest to you)
5. Click **"Enable"**
6. Wait for database to be created

---

## 🔒 Step 6: Deploy Security Rules (Important!)

1. Install Firebase CLI (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase (if not done):
   ```bash
   firebase init
   ```
   - Select **Firestore** and **Hosting**
   - Select your project
   - Use default settings

4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## ✅ Step 7: Verify Configuration

1. **Restart dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Open browser**: http://localhost:3000

3. **Check browser console** (F12):
   - Should see no Firebase errors
   - Should see Firebase initialized

4. **Test sign up**:
   - Try creating an account
   - Should work without errors

---

## 🎯 Quick Checklist

- [ ] Firebase project created
- [ ] Web app registered in Firebase
- [ ] Config copied from Firebase Console
- [ ] `.env` file created OR `firebase.js` updated
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Dev server restarted
- [ ] No errors in browser console

---

## 🐛 Troubleshooting

### Error: "api-key-not-valid"
- ✅ Check you copied the correct API key
- ✅ Make sure no extra spaces in `.env` file
- ✅ Restart dev server after changes

### Error: "configuration-not-found"
- ✅ Check `.env` file exists in root directory
- ✅ Check variable names start with `VITE_`
- ✅ Restart dev server

### Error: "permission-denied" (Firestore)
- ✅ Deploy security rules: `firebase deploy --only firestore:rules`
- ✅ Check Firestore is created

### Still not working?
1. Check browser console (F12) for specific error
2. Verify `.env` file is in root (not in `src/`)
3. Make sure dev server was restarted
4. Check Firebase project is active in console

---

## 📝 Example .env File

Create `.env` in root directory:

```env
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
VITE_FIREBASE_AUTH_DOMAIN=my-attendance-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-attendance-app
VITE_FIREBASE_STORAGE_BUCKET=my-attendance-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

**Replace with YOUR actual values from Firebase Console!**

---

## 🚀 After Setup

Once configured:
1. ✅ App should load without errors
2. ✅ Can sign up/login
3. ✅ Can mark attendance
4. ✅ Data saves to Firestore

Need help? Check the error message in browser console (F12) for specific details.

