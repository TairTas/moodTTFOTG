import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC8IAyYNAoQkr96s758rHfi7aFYwOR-c_M",
  authDomain: "feelingsttfotg.firebaseapp.com",
  projectId: "feelingsttfotg",
  storageBucket: "feelingsttfotg.firebasestorage.app",
  messagingSenderId: "836784184828",
  appId: "1:836784184828:web:3c9f5db9c0b1a0bb8fa679"
};

// Initialize App (Compat)
const app = firebase.initializeApp(firebaseConfig);

// Auth (Compat)
export const auth = firebase.auth();

// Database (Modular) - using compat app instance
export const db = getDatabase(app as any);
