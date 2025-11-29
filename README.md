# Geo-Location Based Attendance Tracking System

A web-based attendance management system that marks attendance only when users are physically present within an allowed geo-location boundary. Built with React.js, Firebase Authentication, Firestore, and HTML5 Geolocation API.

## 🚀 Features

### Core Features
- **User Authentication**
  - Firebase Email/Password authentication
  - Google Sign-in integration
  - Role-based access control (Employee & Manager/Admin)

- **Geo-Location Attendance Marking**
  - HTML5 Geolocation API integration
  - Real-time location capture (Latitude, Longitude, Timestamp)
  - Geo-fencing validation (radius-based check)
  - Prevents duplicate attendance for the same day

- **Employee Interface**
  - Simple "Mark Attendance" button
  - Current location coordinates display
  - Success/failure messages based on geo-location validation
  - Personal attendance history view
  - Attendance statistics

- **Manager/Admin Dashboard**
  - Live attendance logs
  - Punctuality & check-in pattern monitoring
  - Filter reports by date, user, or department
  - Export attendance as CSV/Excel
  - Interactive charts (Daily trends, Hourly distribution)
  - Geo-fence configuration settings

- **Data Handling**
  - Firestore collections: `users`, `attendance_records`, `settings`
  - Secure data with Firebase security rules
  - Real-time updates via Firestore listeners

- **UI/UX**
  - Clean, responsive UI with TailwindCSS
  - Dashboard charts using Recharts
  - Real-time attendance updates
  - Mobile-friendly design

## 📁 Project Structure

```
Geo-location AMS/
├── public/
├── src/
│   ├── components/
│   │   ├── AttendanceButton.jsx       # Main attendance marking component
│   │   ├── AttendanceCharts.jsx       # Charts for manager dashboard
│   │   ├── AttendanceHistory.jsx      # Employee attendance history
│   │   ├── AttendanceTable.jsx        # Manager attendance table
│   │   ├── GeoFenceSettings.jsx      # Geo-fence configuration
│   │   ├── LocationFetcher.jsx        # Location fetching component
│   │   └── ProtectedRoute.jsx         # Route protection component
│   ├── contexts/
│   │   └── AuthContext.jsx            # Authentication context
│   ├── pages/
│   │   ├── EmployeeDashboard.jsx      # Employee dashboard page
│   │   ├── Login.jsx                  # Login/Signup page
│   │   ├── ManagerDashboard.jsx       # Manager dashboard page
│   │   └── NotFound.jsx               # 404 page
│   ├── utils/
│   │   ├── attendance.js              # Attendance CRUD operations
│   │   ├── export.js                  # CSV/Excel export utilities
│   │   └── geofence.js                # Geo-fence validation logic
│   ├── config/
│   │   └── firebase.js                # Firebase configuration
│   ├── App.jsx                         # Main app component
│   ├── main.jsx                        # Entry point
│   └── index.css                      # Global styles
├── firebase.json                       # Firebase hosting config
├── firestore.rules                     # Firestore security rules
├── firestore.indexes.json              # Firestore indexes
├── package.json                        # Dependencies
├── vite.config.js                      # Vite configuration
├── tailwind.config.js                  # TailwindCSS configuration
├── postcss.config.js                   # PostCSS configuration
└── README.md                           # This file
```

## 🛠️ Tech Stack

- **Frontend Framework**: React.js 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Authentication**: Firebase Authentication
- **Database**: Cloud Firestore
- **Charts**: Recharts
- **Routing**: React Router DOM
- **Notifications**: React Hot Toast
- **Export**: XLSX
- **Date Handling**: date-fns
- **Hosting**: Firebase Hosting

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd "Geo-location AMS"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database

2. **Get Firebase Configuration**
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on the Web icon (`</>`)
   - Copy the Firebase configuration object

3. **Configure Environment Variables**
   - Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

   Alternatively, you can directly edit `src/config/firebase.js` with your Firebase credentials.

### Step 4: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 5: Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🚀 Deployment

### Deploy to Firebase Hosting

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done)
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Select your Firebase project
   - Set public directory as `dist`
   - Configure as single-page app: Yes
   - Don't overwrite index.html: No

4. **Build the Project**
   ```bash
   npm run build
   ```

5. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

## 🔐 Security Rules

The Firestore security rules are configured in `firestore.rules`:
- Users can only read their own data (unless they're managers)
- Only managers can read all attendance records
- Users can only create attendance records for themselves
- Only managers can modify/delete records

## 📱 Usage

### For Employees
1. Sign up or log in with email/password or Google
2. Navigate to Employee Dashboard
3. Click "Get Current Location" to fetch your location
4. Click "Mark Attendance" to record your attendance
5. View your attendance history and statistics

### For Managers
1. Sign up or log in (manually set role to 'manager' in Firestore)
2. Navigate to Manager Dashboard
3. Configure geo-fence settings (center coordinates and radius)
4. View all attendance records with filters
5. Analyze attendance patterns with charts
6. Export attendance data as CSV or Excel

## 🎯 Setting Up Manager Role

To set a user as a manager:
1. Go to Firebase Console > Firestore Database
2. Navigate to `users` collection
3. Find the user document
4. Edit the document and set `role` field to `"manager"`

## 🔧 Configuration

### Geo-Fence Settings
Managers can configure the allowed attendance area:
- **Center Latitude/Longitude**: The center point of the allowed area
- **Radius**: The allowed radius in meters

Users must be within this radius to successfully mark attendance.

## 📊 Features in Detail

### Attendance Marking
- Prevents duplicate attendance for the same day
- Validates location against geo-fence
- Records timestamp, coordinates, and accuracy
- Shows success/failure messages

### Dashboard Charts
- **Daily Attendance Trend**: Line chart showing attendance over time
- **Hourly Distribution**: Bar chart showing attendance by hour

### Export Functionality
- Export filtered attendance data to CSV
- Export filtered attendance data to Excel
- Includes all relevant fields (date, time, user, location, etc.)

## 🐛 Troubleshooting

### Location Not Working
- Ensure HTTPS is enabled (required for geolocation)
- Check browser permissions for location access
- Verify device has location services enabled

### Firebase Errors
- Verify Firebase configuration in `.env` or `firebase.js`
- Check Firestore security rules
- Ensure Authentication is enabled in Firebase Console

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For support, please open an issue in the repository.

---

**Built with ❤️ using React, Firebase, and TailwindCSS**

