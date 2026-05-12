# AquaGest — Piscicultura

Sistema de gestão de tanques para piscicultura de tambaqui. Controle de lotes, projeções de crescimento, manejo alimentar e análise financeira em tempo real.

## Stack Tecnológica

- **Framework:** [Next.js](https://nextjs.org) 16.2.6 (App Router)
- **UI:** React 19, TypeScript 5, Tailwind CSS 4
- **Componentes:** shadcn/ui (base-nova via @base-ui/react)
- **State Management:** Zustand sincronizado com PostgreSQL Neon
- **Gráficos:** Recharts
- **Relatórios:** jsPDF + jspdf-autotable
- **Ícones:** Lucide React

## Funcionalidades

- **Visão Geral dos Tanques:** Grid interativo com filtragem por fase (Berçário, Recria, Engorda, Vazio)
- **Detalhamento por Tanque:** Edição inline de métricas, mudança de fase com confirmação, projeções de crescimento
- **Manejo Alimentar:** Cálculo automático de consumo de ração por fase e por tanque
- **Análise Financeira:** Receita estimada, custos, lucro líquido e margem de lucro com gráficos interativos
- **Premissas & Configurações:** Parâmetros globais de produção, pesos de transferência e financeiros
- **Relatórios PDF:** Geração de relatórios completos de produção

## Começando

### Pré-requisitos

- Node.js 22+
- npm 10+

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd piscicultura

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Variáveis de ambiente

Configure `DATABASE_URL` com a string de conexão do seu banco Neon/Postgres. Sem ela, o app continua funcionando com os dados padrão, mas sem persistência no banco.

### Scripts disponíveis

```bash
npm run dev      # Servidor de desenvolvimento com Turbopack
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # ESLint
npm run type-check  # TypeScript --noEmit
npm run format   # Prettier --write
npm run format:check # Prettier --check
```

## Arquitetura

```
app/                    # App Router (Next.js)
  page.tsx              # Dashboard principal
  financeiro/page.tsx   # Página financeira (charts + KPIs)
  premissas/page.tsx    # Configurações globais
components/
  ui/                   # Componentes shadcn/ui (Button, Dialog, Select, etc.)
  forms/                # Componentes de formulário reutilizáveis
  Financeiro/           # Charts e tabelas financeiras
  MetricCard.tsx        # Card métrico com edição inline
  SectionTitle.tsx      # Título de seção semântico
  EmptyState.tsx        # Estado vazio reutilizável
  ErrorBoundary.tsx     # Boundary de erro
lib/
  hooks/                # Hooks customizados (useProductionMetrics)
  phase-utils.ts        # Helpers de estilo por fase
  store.ts              # Zustand store com persistência
  types.ts              # Tipos TypeScript
  generateReport.ts     # Gerador de relatórios PDF
```

## Segurança

O projeto inclui headers de segurança configurados em `next.config.ts`:

- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Referrer-Policy

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

MIT
