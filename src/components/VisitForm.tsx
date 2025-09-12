'use client';

// 1. O import do zodResolver foi removido para limpar o aviso.
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

const formSchema = z.object({
  ph: z.coerce.number().min(0, { message: 'pH inválido.' }),
  cloro: z.coerce.number().min(0, { message: 'Cloro inválido.' }),
  alcalinidade: z.coerce.number().min(0, { message: 'Alcalinidade inválida.' }),
});

export type VisitFormData = z.infer<typeof formSchema>;

type VisitFormInput = {
  ph: string | number;
  cloro: string | number;
  alcalinidade: string | number;
};

interface VisitFormProps {
  onSubmit: (data: VisitFormData) => void;
  isLoading: boolean;
}

export function VisitForm({ onSubmit, isLoading }: VisitFormProps) {
  const form = useForm<VisitFormInput>({
    defaultValues: {
      ph: '',
      cloro: '',
      alcalinidade: '',
    },
  });

  const handleFormSubmit = (data: VisitFormInput) => {
    try {
      const validatedData = formSchema.parse(data);
      onSubmit(validatedData);
      form.reset();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // 2. CORREÇÃO: A propriedade correta é .issues, não .errors.
        error.issues.forEach((err) => {
          const fieldName = err.path[0] as keyof VisitFormInput;
          form.setError(fieldName, {
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Visita'}
        </Button>
      </form>
    </Form>
  );
}