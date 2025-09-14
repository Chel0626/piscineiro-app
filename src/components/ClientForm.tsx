'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IMaskInput } from 'react-imask';
import { UseFormReturn } from 'react-hook-form';
// Importamos nosso tipo unificado
import { ClientFormData } from '@/lib/validators/clientSchema';

interface ClientFormProps {
  // O formulário e a função de submit agora usam o mesmo tipo
  form: UseFormReturn<ClientFormData>; 
  onSubmit: (data: ClientFormData) => void;
}

export function ClientForm({ form, onSubmit }: ClientFormProps) {
  return (
    <Form {...form}>
      <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} className="text-sm" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Grid responsivo: 1 coluna no mobile, 2 colunas no desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua das Flores, 123" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Bairro / Condomínio</FormLabel>
                <FormControl>
                  <Input placeholder="Condomínio Azul" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Telefone</FormLabel>
              <FormControl>
                <IMaskInput
                  mask="(00) 00000-0000"
                  value={field.value || ''}
                  unmask={true}
                  onAccept={(value) => field.onChange(value)}
                  placeholder="(19) 99999-9999"
                  className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Grid responsivo para campos numéricos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="poolVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Volume da Piscina (m³)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="30" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value}
                    className="text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Valor (R$)</FormLabel>
                <FormControl>
                   <Input 
                     type="number" 
                     placeholder="250" 
                     {...field} 
                     onChange={(e) => field.onChange(Number(e.target.value))}
                     value={field.value}
                     className="text-sm"
                   />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="visitDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Dia da Visita</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Selecione um dia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Segunda-feira" className="text-sm">Segunda-feira</SelectItem>
                  <SelectItem value="Terça-feira" className="text-sm">Terça-feira</SelectItem>
                  <SelectItem value="Quarta-feira" className="text-sm">Quarta-feira</SelectItem>
                  <SelectItem value="Quinta-feira" className="text-sm">Quinta-feira</SelectItem>
                  <SelectItem value="Sexta-feira" className="text-sm">Sexta-feira</SelectItem>
                  <SelectItem value="Sábado" className="text-sm">Sábado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Dia do Vencimento</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Ex: 10" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  value={field.value}
                  className="text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}