'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BrainCircuit } from 'lucide-react';
import { AiHelper } from './AiHelper';

export function AiHelperDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start px-4 py-2 mt-2 text-gray-300 dark:text-gray-400 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white transition-colors h-auto"
        >
          <BrainCircuit className="h-5 w-5" />
          <span className="ml-3">IA Helper</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assistente IA - Especialista em Piscinas</DialogTitle>
        </DialogHeader>
        <AiHelper />
      </DialogContent>
    </Dialog>
  );
}