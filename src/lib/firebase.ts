import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBFcN4j-zcjqnjhoOPAdo7FLjIyBqtfN20",
  authDomain: "smart-classroom-3a3d1.firebaseapp.com",
  projectId: "smart-classroom-3a3d1",
  storageBucket: "smart-classroom-3a3d1.firebasestorage.app",
  messagingSenderId: "257963675231",
  appId: "1:257963675231:web:35378a137d8f69aee695ea",
  measurementId: "G-K24T3XSH14"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, googleProvider, db, storage };
