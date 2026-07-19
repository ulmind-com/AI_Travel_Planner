import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBWMVnaXn2gn8_qpqhrS4EGgOks-tQPlL8",
  authDomain: "adventurenexus-2d97a.firebaseapp.com",
  projectId: "adventurenexus-2d97a",
  storageBucket: "adventurenexus-2d97a.firebasestorage.app",
  messagingSenderId: "42855451170",
  appId: "1:42855451170:web:414f13fe6db65f0395587b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
