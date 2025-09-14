'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { ProductCalculator } from './ProductCalculatorSimple';

export function ProductCalculatorDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Calculator className="mr-2 h-4 w-4" />
          Calculadora de Produtos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculadora de Produtos</DialogTitle>
          <DialogDescription>
            Calcule as quantidades de produtos necessárias para correção dos parâmetros da água ou para decantação.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ProductCalculator />
        </div>
      </DialogContent>
    </Dialog>
  );
}