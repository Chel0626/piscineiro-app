import * as z from 'zod';

export const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres.' }),
  address: z.string().min(5, { message: 'Endereço muito curto.' }),
  neighborhood: z.string().min(2, { message: 'Bairro/Condomínio muito curto.' }),
  phone: z.string().optional(),
  poolVolume: z.coerce.number().min(0, { message: 'Volume não pode ser negativo.' }),
  serviceValue: z.coerce.number().min(0, { message: 'Valor não pode ser negativo.' }),
  visitDay: z.string().min(1, { message: "Por favor, selecione um dia da visita." }),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export type ClientFormInput = {
  name: string;
  address: string;
  neighborhood: string;
  phone?: string;
  poolVolume: string | number; 
  serviceValue: string | number;
  visitDay: string;
};