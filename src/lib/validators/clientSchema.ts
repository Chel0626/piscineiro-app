import * as z from 'zod';

// 1. O Schema (A "Lei") - permanece o mesmo.
// Esta é a fonte da verdade para o formato FINAL dos nossos dados.
export const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres.' }),
  address: z.string().min(5, { message: 'Endereço muito curto.' }),
  neighborhood: z.string().min(2, { message: 'Bairro/Condomínio muito curto.' }),
  phone: z.string().optional(),
  // z.coerce.number() é poderoso e vai converter a string do formulário para número durante a validação.
  poolVolume: z.coerce.number().min(0, { message: 'Volume não pode ser negativo.' }),
  serviceValue: z.coerce.number().min(0, { message: 'Valor não pode ser negativo.' }),
  visitDay: z.string().min(1, { message: "Por favor, selecione um dia da visita." }),
});

// 2. O Tipo de Saída (Dados Válidos)
// Este é o tipo que o Zod garante após uma validação bem-sucedida.
export type ClientFormData = z.infer<typeof clientFormSchema>;

// 3. O Tipo de Entrada (A "Variável de Conflito")
// Este é o tipo que representa o estado do formulário, onde campos numéricos
// podem ser strings vazias. Estamos explicitamente modelando a "confusão".
export type ClientFormInput = {
  name: string;
  address: string;
  neighborhood: string;
  phone?: string;
  // Permitimos que o formulário lide com string ou número
  poolVolume: string | number; 
  serviceValue: string | number;
  visitDay: string;
};