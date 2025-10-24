'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Definimos o tipo do valor que nosso contexto irá fornecer
interface AuthContextType {
  user: User | null;
  authLoading: boolean;
}

// Criamos o contexto com um valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  authLoading: true,
});

// Criamos o Provedor do Contexto
export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Iniciando listener de autenticação');
    
    // onAuthStateChanged é o listener oficial do Firebase. Ele dispara
    // assim que a autenticação é resolvida (logado ou não).
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('AuthContext: Usuário logado:', user.uid, user.email);
        setUser(user);
        
        // Define o cookie de autenticação para o middleware
        try {
          const token = await user.getIdToken();
          document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
          console.log('AuthContext: Cookie de autenticação definido');
        } catch (error) {
          console.error('AuthContext: Erro ao obter token:', error);
        }
      } else {
        console.log('AuthContext: Usuário não logado');
        setUser(null);
        
        // Remove o cookie de autenticação
        document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        console.log('AuthContext: Cookie de autenticação removido');
      }
      // Quando o listener dispara, a verificação inicial terminou.
      console.log('AuthContext: Auth loading finalizado');
      setAuthLoading(false);
    });

    // Limpa o listener quando o componente é desmontado
    return () => {
      console.log('AuthContext: Limpando listener');
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Criamos um hook customizado para usar o contexto facilmente
export const useAuth = () => {
  return useContext(AuthContext);
};