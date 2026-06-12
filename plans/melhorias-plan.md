# Plano de Melhorias — AquaGest / Piscicultura

> Documento de planejamento. Cada item será implementado sob demanda, um de cada vez.
> Status: `[ ]` pendente · `[~]` em andamento · `[x]` concluído

## Contexto

Roteiro de melhorias levantadas após a auditoria de segurança. As correções de
segurança (validação de payload, CSP com nonce, rate limiting, sanitização de
cores, dependências) **já foram aplicadas** e estão listadas na seção
"Concluído" ao final, apenas como referência.

A ausência de autenticação na API é **consciente** e está fora de escopo deste plano.

---

## Prioridade 1 — Correção de bug crítico

### 1. [x] Receitas (lançamentos do tipo `receita`) sendo apagadas

**Problema:** `normalizeLancamento` em `lib/projectState.ts` só aceita as 6
categorias de **custo** e descarta os campos `tipo` e `descricao`. Como
`normalizeProjectState` roda ao salvar **e** ao carregar do banco, toda receita
cadastrada pelo usuário é silenciosamente removida no próximo reload.

**Arquivos:**
- `lib/projectState.ts` — `VALID_CATEGORIAS` e `normalizeLancamento`
- (referência de categorias válidas: `lib/lancamentos.ts` → `CATEGORIAS_CUSTO`, `CATEGORIAS_RECEITA`)

**Mudanças:**
- Incluir as categorias de receita (`venda_peixe`, `venda_processados`, `outras_receitas`) no whitelist.
- Preservar `tipo` (validado contra `'custo' | 'receita'`, default `'custo'`).
- Preservar `descricao` (string, com limite de tamanho via `toCleanString`).
- Garantir que `quantidade`/`precoUnitario` continuem validados como números finitos.

**Critério de aceite:**
- Criar uma receita, recarregar a página → a receita persiste com `tipo`, `categoria` e `descricao` intactos.
- Lançamentos malformados continuam sendo descartados.
- (Idealmente coberto por teste unitário — ver item 2.)

---

## Prioridade 2 — Confiabilidade (testes)

### 2. [x] Base de testes unitários com Vitest

**Problema:** o projeto não tem nenhum teste; o CI só roda `type-check` + `build`.
A lógica mais crítica é composta de funções puras, ideais para testar.

**Arquivos novos:**
- `vitest.config.ts`
- `lib/feedingCalculations.test.ts`
- `lib/lancamentos.test.ts`
- `lib/projectState.test.ts`
- `package.json` — script `"test": "vitest run"` e devDependency `vitest`
- `.github/workflows/ci.yml` — adicionar passo `npm test`

**Cobertura alvo:**
- `feedingCalculations.ts` — cálculo de ração/peso/densidade nas 3 fases, incluindo entradas inválidas (NaN, negativos, período 0).
- `lancamentos.ts` — totais por categoria (custo e receita), `getTipo`, `receitaTotalAnual`, filtros por mês/ano.
- `projectState.ts` — `normalizeProjectState` rejeitando lixo, sanitizando cores, aplicando limites de array, e **regressão do bug do item 1** (receita sobrevive ao round-trip).

**Critério de aceite:**
- `npm test` roda verde localmente e no CI.
- Cada bug corrigido neste plano ganha um teste de regressão.

---

## Prioridade 3 — Persistência e UX de dados

### 3. [x] Controle de concorrência (trava otimista)

**Problema:** `lib/projectState.server.ts` usa um único registro global
(`STATE_ID = 'primary'`) e cada save sobrescreve o documento inteiro
("last-write-wins"). Dois clientes/abas editando ao mesmo tempo se sobrescrevem
sem aviso. O campo `updated_at` existe mas não é usado para isso.

**Arquivos:**
- `lib/projectState.server.ts` — `saveProjectState` aceitar `expectedUpdatedAt` e
  fazer `UPDATE ... WHERE updated_at = expected`; retornar conflito se não casar.
- `app/api/project-state/route.ts` — retornar `409 Conflict` quando houver divergência.
- `lib/store.ts` — enviar o `updatedAt` conhecido no save e tratar 409.

**Critério de aceite:**
- Save com `updatedAt` desatualizado retorna 409 em vez de sobrescrever.
- O cliente é avisado do conflito (ligado ao item 4).

### 4. [x] Indicador de status de salvamento

**Problema:** em `lib/store.ts` (`flushSnapshot`), falha ao persistir só faz
`console.error`. O usuário acha que salvou e pode perder dados.

**Arquivos:**
- `lib/store.ts` — expor estado `saveStatus: 'idle' | 'saving' | 'saved' | 'error'`.
- Componente novo (ex.: `components/SaveStatus.tsx`) exibido no `TopNav`.
- `components/TopNav.tsx` — renderizar o indicador.

