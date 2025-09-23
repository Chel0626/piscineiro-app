'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'sonner';

export interface ProductRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  products: string[];
  status: 'pending' | 'approved' | 'rejected';
  requestDate: { toDate: () => Date } | Date;
  approvalDate?: { toDate: () => Date } | Date;
  userId: string;
  notes?: string;
}

export interface ProductRequestInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  products: string[];
  notes?: string;
}

export function useProductRequests() {
  const [user] = useAuthState(auth);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar solicitações do usuário atual
  useEffect(() => {
    if (!user) {
      setRequests([]);
      return;
    }

    const requestsRef = collection(db, 'product-requests');
    const q = query(
      requestsRef, 
      where('userId', '==', user.uid),
      orderBy('requestDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData: ProductRequest[] = [];
      snapshot.forEach((doc) => {
        requestsData.push({ id: doc.id, ...doc.data() } as ProductRequest);
      });
      setRequests(requestsData);
    }, (error) => {
      console.warn('Aviso ao carregar solicitações:', error);
      // Removendo toast de erro para evitar spam
    });

    return unsubscribe;
  }, [user]);

  // Criar nova solicitação
  const createProductRequest = async (requestData: ProductRequestInput): Promise<boolean> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setIsLoading(true);
    try {
      const docData = {
        ...requestData,
        userId: user.uid,
        status: 'pending' as const,
        requestDate: serverTimestamp(),
      };

      await addDoc(collection(db, 'product-requests'), docData);
      toast.success('Solicitação de produtos criada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast.error('Erro ao criar solicitação de produtos');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Aprovar solicitação
  const approveRequest = async (requestId: string, notes?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const requestRef = doc(db, 'product-requests', requestId);
      await updateDoc(requestRef, {
        status: 'approved',
        responseDate: serverTimestamp(),
        notes: notes || ''
      });
      
      toast.success('Solicitação aprovada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast.error('Erro ao aprovar solicitação');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Rejeitar solicitação
  const rejectRequest = async (requestId: string, notes?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const requestRef = doc(db, 'product-requests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        responseDate: serverTimestamp(),
        notes: notes || ''
      });
      
      toast.success('Solicitação rejeitada');
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast.error('Erro ao rejeitar solicitação');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Obter solicitações por status
  const getRequestsByStatus = (status: 'pending' | 'approved' | 'rejected') => {
    return requests.filter(request => request.status === status);
  };

  // Obter produtos aprovados únicos
  const getApprovedProducts = (): string[] => {
    const approvedRequests = requests.filter(request => request.status === 'approved');
    const allProducts = approvedRequests.flatMap(request => request.products);
    return [...new Set(allProducts)]; // Remove duplicatas
  };

  return {
    requests,
    isLoading,
    createProductRequest,
    approveRequest,
    rejectRequest,
    getRequestsByStatus,
    getApprovedProducts,
    pendingRequests: getRequestsByStatus('pending'),
    approvedRequests: getRequestsByStatus('approved'),
    rejectedRequests: getRequestsByStatus('rejected'),
    approvedProducts: getRequestsByStatus('approved') // Lista completa de requests aprovados
  };
}