// src/hooks/useClientProducts.ts
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  quantity: number;
}

export function useClientProducts(clientId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    const productsCollectionRef = collection(db, 'clients', clientId, 'products');
    const q = query(productsCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...(doc.data() as Omit<Product, 'id'>) });
      });
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar produtos do cliente:", error);
      toast.error("Não foi possível carregar o estoque de produtos.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  const addProduct = async (name: string, quantity: number) => {
    try {
      const productsCollectionRef = collection(db, 'clients', clientId, 'products');
      await addDoc(productsCollectionRef, { name, quantity });
      toast.success("Produto adicionado ao estoque!");
    } catch (error) {
      toast.error("Falha ao adicionar produto.");
    }
  };

  const updateProductQuantity = async (productId: string, newQuantity: number) => {
    try {
      const productDocRef = doc(db, 'clients', clientId, 'products', productId);
      await updateDoc(productDocRef, { quantity: newQuantity });
      toast.success("Quantidade atualizada.");
    } catch (error) {
      toast.error("Falha ao atualizar a quantidade.");
    }
  };
  
  const deleteProduct = async (productId: string) => {
    try {
      const productDocRef = doc(db, 'clients', clientId, 'products', productId);
      await deleteDoc(productDocRef);
      toast.success("Produto removido do estoque.");
    } catch (error) {
      toast.error("Falha ao remover produto.");
    }
  };

  return { products, isLoading, addProduct, updateProductQuantity, deleteProduct };
}