'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ProductUsage, VisitProductManager } from './VisitProductManager';

const productUsageSchema = z.object({
  productName: z.string(),
  quantity: z.number().min(1),
});

const formSchema = z.object({
  ph: z.coerce.number().min(0, { message: 'pH inválido.' }),
  cloro: z.coerce.number().min(0, { message: 'Cloro inválido.' }),
  alcalinidade: z.coerce.number().min(0, { message: 'Alcalinidade inválida.' }),
  productsUsed: z.array(productUsageSchema),
  productsRequested: z.array(productUsageSchema),
});

export type VisitFormData = z.infer<typeof formSchema>;

interface VisitFormProps {
  onSubmit: (data: VisitFormData) => void;
  isLoading: boolean;
  clientId: string;
}

export function VisitForm({ onSubmit, isLoading, clientId }: VisitFormProps) {
  const form = useForm<VisitFormData>({
    defaultValues: {
      ph: 0,
      cloro: 0,
      alcalinidade: 0,
      productsUsed: [],
      productsRequested: [],
    },
  });

  const handleProductsUsedChange = (products: ProductUsage[]) => {
    form.setValue('productsUsed', products);
  };

  const handleProductsRequestedChange = (products: ProductUsage[]) => {
    form.setValue('productsRequested', products);
  };

  const handleFormSubmit = async (data: VisitFormData) => {
    try {
      const validatedData = formSchema.parse(data);
      onSubmit(validatedData);
      form.reset({
        ph: 0,
        cloro: 0,
        alcalinidade: 0,
        productsUsed: [],
        productsRequested: [],
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          form.setError(err.path[0] as keyof VisitFormData, {
            type: 'manual',
            message: err.message,
          });
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="ph"
            render={({ field }) => (
              <FormItem>
                <FormLabel>pH</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="7.2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cloro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cloro (ppm)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="1.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="alcalinidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alcalinidade (ppm)</FormLabel>
                <FormControl>
                  <Input type="number" step="1" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6">
          <VisitProductManager
            clientId={clientId}
            onProductsUsedChange={handleProductsUsedChange}
            onProductsRequestedChange={handleProductsRequestedChange}
          />
        </div>

        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Visita'}
        </Button>
      </form>
    </Form>
  );
}