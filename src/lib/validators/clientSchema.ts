import * as z from 'zod';

// Aplicando a mesma correção com z.coerce.number() e unificando os tipos.
export const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter no mínimo 2 caracteres.' }),
  address: z.string().min(5, { message: 'O endereço parece muito curto.' }),
  neighborhood: z.string().min(2, { message: 'O bairro/condomínio parece muito curto.' }),
  phone: z.string().optional(),
  poolVolume: z.coerce.number({ invalid_type_error: "O volume deve ser um número." })
    .min(0, { message: 'O volume não pode ser negativo.' }),
  serviceValue: z.coerce.number({ invalid_type_error: "O valor deve ser um número." })
    .min(0, { message: 'O valor não pode ser negativo.' }),
  visitDay: z.string().min(1, { message: "Por favor, selecione um dia da visita." }),
});

// A partir de agora, usamos apenas este tipo, inferido diretamente do schema.
export type ClientFormData = z.infer<typeof clientFormSchema>;