'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface StockItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
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

    const stockDocRef = doc(db, 'clients', clientId, 'stock', 'inventory');
    
    const unsubscribe = onSnapshot(
      stockDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStock(data.items || []);
        } else {
          setStock([]);
        }
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
      const stockDocRef = doc(db, 'clients', clientId, 'stock', 'inventory');
      const updatedStock = stock.map(item => {
        if (item.productId === productId) {
          return { ...item, quantity: Math.max(0, item.quantity + quantityChange) };
        }
        return item;
      });
      
      await updateDoc(stockDocRef, { items: updatedStock });
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err);
      throw err;
    }
  };

  const deductProductByName = async (productName: string, quantityToDeduct: number, unit: string) => {
    if (!clientId) return;

    try {
      const stockDocRef = doc(db, 'clients', clientId, 'stock', 'inventory');
      let productFound = false;
      
      let updatedStock = stock.map(item => {
        // Normaliza nomes para comparação (remove acentos, lowercase)
        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (normalize(item.productName) === normalize(productName)) {
          productFound = true;
          // Permite negativo conforme solicitado
          return { ...item, quantity: item.quantity - quantityToDeduct };
        }
        return item;
      });

      if (!productFound) {
        // Adiciona novo item com quantidade negativa
        updatedStock.push({
          productId: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          productName: productName,
          quantity: -quantityToDeduct,
          unit: unit,
          minQuantity: 0
        });
      }

      await updateDoc(stockDocRef, { items: updatedStock });
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
