import { z } from 'zod';

export const visitFormSchema = z.object({
  ph: z.number().min(0, { message: 'pH inválido.' }),
  cloro: z.number().min(0, { message: 'Cloro inválido.' }),
  alcalinidade: z.number().min(0, { message: 'Alcalinidade inválida.' }),
  description: z.string().optional(),
  departureTime: z.string().optional(),
  poolPhoto: z.string().optional(),
});

export type VisitFormData = z.infer<typeof visitFormSchema>;
