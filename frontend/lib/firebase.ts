import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyApO57quHKLry12D_g_VsrVttyT0e9BApo",
  authDomain: "job-platform-80aa5.firebaseapp.com",
  projectId: "job-platform-80aa5",
  storageBucket: "job-platform-80aa5.firebasestorage.app",
  messagingSenderId: "331779445525",
  appId: "1:331779445525:web:8d67c686d5eab649b98f1c"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Optional: Customize Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, googleProvider };
