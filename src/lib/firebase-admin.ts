import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Inicializa o Firebase Admin apenas se ainda não foi inicializado
if (getApps().length === 0) {
  try {
    console.log('[firebase-admin] Iniciando Firebase Admin...');
    console.log('[firebase-admin] FIREBASE_PROJECT_ID=', process.env.FIREBASE_PROJECT_ID ? 'OK' : 'MISSING');
    console.log('[firebase-admin] FIREBASE_CLIENT_EMAIL=', process.env.FIREBASE_CLIENT_EMAIL ? 'OK' : 'MISSING');
    console.log('[firebase-admin] FIREBASE_PRIVATE_KEY=', process.env.FIREBASE_PRIVATE_KEY ? 'OK' : 'MISSING');
    initializeApp({
      credential: cert(firebaseAdminConfig),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
    console.log('[firebase-admin] Inicialização concluída.');
  } catch (err) {
    console.error('[firebase-admin] Erro ao inicializar Firebase Admin:', err);
    throw err; // rethrow para que o servidor falhe rápido e o log apareça
  }
}

export const auth = getAuth();
export const storage = getStorage();