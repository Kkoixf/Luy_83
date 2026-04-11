import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyAuXzJEhdKVRFJ6CEz9rqPs9ZWlKZyf_Ug',
  authDomain: 'luy-83.firebaseapp.com',
  projectId: 'luy-83',
  storageBucket: 'luy-83.firebasestorage.app',
  messagingSenderId: '566013437219',
  appId: '1:566013437219:web:0197ec28118d8047bf9896',
  measurementId: 'G-2Z055Q2ZCJ'
};

// Inicializar Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
