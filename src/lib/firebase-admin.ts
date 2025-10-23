import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Processa a chave privada para garantir que esteja no formato correto
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

// Limpa qualquer tipo de aspas (simples ou duplas) no início e fim
privateKey = privateKey.replace(/^["']|["']$/g, '');

// Se a chave contém \n LITERAL (como string), converte para quebras reais
// Mas se já tem quebras reais (como vem do Vercel), não faz nada
if (privateKey.includes('\\n')) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}

const firebaseAdminConfig: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: privateKey,
};

// Inicializa o Firebase Admin apenas se ainda não foi inicializado
if (getApps().length === 0) {
  try {
    console.log('[firebase-admin] Iniciando Firebase Admin...');
    console.log('[firebase-admin] FIREBASE_PROJECT_ID=', firebaseAdminConfig.projectId ? 'OK' : 'MISSING');
    console.log('[firebase-admin] FIREBASE_CLIENT_EMAIL=', firebaseAdminConfig.clientEmail ? 'OK' : 'MISSING');
    console.log('[firebase-admin] FIREBASE_PRIVATE_KEY=', privateKey ? `OK (length: ${privateKey.length}, starts: ${privateKey.substring(0, 30)}...)` : 'MISSING');
    
    if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
      throw new Error('Firebase Admin credentials are incomplete. Check your environment variables.');
    }
    
    initializeApp({
      credential: cert(firebaseAdminConfig),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
    console.log('[firebase-admin] Inicialização concluída.');
  } catch (err) {
    console.error('[firebase-admin] Erro ao inicializar Firebase Admin:', err);
    throw err;
  }
}

export const auth = getAuth();
export const storage = getStorage();