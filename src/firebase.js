// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Add if using Storage
// import { getStorage } from 'firebase/storage'; // Add if using Storage

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4tEb0bVdqul9FZLTDS2eb3cERDBZP0cI",
  authDomain: "furwell-12425.firebaseapp.com",
  projectId: "furwell-12425",
  storageBucket: "furwell-12425.firebasestorage.app",
  messagingSenderId: "932232556250",
  appId: "1:932232556250:web:9b658ff5ae977aa055bfe3"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage();
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();