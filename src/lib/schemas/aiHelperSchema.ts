import { z } from 'zod';

export const aiHelperSchema = z.object({
  ph: z.coerce.number().min(0, "O pH não pode ser negativo."),
  cloro: z.coerce.number().min(0, "O cloro não pode ser negativo."),
  alcalinidade: z.coerce.number().min(0, "A alcalinidade não pode ser negativa."),
  foto: z.custom<FileList>().optional(),
  description: z.string().optional(),
});

export type AiHelperFormData = z.infer<typeof aiHelperSchema>;