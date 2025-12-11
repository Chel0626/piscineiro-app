import * as z from 'zod';

// Removemos z.coerce.number() para evitar conflitos de tipo com o zodResolver
export const clientFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter no mínimo 2 caracteres.' }),
  address: z.string().min(5, { message: 'O endereço parece muito curto.' }),
  neighborhood: z.string().min(2, { message: 'O bairro/condomínio parece muito curto.' }),
  phone: z.string().optional(),
  email: z.string().email({ message: 'Email inválido.' }).optional(),
  poolVolume: z.number().min(0, { message: 'O volume não pode ser negativo.' }),
  serviceValue: z.number().min(0, { message: 'O valor não pode ser negativo.' }),
  
  // Mudança: de visitDay para visitFrequency e visitDays
  visitFrequency: z.enum(['weekly', 'biweekly'], { message: "Por favor, selecione a frequência de visitas." }),
  visitDays: z.array(z.string()).min(1, { message: "Por favor, selecione pelo menos um dia da visita." })
    .max(2, { message: "Máximo de 2 dias por semana." }),

  paymentDueDate: z.number().min(1, { message: "O dia do vencimento deve ser um número." })
    .min(1, { message: "O dia deve ser entre 1 e 31." })
    .max(31, { message: "O dia deve ser entre 1 e 31." }),

  // Campo opcional para armazenar a ordem dos clientes em cada dia
  routeOrder: z.record(z.string(), z.number()).optional(),
  reajusteHistory: z.array(z.object({
    date: z.string(),
    oldValue: z.number(),
    newValue: z.number(),
    diffValue: z.number(),
    diffPercent: z.number(),
    inflationIndex: z.number().nullable().optional(),
    reason: z.string().optional(),
  })).optional(),

  // Campos do filtro (opcionais - nem toda piscina tem filtro)
  filterModel: z.string().optional().or(z.literal('')),
  // Simplificando ao máximo: aceita number ou undefined.
  // A conversão deve ser feita no componente (onChange) antes de chegar aqui.
  filterSandKg: z.number().optional(),
  lastSandChange: z.string().optional().or(z.literal('')),
  nextSandChange: z.string().optional().or(z.literal('')),
  
  // Data de início do contrato
  contractStartDate: z.string().optional(),
});

// Schema para compatibilidade com dados antigos (migração)
export const legacyClientSchema = z.object({
  name: z.string(),
  address: z.string(),
  neighborhood: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  poolVolume: z.number(),
  serviceValue: z.number(),
  visitDay: z.string(), // Campo antigo
  paymentDueDate: z.number(),
});

// Exportamos o tipo inferido para manter a consistência em todo o app.
export type ClientFormData = z.infer<typeof clientFormSchema>;
export type LegacyClientData = z.infer<typeof legacyClientSchema>;

// Tipo extendido para incluir campos de pagamento (usado apenas na leitura de dados)
export type ClientWithPayment = ClientFormData & {
  id: string;
  lastPaymentDate?: string;
  paymentStatus?: 'paid' | 'pending' | 'overdue';
};

// Função para migrar dados antigos para o novo formato
export function migrateClientData(legacyData: LegacyClientData): ClientFormData {
  return {
    ...legacyData,
    visitFrequency: 'weekly' as const,
    visitDays: [legacyData.visitDay],
  };
}