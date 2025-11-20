import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validação simples das variáveis de ambiente cliente (NEXT_PUBLIC_*) para dar mensagens
// de erro mais claras em tempo de execução.
try {
  console.log('[firebase] Verificando variáveis NEXT_PUBLIC_FIREBASE_*');
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  if (missing.length) {
    const msg = `[firebase] Variáveis de ambiente faltando: ${missing.join(', ')}.`;
    // Log para o terminal (server-side) e para o console do browser (client-side)
    console.error(msg);
    // Não lançar aqui; lançamos uma exceção somente se initializeApp falhar, mas o log
    // já ajuda a diagnosticar o problema (auth/invalid-api-key vem quando apiKey está ausente/errada).
  } else {
    console.log('[firebase] Todas as variáveis NEXT_PUBLIC_FIREBASE_* estão presentes.');
  }
} catch (err) {
  console.warn('[firebase] Erro ao checar variáveis de ambiente:', err);
}

// Inicializa o Firebase
let appInstance;
try {
  appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (err) {
  console.error('[firebase] Falha ao inicializar Firebase client:', err);
  // Re-lançar com mensagem mais clara para o usuário
  throw new Error(`Falha ao inicializar Firebase client. Verifique suas variáveis NEXT_PUBLIC_FIREBASE_*. Erro original: ${(err as Error).message}`);
}

const auth = getAuth(appInstance);
// Garante persistência local do login
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error('[firebase] Erro ao definir persistência do Auth:', err);
  });
}
const db = getFirestore(appInstance);
const storage = getStorage(appInstance);
const functions = getFunctions(appInstance);

// CONEXÃO COM O EMULADOR (só roda em ambiente de desenvolvimento)
if (typeof window !== 'undefined' && 
    window.location.hostname === "localhost" && 
    process.env.NODE_ENV === 'development') {
  try {
    console.log("Conectando aos emuladores do Firebase...");
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  } catch (error) {
    console.warn("Erro ao conectar aos emuladores:", error);
  }
}

export { appInstance as app, auth, db, storage, functions };