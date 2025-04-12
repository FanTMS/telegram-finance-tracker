/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_DATABASE_URL: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Default Firebase Configuration Constants
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VITE_FIREBASE_API_KEY: "AIzaSyDZET1nIwIJQ1NBnlI4HWVh6witaW1aedw";
      VITE_FIREBASE_AUTH_DOMAIN: "telegram-anonymous-chat.firebaseapp.com";
      VITE_FIREBASE_DATABASE_URL: "https://telegram-anonymous-chat-default-rtdb.firebaseio.com";
      VITE_FIREBASE_PROJECT_ID: "telegram-anonymous-chat";
      VITE_FIREBASE_STORAGE_BUCKET: "telegram-anonymous-chat.firebasestorage.app";
      VITE_FIREBASE_MESSAGING_SENDER_ID: "104244896244";
      VITE_FIREBASE_APP_ID: "1:104244896244:web:a7fa70cbfe44ee9aaf59a1";
      VITE_FIREBASE_MEASUREMENT_ID: "G-X22H62VY9C";
    }
  }
} 