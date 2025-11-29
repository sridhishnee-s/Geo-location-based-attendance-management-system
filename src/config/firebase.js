import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyDxTaKbqWLPMPKPCsRz5nvFnqwpMIutqMk",
  authDomain: "geo-location-ams.firebaseapp.com",
  projectId: "geo-location-ams",
  storageBucket: "geo-location-ams.firebasestorage.app",
  messagingSenderId: "774103521300",
  appId: "1:774103521300:web:ff24549a31f2c8babfaf01",
  measurementId: "G-XVJY9B3EZS"}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

export default app

