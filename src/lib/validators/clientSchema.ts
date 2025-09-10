import * as z from 'zod';

// 1. O Schema (A "Lei")
export const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres.' }),
  address: z.string().min(5, { message: 'Endereço muito curto.' }),
  neighborhood: z.string().min(2, { message: 'Bairro/Condomínio muito curto.' }),
  phone: z.string().optional(),
  poolVolume: z.coerce.number().min(0, { message: 'Volume não pode ser negativo.' }),
  serviceValue: z.coerce.number().min(0, { message: 'Valor não pode ser negativo.' }),
  visitDay: z.string().min(1, { message: "Por favor, selecione um dia da visita." }),
});

// 2. O Tipo de Saída (Dados Válidos)
export type ClientFormData = z.infer<typeof clientFormSchema>;

// 3. O Tipo de Entrada (A "Variável de Conflito")
export type ClientFormInput = {
  name: string;
  address: string;
  neighborhood: string;
  phone?: string;
  poolVolume: string | number; 
  serviceValue: string | number;
  visitDay: string;
};