import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';

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
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  privateKey: privateKey,
};

// Função para inicializar Firebase Admin sob demanda
function initializeFirebaseAdmin() {
  // Não inicializa durante build time
  if (process.env.NODE_ENV === 'production' && !firebaseAdminConfig.projectId) {
    console.log('[firebase-admin] Skipping initialization during build');
    return;
  }

  if (getApps().length === 0) {
    try {
      console.log('[firebase-admin] Iniciando Firebase Admin...');
      console.log('[firebase-admin] FIREBASE_PROJECT_ID=', firebaseAdminConfig.projectId ? 'OK' : 'MISSING');
      console.log('[firebase-admin] FIREBASE_CLIENT_EMAIL=', firebaseAdminConfig.clientEmail ? 'OK' : 'MISSING');
      console.log('[firebase-admin] FIREBASE_PRIVATE_KEY=', privateKey ? `OK (length: ${privateKey.length})` : 'MISSING');
      
      if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
        const missing = [];
        if (!firebaseAdminConfig.projectId) missing.push('FIREBASE_PROJECT_ID');
        if (!firebaseAdminConfig.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
        if (!firebaseAdminConfig.privateKey) missing.push('FIREBASE_PRIVATE_KEY');
        throw new Error(`Firebase Admin credentials are incomplete. Missing: ${missing.join(', ')}. Check your environment variables.`);
      }

      // Validação básica da chave privada para evitar erros de "illegal path"
      if (!firebaseAdminConfig.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('FIREBASE_PRIVATE_KEY inválida. A chave deve começar com "-----BEGIN PRIVATE KEY-----". Verifique se o valor está correto.');
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
}

// Helper para garantir inicialização
function ensureInitialized() {
  if (getApps().length === 0) {
    initializeFirebaseAdmin();
  }
}

export function getAdminAuth() {
  ensureInitialized();
  return getAuth();
}

export function getAdminStorage() {
  ensureInitialized();
  return getStorage();
}

export function getAdminFirestore() {
  ensureInitialized();
  return getFirestore();
}

// Exporta funções que inicializam sob demanda (Mantido para compatibilidade, mas prefira getAdminAuth)
export const auth = (() => {
  try {
    // Tenta inicializar, mas não falha se for build time
    if (getApps().length === 0) initializeFirebaseAdmin();
    return getAuth();
  } catch (e) {
    console.warn('[firebase-admin] Falha ao exportar auth (pode ser build time):', e);
    return {} as any;
  }
})();

export const storage = (() => {
  try {
    if (getApps().length === 0) initializeFirebaseAdmin();
    return getStorage();
  } catch (e) {
    console.warn('[firebase-admin] Falha ao exportar storage (pode ser build time):', e);
    return {} as any;
  }
})();

export const db = (() => {
  try {
    if (getApps().length === 0) initializeFirebaseAdmin();
    return getFirestore();
  } catch (e) {
    console.warn('[firebase-admin] Falha ao exportar db (pode ser build time):', e);
    return {} as any;
  }
})();
