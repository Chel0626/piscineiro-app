# 🏗️ Arquitetura do Projeto PiscineiroApp

## 📋 Visão Geral

Este documento descreve a arquitetura de módulos do PiscineiroApp, as convenções de código e as melhores práticas para garantir um código limpo, manutenível e escalável.

## 🎯 Princípios de Arquitetura

### Separação de Responsabilidades (Separation of Concerns)

O projeto segue uma arquitetura em camadas onde cada módulo tem uma responsabilidade específica:

```
┌─────────────────────────────────────┐
│         app/ (Páginas & Rotas)      │  ← Camada de Apresentação
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│    components/ (Componentes UI)     │  ← Camada de Interface
└─────────────────────────────────────┘
               ↓
┌──────────────┬──────────────────────┐
│   hooks/     │      context/        │  ← Camada de Lógica
│ (Business    │  (Gerenciamento de   │
│  Logic)      │      Estado)         │
└──────────────┴──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│    lib/ (Utilitários & Schemas)     │  ← Camada de Fundação
└─────────────────────────────────────┘
```

### Regras de Dependência

**Regra de Ouro**: As camadas superiores podem importar das camadas inferiores, mas NUNCA o contrário.

```
✅ PERMITIDO:
- components → lib, hooks, context
- hooks → lib, context
- context → lib
- app → components, hooks, context, lib

❌ NÃO PERMITIDO:
- lib → hooks, context, components, app
- hooks → components, app
- context → hooks, components, app
```

## 📁 Estrutura de Diretórios

### `/src/app` - Páginas e Rotas
Contém as páginas da aplicação usando o App Router do Next.js 15.

```
app/
├── dashboard/           # Área protegida do dashboard
│   ├── page.tsx        # Dashboard principal
│   ├── clientes/       # Gerenciamento de clientes
│   ├── roteiros/       # Roteiros semanais
│   ├── perfil/         # Edição de perfil
│   └── admin/          # Painel administrativo
├── api/                # API Routes (backend)
├── login/              # Página de autenticação
└── layout.tsx          # Layout raiz da aplicação
```

**Responsabilidades:**
- Definição de rotas
- Layouts de página
- Metadata e SEO
- API Routes (endpoints backend)

### `/src/components` - Componentes React

```
components/
├── ui/                 # Componentes primitivos (Radix UI)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── AppLayout.tsx       # Layout principal da aplicação
├── Sidebar.tsx         # Barra lateral com widgets
├── ClientForm.tsx      # Formulários específicos
├── VisitForm.tsx       # Formulário de visitas
└── ...
```

**Responsabilidades:**
- Renderização de UI
- Interação do usuário
- Composição de componentes
- Estados locais da UI

**Regras:**
- Devem ser "burros" quando possível (receive props, display data)
- Lógica complexa deve estar em hooks
- Não devem conter lógica de negócio
- Podem importar de: `lib/`, `hooks/`, `context/`

### `/src/hooks` - Custom Hooks

```
hooks/
├── useClients.ts          # Gerenciamento de clientes
├── useClientDetails.ts    # Detalhes de um cliente
├── useRoutines.ts         # Roteiros semanais
├── useBilling.ts          # Faturamento
├── useProductRequests.ts  # Solicitações de produtos
└── ...
```

**Responsabilidades:**
- Lógica de negócio reutilizável
- Integração com APIs/Firebase
- Transformação de dados
- Efeitos colaterais

**Regras:**
- Devem seguir a convenção `use*`
- Não devem importar de `components/` ou `app/`
- Podem importar de: `lib/`, `context/`
- Devem ser independentes de UI

### `/src/context` - Context Providers

```
context/
├── AuthContext.tsx           # Contexto de autenticação
├── FillReminderContext.tsx   # Contexto de lembretes
└── ...
```

**Responsabilidades:**
- Gerenciamento de estado global
- Compartilhamento de dados entre componentes
- Listeners de eventos globais

**Regras:**
- Usar apenas para estado realmente global
- Não devem importar de `components/`, `hooks/`, ou `app/`
- Podem importar apenas de: `lib/`

### `/src/lib` - Bibliotecas e Utilitários

```
lib/
├── schemas/              # Schemas Zod
│   ├── visitSchema.ts    # ✅ Schema de visitas
│   ├── piscineiroSchema.ts
│   └── aiHelperSchema.ts
├── validators/           # Validações
│   └── clientSchema.ts
├── firebase.ts          # Configuração Firebase
├── firebase-admin.ts    # Firebase Admin SDK
├── userRoles.ts         # Tipos e utilitários de roles
└── utils.ts             # Funções utilitárias
```

