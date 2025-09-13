import * as z from 'zod';

// CORREÇÃO: Aplicamos z.coerce.number() para forçar a conversão
// dos valores do formulário (string) para número antes da validação.
export const calculatorFormSchema = z.object({
  ph: z.coerce.number().optional(),
  cloro: z.coerce.number().optional(),
  alcalinidade: z.coerce.number().optional(),
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;