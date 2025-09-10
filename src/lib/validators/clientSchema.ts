import * as z from 'zod';

export const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres.' }),
  address: z.string().min(5, { message: 'Endereço muito curto.' }),
  neighborhood: z.string().min(2, { message: 'Bairro/Condomínio muito curto.' }),
  phone: z.string().optional(),
  
  // CORREÇÃO ARQUITETURAL:
  // Esta nova definição diz ao Zod exatamente como lidar com o input.
  // 1. O `z.preprocess` intercepta o valor antes da validação.
  // 2. Se o valor for uma string vazia (''), ele o transforma em `undefined`.
  // 3. O `z.coerce.number()` então recebe `undefined` ou o valor original.
  // 4. O `.default(0)` garante que, se o valor for `undefined`, ele se torne `0`.
  // Isso resolve a ambiguidade de tipo e torna o schema à prova de falhas para inputs de formulário.
  poolVolume: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: 'Volume inválido.' }).min(0, { message: 'Volume não pode ser negativo.' }).default(0)
  ),
  serviceValue: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: 'Valor inválido.' }).min(0, { message: 'Valor não pode ser negativo.' }).default(0)
  ),

  visitDay: z.string().min(1, { message: "Por favor, selecione um dia da visita." }),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;