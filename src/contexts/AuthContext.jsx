import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sign up with email and password
  const signup = async (email, password, name, role = 'employee') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name,
        role: role,
        createdAt: new Date(),
      })

      toast.success('Account created successfully!')
      return user
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      toast.success('Logged in successfully!')
      return userCredential.user
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const user = userCredential.user

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: user.displayName,
          role: 'employee',
          createdAt: new Date(),
        })
      }

      toast.success('Logged in with Google!')
      return user
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth)
      setUserData(null)
      toast.success('Logged out successfully!')
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  // Fetch user data from Firestore
  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        setUserData({ id: userDoc.id, ...userDoc.data() })
        return { id: userDoc.id, ...userDoc.data() }
      }
      return null
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await fetchUserData(user.uid)
      } else {
        setUserData(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userData,
    signup,
    login,
    loginWithGoogle,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

