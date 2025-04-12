import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDZET1nIwIJQ1NBnlI4HWVh6witaW1aedw",
  authDomain: "telegram-anonymous-chat.firebaseapp.com",
  databaseURL: "https://telegram-anonymous-chat-default-rtdb.firebaseio.com",
  projectId: "telegram-anonymous-chat",
  storageBucket: "telegram-anonymous-chat.firebasestorage.app",
  messagingSenderId: "104244896244",
  appId: "1:104244896244:web:a7fa70cbfe44ee9aaf59a1",
  measurementId: "G-X22H62VY9C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence for development
const EMULATORS_ENABLED = false; // Disable emulators to use real Firebase

if (EMULATORS_ENABLED) {
  try {
    // Connect to Firebase emulators for local development
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.error('Failed to connect to Firebase emulators:', error);
  }
}

export { app, db, auth }; 