// Firebaseの初期化とAuthインスタンスの取得
import { initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { get } from 'firebase/database';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { dataType } from 'element-plus/es/components/table-v2/src/common';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL,
};

// Firebase Appの初期化
const app = initializeApp(firebaseConfig);

// Firebase AuthenticationとFirestoreのインスタンスを取得
const auth: Auth = getAuth(); // Firebase v10でのAuthインスタンスの取得方法
const db: Firestore = getFirestore(app);
const realtimeDB = getDatabase();

export { auth, db, realtimeDB};
