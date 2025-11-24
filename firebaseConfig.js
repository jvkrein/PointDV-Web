import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence // Importar persistência web
  ,
  getReactNativePersistence,
  initializeAuth
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native'; // Importar Platform para verificar onde está rodando

// Configuração do .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Inicializa o app
const app = initializeApp(firebaseConfig);

// Lógica condicional para Persistência (Web vs Native)
let auth;

if (Platform.OS === 'web') {
  // Se for Web, usa a persistência do navegador
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} else {
  // Se for Celular (Android/iOS), usa o AsyncStorage
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

export const db = getFirestore(app);
export { auth };
export default app;