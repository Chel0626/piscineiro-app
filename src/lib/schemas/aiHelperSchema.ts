import { z } from 'zod';

// Definimos o schema de validação aqui, usando z.coerce.number() para a correção.
export const aiHelperSchema = z.object({
  ph: z.coerce.number().min(0, "O valor do pH não pode ser negativo."),
  cloro: z.coerce.number().min(0, "O valor do cloro não pode ser negativo."),
  alcalinidade: z.coerce.number().min(0, "O valor da alcalinidade não pode ser negativo."),
  foto: z.instanceof(FileList)
    .refine(files => files?.length === 1, "O envio de uma foto é obrigatório.")
    .refine(files => files?.[0]?.type.startsWith('image/'), "O arquivo precisa ser uma imagem."),
});

// Também exportamos o tipo inferido a partir do schema.
// Isso garante que o formulário e a validação estejam sempre em sincronia.
export type AiHelperFormData = z.infer<typeof aiHelperSchema>;