# Complete Folder Structure

```
Geo-location AMS/
│
├── 📁 public/                          # Public assets (if any)
│
├── 📁 src/                             # Source code directory
│   │
│   ├── 📁 components/                  # Reusable React components
│   │   ├── AttendanceButton.jsx        # Main attendance marking button
│   │   ├── AttendanceCharts.jsx        # Charts for manager dashboard
│   │   ├── AttendanceHistory.jsx       # Employee attendance history table
│   │   ├── AttendanceTable.jsx         # Manager attendance records table
│   │   ├── GeoFenceSettings.jsx        # Geo-fence configuration component
│   │   ├── LocationFetcher.jsx         # HTML5 Geolocation wrapper
│   │   └── ProtectedRoute.jsx          # Route protection HOC
│   │
│   ├── 📁 contexts/                    # React Context providers
│   │   └── AuthContext.jsx             # Authentication context & hooks
│   │
│   ├── 📁 pages/                       # Page components
│   │   ├── EmployeeDashboard.jsx       # Employee dashboard page
│   │   ├── Login.jsx                   # Login/Signup page
│   │   ├── ManagerDashboard.jsx        # Manager/Admin dashboard
│   │   └── NotFound.jsx                # 404 error page
│   │
│   ├── 📁 utils/                       # Utility functions
│   │   ├── attendance.js                # Attendance CRUD operations
│   │   ├── export.js                   # CSV/Excel export utilities
│   │   └── geofence.js                 # Geo-fence validation logic
│   │
│   ├── 📁 config/                      # Configuration files
│   │   └── firebase.js                 # Firebase initialization
│   │
│   ├── App.jsx                          # Main app component with routing
│   ├── main.jsx                         # React entry point
│   └── index.css                       # Global styles (TailwindCSS)
│
├── 📄 .env                              # Environment variables (create this)
├── 📄 .env.example                      # Environment variables template
├── 📄 .gitignore                        # Git ignore rules
│
├── 📄 firebase.json                     # Firebase hosting configuration
├── 📄 firestore.rules                   # Firestore security rules
├── 📄 firestore.indexes.json            # Firestore indexes
│
├── 📄 index.html                        # HTML entry point
├── 📄 package.json                      # NPM dependencies & scripts
├── 📄 vite.config.js                    # Vite build configuration
├── 📄 tailwind.config.js                # TailwindCSS configuration
├── 📄 postcss.config.js                 # PostCSS configuration
│
├── 📄 README.md                         # Main documentation
├── 📄 QUICK_START.md                    # Quick setup guide
└── 📄 FOLDER_STRUCTURE.md               # This file
```

## File Descriptions

### Configuration Files
- **package.json**: All project dependencies and npm scripts
- **vite.config.js**: Vite bundler configuration
- **tailwind.config.js**: TailwindCSS theme and customization
- **postcss.config.js**: PostCSS plugins configuration
- **firebase.json**: Firebase hosting and Firestore configuration
- **firestore.rules**: Security rules for Firestore database
- **firestore.indexes.json**: Database indexes for query optimization

### Source Files

#### Components (`src/components/`)
- **AttendanceButton.jsx**: Main component for marking attendance with location validation
- **AttendanceCharts.jsx**: Recharts components for visualizing attendance data
- **AttendanceHistory.jsx**: Table view of employee's own attendance records
- **AttendanceTable.jsx**: Manager view of all attendance records with filtering
- **GeoFenceSettings.jsx**: Interface for managers to configure allowed attendance area
- **LocationFetcher.jsx**: Wrapper around HTML5 Geolocation API
- **ProtectedRoute.jsx**: Higher-order component for route protection

#### Pages (`src/pages/`)
- **Login.jsx**: Authentication page (login/signup with email or Google)
- **EmployeeDashboard.jsx**: Employee interface with attendance marking and history
- **ManagerDashboard.jsx**: Manager interface with analytics, filters, and exports
- **NotFound.jsx**: 404 error page

#### Utils (`src/utils/`)
- **attendance.js**: Functions for creating, reading attendance records
- **export.js**: CSV and Excel export functionality
- **geofence.js**: Geo-fence validation using Haversine formula

#### Contexts (`src/contexts/`)
- **AuthContext.jsx**: Authentication state management and methods

#### Config (`src/config/`)
- **firebase.js**: Firebase app initialization and service exports

## Key Features by File

### Authentication Flow
1. User visits `/login` → `Login.jsx`
2. Auth handled by → `AuthContext.jsx`
3. Protected routes → `ProtectedRoute.jsx`
4. Redirects based on role → `App.jsx`

### Attendance Marking Flow
1. Employee clicks "Mark Attendance" → `AttendanceButton.jsx`
2. Fetches location → `LocationFetcher.jsx`
3. Validates geo-fence → `geofence.js`
4. Saves to Firestore → `attendance.js`
5. Updates dashboard → `EmployeeDashboard.jsx`

### Manager Dashboard Flow
1. Manager views dashboard → `ManagerDashboard.jsx`
2. Filters data → `attendance.js`
3. Displays charts → `AttendanceCharts.jsx`
4. Shows table → `AttendanceTable.jsx`
5. Exports data → `export.js`
6. Configures geo-fence → `GeoFenceSettings.jsx`

## Dependencies Overview

### Core
- **react**: UI framework
- **react-dom**: React DOM rendering
- **react-router-dom**: Client-side routing

### Firebase
- **firebase**: Firebase SDK (Auth, Firestore)

### UI & Styling
- **tailwindcss**: Utility-first CSS framework
- **recharts**: Chart library for React

### Utilities
- **date-fns**: Date manipulation
- **react-hot-toast**: Toast notifications
- **xlsx**: Excel file generation

### Build Tools
- **vite**: Fast build tool
- **@vitejs/plugin-react**: Vite React plugin
- **postcss**: CSS processing
- **autoprefixer**: CSS vendor prefixing

## Environment Variables

Create `.env` file with:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Build Output

After `npm run build`, output goes to:
- **dist/**: Production build files (for Firebase Hosting)

## Next Steps

1. Install dependencies: `npm install`
2. Configure Firebase: Add `.env` file
3. Deploy Firestore rules: `firebase deploy --only firestore:rules`
4. Run development: `npm run dev`
5. Build for production: `npm run build`
6. Deploy to Firebase: `firebase deploy --only hosting`

