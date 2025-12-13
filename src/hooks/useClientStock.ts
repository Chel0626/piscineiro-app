'use client';

import { useState, useEffect } from 'react';
import { collection, doc, updateDoc, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  minQuantity?: number;
}

export function useClientStock(clientId: string | null) {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    // Mudança: Usar a coleção 'products' em vez de 'stock/inventory'
    const productsRef = collection(db, 'clients', clientId, 'products');
    
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const items: StockItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: doc.id,
            name: data.name || data.productName || 'Sem nome',
            quantity: data.quantity || 0,
            unit: data.unit,
            minQuantity: data.minQuantity
          });
        });
        setStock(items);
        setIsLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar estoque:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clientId]);

  const updateStock = async (productId: string, quantityChange: number) => {
    if (!clientId) return;
    
    try {
      const productRef = doc(db, 'clients', clientId, 'products', productId);
      // Precisamos pegar o item atual para somar
      const currentItem = stock.find(i => i.id === productId);
      if (currentItem) {
         await updateDoc(productRef, { 
            quantity: Math.max(0, currentItem.quantity + quantityChange) 
         });
      }
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err);
      throw err;
    }
  };

  const deductProductByName = async (productName: string, quantityToDeduct: number, unit: string) => {
    if (!clientId) return;

    try {
      const productsRef = collection(db, 'clients', clientId, 'products');
      
      // Normaliza o nome buscado
      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedSearchName = normalize(productName);

      // Busca todos os produtos para encontrar correspondência
      const snapshot = await getDocs(productsRef);
      
      let matchDocId = null;
      let currentQuantity = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const name = data.name || data.productName || '';
        if (normalize(name) === normalizedSearchName) {
          matchDocId = doc.id;
          currentQuantity = data.quantity || 0;
        }
      });

      if (matchDocId) {
        // Produto existe, atualiza
        const productRef = doc(db, 'clients', clientId, 'products', matchDocId);
        await updateDoc(productRef, {
          quantity: currentQuantity - quantityToDeduct
        });
      } else {
        // Produto não existe, cria com quantidade negativa
        await addDoc(productsRef, {
          name: productName,
          quantity: -quantityToDeduct,
          unit: unit,
          createdAt: new Date().toISOString()
        });
      }

    } catch (err) {
      console.error('Erro ao debitar do estoque:', err);
      throw err;
    }
  };

  const getLowStockItems = () => {
    return stock.filter(item => {
      const min = item.minQuantity || 0;
      return item.quantity <= min && min > 0;
    });
  };

  return {
    stock,
    isLoading,
    error,
    updateStock,
    deductProductByName,
    getLowStockItems
  };
}
