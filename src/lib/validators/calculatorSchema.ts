import * as z from 'zod';

// Schema para os inputs do formulário da calculadora
export const calculatorFormSchema = z.object({
  ph: z.coerce.number().optional(),
  cloro: z.coerce.number().optional(),
  alcalinidade: z.coerce.number().optional(),
});

// Tipo de dados inferido a partir do schema
export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;