**Critério de aceite:**
- Durante o autosave aparece "Salvando…", depois "Salvo às HH:MM".
- Em erro (incl. 409 do item 3) aparece estado de erro visível, com opção de retry.

---

## Prioridade 4 — Arquitetura e performance

### 5. [x] Quebrar componentes/módulos grandes (fechado — parcial por decisão)

> **Encerrado.** Feito o refactor de maior valor (`TankDetailPanel`).
> `generateReport.ts` e `store.ts` foram **conscientemente adiados** por carregarem
> risco de regressão difícil de verificar sem o app rodando (diff de PDF / fluxo de
> estado). Reabrir numa sessão futura com validação visual, se desejado.

**Problema:** arquivos concentram muita responsabilidade:
- `components/TankDetailPanel.tsx` (~694 linhas)
- `lib/generateReport.ts` (~720)
- `lib/store.ts` (~600)

**Mudanças (incrementais, sem mudar comportamento):**
- Extrair subcomponentes de `TankDetailPanel` (cabeçalho, métricas por fase, ações).
- Separar `generateReport` em montagem de dados + renderização de seções.
- Considerar fatiar o `store` em slices (tanks, lotes, custos, config).

**Critério de aceite:** `type-check`, `build` e testes continuam verdes; sem regressão visual.

**Progresso:**
- [x] `TankDetailPanel.tsx` (694 → 541 linhas): config de campos + helpers puros extraídos para `lib/tankFields.ts` (com testes); dois grids de métricas idênticos deduplicados em `components/MetricFieldsGrid.tsx`.
- [ ] `lib/generateReport.ts` (~720) — pendente (refator de baixo risco, mas saída PDF difícil de verificar automaticamente).
- [ ] `lib/store.ts` (~600) — pendente (núcleo de estado; risco maior, exige verificação com app rodando).

### 6. [x] Carregamento dinâmico das libs pesadas de relatório

**Já atendido pela arquitetura atual.** `generateReport.ts` e `generateSpreadsheet.ts`
só são importados via `await import()` no `TopNav`, então `jspdf` (448 KB) e `exceljs`
(920 KB) ficam em chunks assíncronos próprios — verificado: não aparecem no
`app-build-manifest.json` (0 referências), ou seja, fora do bundle inicial.

**Problema:** `jspdf` + `jspdf-autotable` e `exceljs` são pesados e só são usados
ao gerar relatório/planilha.

**Arquivos:**
- `lib/generateReport.ts`, `lib/generateSpreadsheet.ts` — usar `import()` dinâmico das libs.
- Pontos de chamada — garantir que o import só ocorra no clique de gerar.

**Critério de aceite:** as libs não entram no bundle inicial (verificar no output do `build`).

---

## Prioridade 5 — Polimento

### 7. [x] Clareza de unidade: `densidade_kg_m2`

**Problema:** em `lib/feedingCalculations.ts` o valor é calculado como kg/m³
(assumindo 1 m de coluna d'água), mas o campo se chama `densidade_kg_m2`.

**Mudança:** decidir entre renomear o campo (propaga por `types.ts`, store, UI,
relatórios) **ou** documentar claramente a premissa. Avaliar custo antes.

### 8. [x] Acessibilidade (a11y)

**Mudança:** revisar formulários e drawers (`labels`/`aria`, foco ao abrir/fechar,
navegação por teclado, contraste de cores). Priorizar `LancamentoDialog`,
`TankDetailPanel` e o menu do `TopNav`.

---

## Ordem de implementação sugerida

1. **Item 1** — bug das receitas (rápido, crítico).
2. **Item 2** — Vitest + testes do núcleo (com teste de regressão do item 1).
3. **Item 4** — indicador de status de salvamento (ganho de UX imediato).
4. **Item 3** — trava otimista (depende do item 4 para feedback).
5. **Item 6** — import dinâmico das libs de relatório (baixo risco).
6. **Item 5** — refatoração de componentes grandes (incremental).
7. **Itens 7 e 8** — polimento.

---

## Concluído (auditoria de segurança)

- [x] Limite de tamanho de payload na API (`413`) — `app/api/project-state/route.ts`
- [x] Validação profunda de tanques/lotes/premissas + limites de array — `lib/projectState.ts`
- [x] Sanitização de cores de fase (regex hex) — `lib/projectState.ts`
- [x] CSP com nonce por requisição (sem `unsafe-inline`/`unsafe-eval` em prod) — `proxy.ts`, `next.config.ts`
- [x] Rate limiting nas rotas `/api/*` (`429`) — `proxy.ts`
- [x] Dependências: `npm audit` → 0 vulnerabilidades (fix + `overrides`) — `package.json`
- [x] Migração `middleware.ts` → `proxy.ts` (convenção Next 16)
