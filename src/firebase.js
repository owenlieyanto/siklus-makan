import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tempelkan objek firebaseConfig dari Firebase Console di sini
const firebaseConfig = {
  apiKey: "AIzaSyA6eAi5J2TnY7hUnos5wEN-L3T8deLCw_4",
  authDomain: "siklus-makan.firebaseapp.com",
  projectId: "siklus-makan",
  storageBucket: "siklus-makan.firebasestorage.app",
  messagingSenderId: "694662590817",
  appId: "1:694662590817:web:af7c57e5e222f7731e1520"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);