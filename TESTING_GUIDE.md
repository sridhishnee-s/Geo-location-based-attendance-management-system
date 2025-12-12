# Testing Guide - How to Verify the Application is Working

## 🚀 Quick Test Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Firebase (Required)
Before running, you MUST set up Firebase:

1. **Create `.env` file** in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

2. **Or edit `src/config/firebase.js`** directly with your Firebase credentials

### Step 3: Start the Development Server
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 4: Open in Browser
Visit: **http://localhost:3000**

---

## ✅ What to Check - Step by Step

### 1. **Application Loads**
- ✅ Browser opens to login page
- ✅ No console errors (check browser DevTools: F12)
- ✅ UI looks clean and styled (TailwindCSS working)

### 2. **Firebase Connection**
Open browser console (F12) and check:
- ❌ If you see Firebase errors → Check your `.env` file
- ✅ If no errors → Firebase is connected

### 3. **Authentication Test**

#### Test Sign Up:
1. Click "Don't have an account? Sign up"
2. Enter:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `test123456`
3. Click "Sign Up"
4. ✅ Should see success toast and redirect to dashboard

#### Test Login:
1. Logout (if logged in)
2. Enter email and password
3. Click "Sign In"
4. ✅ Should redirect to Employee Dashboard

#### Test Google Login:
1. Click "Sign in with Google"
2. ✅ Should open Google popup
3. Select account
4. ✅ Should redirect to dashboard

### 4. **Employee Dashboard Test**

Once logged in as employee:

#### Test Location Fetching:
1. Click **"Get Current Location"** button
2. ✅ Browser should ask for location permission
3. Allow location access
4. ✅ Should see coordinates displayed:
   - Latitude: XX.XXXXXX
   - Longitude: XX.XXXXXX
   - Accuracy: XX meters

#### Test Attendance Marking:
1. After fetching location, click **"Mark Attendance"**
2. ✅ Should see success message: "Attendance marked successfully!"
3. ✅ Location should reset
4. ✅ Attendance should appear in history table below

#### Test Attendance History:
1. Scroll to "Your Attendance History"
2. ✅ Should see your attendance record:
   - Date & Time
   - Location coordinates
   - Status: "present"
   - Validated: "✓ Valid" or "✗ Invalid"

#### Test Stats Cards:
1. Check the three stat cards at bottom
2. ✅ Total Attendance: Should show count
3. ✅ This Month: Should show monthly count
4. ✅ Last Attendance: Should show last date/time

### 5. **Manager Dashboard Test**

#### First, Set Yourself as Manager:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database**
3. Go to `users` collection
4. Find your user document (by email)
5. Click to edit
6. Change `role` field from `"employee"` to `"manager"`
7. Save

#### Test Manager Access:
1. Refresh the app (or logout and login again)
2. ✅ Should redirect to `/manager/dashboard`
3. ✅ Should see "Manager Dashboard" header

#### Test Geo-Fence Settings:
1. Scroll to "Geo-Fence Settings"
2. Click **"Use Current Location"**
3. ✅ Should fetch your current location
4. Enter radius: `100` (meters)
5. Click **"Save Settings"**
6. ✅ Should see success message

#### Test Filters:
1. Set Start Date and End Date
2. Enter a User ID (optional)
3. ✅ Table should filter records
4. Click "Clear Filters"
5. ✅ Should reset filters

#### Test Charts:
1. Scroll to charts section
2. ✅ Should see two charts:
   - Daily Attendance Trend (Line Chart)
   - Hourly Distribution (Bar Chart)
3. ✅ Charts should show data if attendance records exist

#### Test Export:
1. Apply some filters (optional)
2. Click **"Export to CSV"**
3. ✅ Should download CSV file
4. Click **"Export to Excel"**
5. ✅ Should download XLSX file

#### Test Attendance Table:
1. Scroll to "Attendance Records"
2. ✅ Should see table with columns:
   - Date & Time
   - User ID
   - Location
   - Accuracy
   - Status
   - Validated
3. ✅ Should show all attendance records

### 6. **Geo-Fence Validation Test**

