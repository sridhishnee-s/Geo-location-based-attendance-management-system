# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Firebase

1. **Create Firebase Project**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Follow the setup wizard

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (optional but recommended)

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create Database"
   - Start in test mode (we'll deploy rules later)

4. **Get Your Firebase Config**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click Web icon (`</>`)
   - Register app and copy config

5. **Add Config to Project**
   - Create `.env` file in root directory
   - Add your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### Step 3: Deploy Firestore Rules
```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Firestore and Hosting)
firebase init

# Deploy rules
firebase deploy --only firestore:rules
```

### Step 4: Run the App
```bash
npm run dev
```

Visit `http://localhost:3000` and you're ready to go!

## 👤 Creating Your First Manager Account

1. Sign up with email/password through the app
2. Go to Firebase Console > Firestore Database
3. Navigate to `users` collection
4. Find your user document (by email)
5. Edit the document and change `role` field from `"employee"` to `"manager"`
6. Refresh the app - you'll now have manager access!

## 📍 Setting Up Geo-Fence

1. Log in as a manager
2. Go to Manager Dashboard
3. Scroll to "Geo-Fence Settings"
4. Either:
   - Click "Use Current Location" to set your current location as center
   - Or manually enter coordinates
5. Set the radius (in meters) - e.g., 100m
6. Click "Save Settings"

Now employees must be within this radius to mark attendance!

## 🎯 Testing the System

### As Employee:
1. Sign up/login
2. Go to Employee Dashboard
3. Click "Get Current Location"
4. Click "Mark Attendance"
5. View your attendance history

### As Manager:
1. Set your role to manager (see above)
2. Configure geo-fence
3. View all attendance records
4. Filter by date/user
5. Export data to CSV/Excel
6. View charts and analytics

## ⚠️ Important Notes

- **HTTPS Required**: Geolocation API requires HTTPS in production
- **Browser Permissions**: Users must allow location access
- **Firestore Rules**: Make sure to deploy security rules before production
- **Manager Role**: Must be set manually in Firestore (for security)

## 🐛 Common Issues

**Location not working?**
- Ensure you're using HTTPS (or localhost for development)
- Check browser location permissions
- Verify device location services are enabled

**Firebase errors?**
- Double-check your `.env` file
- Verify Firestore is created and rules are deployed
- Check browser console for specific error messages

**Build errors?**
- Run `npm install` again
- Clear `node_modules` and reinstall
- Check Node.js version (v16+)

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Customize the UI in `src/` components
- Add more features as needed
- Deploy to Firebase Hosting when ready

Happy coding! 🎉


