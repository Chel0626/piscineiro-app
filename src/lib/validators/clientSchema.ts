import * as z from 'zod';

export const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres.' }),
  address: z.string().min(5, { message: 'Endereço muito curto.' }),
  neighborhood: z.string().min(2, { message: 'Bairro/Condomínio muito curto.' }),
  phone: z.string().optional(),
  
  // CORREÇÃO DEFINITIVA:
  // Esta definição robusta resolve o problema de tipo de uma vez por todas.
  // 1. `z.preprocess` intercepta o valor antes de qualquer validação.
  // 2. Ele verifica se o valor é uma string vazia ('') ou nulo e, nesse caso, o transforma em `undefined`.
  // 3. `z.coerce.number()` recebe `undefined` ou o valor original (ex: "30").
  // 4. `.min(0)` aplica a regra de negócio.
  // 5. `.default(0)` garante que se o campo for deixado vazio, seu valor final será 0.
  // Isso elimina qualquer ambiguidade de tipo para o TypeScript e o resolver.
  poolVolume: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.coerce.number({ invalid_type_error: 'Volume inválido.' }).min(0, { message: 'Volume não pode ser negativo.' }).default(0)
  ),
  serviceValue: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.coerce.number({ invalid_type_error: 'Valor inválido.' }).min(0, { message: 'Valor não pode ser negativo.' }).default(0)
  ),

  visitDay: z.string().min(1, { message: "Por favor, selecione um dia da visita." }),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;