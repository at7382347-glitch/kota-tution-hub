import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZMF8Dym_Fq_O6R-qaaBYiC7gsdKOQ1TY",
  authDomain: "kota-tution-hub.firebaseapp.com",
  projectId: "kota-tution-hub",
  storageBucket: "kota-tution-hub.firebasestorage.app",
  messagingSenderId: "1031023769514",
  appId: "1:1031023769514:web:fbe40cca2a2967194b1dd3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Persist login sessions across browser refreshes
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to set auth persistence:", error);
});
