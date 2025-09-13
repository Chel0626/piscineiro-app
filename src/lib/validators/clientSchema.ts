import * as z from 'zod';

// Removemos z.coerce.number() para evitar conflitos de tipo com o zodResolver
export const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter no mínimo 2 caracteres.' }),
  address: z.string().min(5, { message: 'O endereço parece muito curto.' }),
  neighborhood: z.string().min(2, { message: 'O bairro/condomínio parece muito curto.' }),
  phone: z.string().optional(),
  poolVolume: z.number().min(0, { message: 'O volume não pode ser negativo.' }),
  serviceValue: z.number().min(0, { message: 'O valor não pode ser negativo.' }),
  visitDay: z.string().min(1, { message: "Por favor, selecione um dia da visita." }),
});

// Exportamos o tipo inferido para manter a consistência em todo o app.
export type ClientFormData = z.infer<typeof clientFormSchema>;