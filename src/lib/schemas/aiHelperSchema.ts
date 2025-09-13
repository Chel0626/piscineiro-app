import { z } from 'zod';

export const aiHelperSchema = z.object({
  ph: z.number().min(0, "O pH não pode ser negativo."),
  cloro: z.number().min(0, "O cloro não pode ser negativo."),
  alcalinidade: z.number().min(0, "A alcalinidade não pode ser negativa."),
  foto: z.instanceof(FileList)
    .refine(files => files?.length === 1, "A foto é obrigatória."),
});

export type AiHelperFormData = z.infer<typeof aiHelperSchema>;