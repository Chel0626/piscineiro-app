'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { BrainCircuit } from 'lucide-react';
import { AiHelper } from './AiHelper';

export function AiHelperDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
        >
          <BrainCircuit className="mr-2 h-4 w-4" />
          IA Helper
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <AiHelper />
      </DialogContent>
    </Dialog>
  );
}