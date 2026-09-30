import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrM3nPZ_4q-QBK09097v3MOy3GycoQd6U",
  authDomain: "tutordesk-da055.firebaseapp.com",
  projectId: "tutordesk-da055",
  storageBucket: "tutordesk-da055.firebasestorage.app",
  messagingSenderId: "9308780122",
  appId: "1:9308780122:web:594faaf5d1e5735e4b4a63",
  measurementId: "G-3987QYJ1P6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);