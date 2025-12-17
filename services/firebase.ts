// services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// 🔴 请确认这里的 Config 是你自己 Firebase 的
const firebaseConfig = {
  apiKey: "AIzaSyBl1AK3sDz5BhEZLuN4Y_hjvslL7ZnMGNs",
  authDomain: "beyondme-d84d5.firebaseapp.com",
  projectId: "beyondme-d84d5",
  storageBucket: "beyondme-d84d5.firebasestorage.app",
  messagingSenderId: "65368376178",
  appId: "1:65368376178:web:c8cb65af370ca53397d3eb",
  measurementId: "G-B2V0B00E1Y"
};

// 初始化
const app = initializeApp(firebaseConfig);

// 关键！这里必须导出，App.tsx 才能用到
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);