import { z } from 'zod';

// Usamos z.coerce.number() para forçar a conversão de string para número.
// Mensagens de erro personalizadas foram adicionadas para uma melhor experiência.
export const aiHelperSchema = z.object({
  ph: z.coerce.number({ invalid_type_error: "O pH deve ser um número." })
    .min(0, "O pH não pode ser negativo."),
  cloro: z.coerce.number({ invalid_type_error: "O cloro deve ser um número." })
    .min(0, "O cloro não pode ser negativo."),
  alcalinidade: z.coerce.number({ invalid_type_error: "A alcalinidade deve ser um número." })
    .min(0, "A alcalinidade não pode ser negativa."),
  foto: z.instanceof(FileList)
    .refine(files => files?.length === 1, "A foto é obrigatória."),
});

// Exportamos o tipo inferido para manter consistência.
export type AiHelperFormData = z.infer<typeof aiHelperSchema>;