#### Test Inside Geo-Fence:
1. As Manager: Set geo-fence with your current location, radius 100m
2. As Employee: Mark attendance from same location
3. ✅ Should succeed: "Attendance marked successfully!"

#### Test Outside Geo-Fence:
1. As Manager: Set geo-fence with location far away, radius 50m
2. As Employee: Try to mark attendance from your location
3. ✅ Should fail: "You are outside the allowed area..."

### 7. **Real-time Updates Test**
1. Open app in two browser windows
2. Mark attendance in one window
3. ✅ Other window should update automatically (if using Firestore listeners)

---

## 🔍 Troubleshooting Checklist

### Application Won't Start
- [ ] Run `npm install` first
- [ ] Check Node.js version: `node --version` (should be v16+)
- [ ] Check for port conflicts (3000 already in use?)

### Firebase Errors
- [ ] Check `.env` file exists and has correct values
- [ ] Verify Firebase project is created
- [ ] Check Authentication is enabled in Firebase Console
- [ ] Verify Firestore database is created
- [ ] Check browser console for specific error messages

### Location Not Working
- [ ] Check browser location permissions (click lock icon in address bar)
- [ ] Verify you're on HTTPS or localhost (required for geolocation)
- [ ] Check device location services are enabled
- [ ] Try different browser (Chrome, Firefox, Edge)

### Authentication Not Working
- [ ] Check Firebase Authentication is enabled
- [ ] Verify Email/Password provider is enabled
- [ ] For Google login: Check Google provider is enabled
- [ ] Check browser console for errors

### No Data Showing
- [ ] Check Firestore security rules are deployed
- [ ] Verify you're logged in
- [ ] Check browser console for permission errors
- [ ] Verify Firestore indexes are created (if needed)

### Styling Issues
- [ ] Check TailwindCSS is installed: `npm list tailwindcss`
- [ ] Verify `index.css` imports Tailwind
- [ ] Check browser console for CSS errors

---

## 🧪 Quick Test Script

Run these commands to verify setup:

```bash
# 1. Check Node.js
node --version

# 2. Check npm
npm --version

# 3. Install dependencies
npm install

# 4. Check if Firebase config exists
cat .env  # or type .env in Windows

# 5. Start dev server
npm run dev

# 6. Build test (optional)
npm run build
```

---

## 📊 Expected Console Output

### Successful Start:
```
VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Browser Console (No Errors):
- Should be clean, no red errors
- Firebase connection messages (if any) should be info level

### Network Tab:
- Firebase API calls should return 200 status
- No CORS errors
- No 404 errors for assets

---

## ✅ Success Indicators

Your app is working correctly if:

1. ✅ Login page loads without errors
2. ✅ Can sign up and login
3. ✅ Can fetch location successfully
4. ✅ Can mark attendance
5. ✅ Attendance appears in history
6. ✅ Manager dashboard shows data
7. ✅ Charts render correctly
8. ✅ Export functions work
9. ✅ Geo-fence validation works
10. ✅ No console errors

---

## 🎯 Quick Verification Commands

```bash
# Check if server is running
curl http://localhost:3000

# Check Firebase connection (in browser console)
# Type: firebase.apps.length
# Should return: 1

# Check if user is authenticated (in browser console)
# Type: firebase.auth().currentUser
# Should return user object if logged in
```

---

## 📝 Testing Checklist

Print this and check off as you test:

- [ ] App starts without errors
- [ ] Login page displays correctly
- [ ] Can create new account
- [ ] Can login with email/password
- [ ] Can login with Google
- [ ] Employee dashboard loads
- [ ] Location fetching works
- [ ] Attendance marking works
- [ ] Attendance history displays
- [ ] Stats cards show data
- [ ] Manager role can be set
- [ ] Manager dashboard loads
- [ ] Geo-fence settings work
- [ ] Filters work
- [ ] Charts display
- [ ] Export CSV works
- [ ] Export Excel works
- [ ] Geo-fence validation works
- [ ] No console errors
- [ ] Responsive design works (mobile/tablet)

---

**If all checks pass, your application is working correctly! 🎉**


