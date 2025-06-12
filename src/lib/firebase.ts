import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOZa3hzyaU7UoivyvnP6-lkn-Fw6BWZ7U",
  authDomain: "gbillp.firebaseapp.com",
  projectId: "gbillp",
  storageBucket: "gbillp.firebasestorage.app", // Update this line
  messagingSenderId: "424697149924",
  appId: "1:424697149924:web:ac56b85b4999bbb9c12ff1"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };