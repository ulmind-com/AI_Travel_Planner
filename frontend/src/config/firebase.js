import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCAraMVT1cr05Jhq8F7jhRdmZ-lxvGZtHo",
  authDomain: "ai-travel-planner-d392a.firebaseapp.com",
  projectId: "ai-travel-planner-d392a",
  storageBucket: "ai-travel-planner-d392a.firebasestorage.app",
  messagingSenderId: "571075770817",
  appId: "1:571075770817:web:d25921e0accf315e6bd740",
  measurementId: "G-0QCST3RGZ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
