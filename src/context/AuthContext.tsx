'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isAuthorizedUser } from '@/lib/userRoles';

// Definimos o tipo do valor que nosso contexto irá fornecer
interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  isAuthorized: boolean;
}

// Criamos o contexto com um valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  authLoading: true,
  isAuthorized: false,
});

// Criamos o Provedor do Contexto
export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // onAuthStateChanged é o listener oficial do Firebase. Ele dispara
    // assim que a autenticação é resolvida (logado ou não).
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Verificar se o usuário está autorizado
        const authorized = user.email ? isAuthorizedUser(user.email) : false;
        setIsAuthorized(authorized);
        
        // Salvar email no cookie para o middleware
        if (authorized) {
          document.cookie = `user-email=${user.email}; path=/; max-age=86400;`;
        } else {
          // Remove o cookie se não autorizado
          document.cookie = 'user-email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
        // Remove o cookie quando faz logout
        document.cookie = 'user-email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      // Quando o listener dispara, a verificação inicial terminou.
      setAuthLoading(false);
    });

    // Limpa o listener quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
}

// Criamos um hook customizado para usar o contexto facilmente
export const useAuth = () => {
  return useContext(AuthContext);
};