**Responsabilidades:**
- Tipos TypeScript compartilhados
- Schemas de validação (Zod)
- Configurações (Firebase, etc)
- Funções puras e utilitárias
- Constantes e enums

**Regras:**
- NUNCA deve importar de outras camadas
- Deve conter apenas código "puro" (sem side effects)
- Tipos devem ser exportados para uso em toda a aplicação

## 🔄 Fluxo de Dados

### Exemplo: Cadastro de Visita

```
1. VisitForm.tsx (Component)
   ↓ user submits form
2. visitSchema.ts (Validation)
   ↓ validates data
3. onSubmit callback
   ↓ calls
4. useClientDetails.ts (Hook)
   ↓ saves to
5. Firebase (Database)
```

### Exemplo: Listagem de Clientes

```
1. page.tsx (Route)
   ↓ uses
2. useClients.ts (Hook)
   ↓ fetches from
3. Firebase (Database)
   ↓ returns data typed as
4. clientSchema.ts (Type)
   ↓ renders in
5. ClientList Component
```

## ✅ Boas Práticas

### 1. Evite Dependências Circulares

**❌ ERRADO:**
```typescript
// useClientDetails.ts
import { VisitFormData } from '@/components/VisitForm';

// VisitForm.tsx
import { useClientDetails } from '@/hooks/useClientDetails';
```

**✅ CORRETO:**
```typescript
// lib/schemas/visitSchema.ts
export type VisitFormData = z.infer<typeof visitFormSchema>;

// useClientDetails.ts
import { VisitFormData } from '@/lib/schemas/visitSchema';

// VisitForm.tsx
import { useClientDetails } from '@/hooks/useClientDetails';
import { VisitFormData } from '@/lib/schemas/visitSchema';
```

### 2. Tipos e Schemas em `/lib`

Sempre defina tipos e schemas compartilhados em `/lib`:

```typescript
// ✅ lib/schemas/visitSchema.ts
import { z } from 'zod';

export const visitFormSchema = z.object({
  ph: z.number(),
  cloro: z.number(),
  // ...
});

export type VisitFormData = z.infer<typeof visitFormSchema>;
```

### 3. Hooks para Lógica de Negócio

Mantenha a lógica fora dos componentes:

```typescript
// ✅ hooks/useClients.ts
export function useClients() {
  const [clients, setClients] = useState([]);
  
  useEffect(() => {
    // Complex Firebase logic here
  }, []);
  
  return { clients, addClient, deleteClient };
}

// ✅ components/ClientList.tsx
export function ClientList() {
  const { clients, addClient } = useClients();
  
  return (
    // Simple rendering logic
  );
}
```

### 4. Props Tipadas

Sempre use TypeScript para props:

```typescript
interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  initialData?: Partial<ClientFormData>;
  isLoading: boolean;
}

export function ClientForm({ onSubmit, initialData, isLoading }: ClientFormProps) {
  // ...
}
```

### 5. Composição sobre Herança

Prefira composição de componentes:

```typescript
// ✅ CORRETO
<Card>
  <CardHeader>
    <CardTitle>Cliente</CardTitle>
  </CardHeader>
  <CardContent>
    <ClientInfo />
  </CardContent>
</Card>

// ❌ EVITAR criar componentes monolíticos
<ClientCardWithEverything />
```

## 🔍 Verificação de Qualidade

### Scripts Disponíveis

```bash
# TypeScript type checking
npx tsc --noEmit

# Linting
npm run lint

# Build
npm run build
```

### Checklist de PR

Antes de fazer um Pull Request, verifique:

- [ ] `npx tsc --noEmit` passa sem erros
- [ ] `npm run lint` não mostra novos erros
- [ ] Não há dependências circulares
- [ ] Tipos estão em `/lib` quando compartilhados
- [ ] Lógica de negócio está em hooks, não em componentes
- [ ] Componentes são focados e reutilizáveis

## 📚 Ferramentas de Verificação

### Verificar Dependências Circulares

Um script foi criado para verificar dependências circulares:

```bash
node scripts/check-circular-dependencies.js
```

### Verificar Imports Quebrados

```bash
node scripts/check-broken-imports.js
```

## 🤝 Como Contribuir

1. **Siga a arquitetura em camadas**: Respeite as regras de dependência
2. **Tipos compartilhados em `/lib`**: Evite duplicação
3. **Use hooks para lógica**: Mantenha componentes simples
4. **Teste suas mudanças**: Execute os scripts de verificação
5. **Documente código complexo**: Adicione comentários quando necessário

## 📖 Referências

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Zod Validation](https://zod.dev/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Última atualização**: 2025-10-16
**Versão**: 1.0.0
