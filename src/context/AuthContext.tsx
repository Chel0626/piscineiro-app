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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('AuthContext: Usuário logado:', user.uid, user.email);
        setUser(user);
      } else {
        console.log('AuthContext: Usuário não logado');
        setUser(null);
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