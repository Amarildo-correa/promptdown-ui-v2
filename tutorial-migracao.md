# Playbook — Migrar ADR-0001 para CLAUDE.md + `.specs/` (tlc-spec-driven)

## Princípio geral

- Esta é uma migração **única**. Depois de concluída, `docs/adr/ADR-0001-arquitetura-base.md`
  **nunca mais** é lido ou referenciado por agentes de IA — fica exclusivamente
  para leitura humana.
- Cada etapa = **1 sessão separada** no Claude Code. Revise o output antes de
  seguir para a próxima.
- O orçamento de **<40k de 200k tokens** se aplica às sessões de **execução de
  tasks de feature** (regime estacionário, dia a dia). As etapas de migração
  abaixo são _one-time setup_ e podem usar mais contexto sem problema — o que
  importa é o que sobra depois, carregado em toda sessão futura.

---

## Checklist

- [x] Etapa 0 — Map codebase → `.specs/codebase/*` (7 arquivos)
    > Concluída em 2026-06-13. Observações para as próximas etapas:
    >
    > - O código real é mínimo: apenas `public/js/lib/truncate.js` + `tests/unit/truncate.test.js` + `api/openapi.yaml`.
    >   Quase tudo do ADR-0001 está marcado "decidido, não implementado" — Etapa 0c/1 devem refletir isso
    >   (ROADMAP com features em status PLANNED, não IN PROGRESS/COMPLETE).
    > - `package.json` só tem scripts `test`/`test:coverage`. CLAUDE.md (Etapa 1) § Comandos deve listar
    >   apenas esses como reais e citar `.specs/codebase/CONCERNS.md` para os demais (lint, lint:api,
    >   serve, api, format, mock:api, test:e2e, test:a11y — todos ausentes).
    > - Drift confirmado: contrato real é `api/openapi.yaml` (OpenAPI 3.0.3), não `docs/api/openapi.yaml@3.1.0`
    >   como o ADR descreve. Usar `api/openapi.yaml` em todos os ponteiros da Etapa 1.
    > - `docs/DESIGN.md` já recebeu as 4 novas linhas da tabela de verificação (rem-only, `@property`,
    >   `prefers-reduced-motion`, `prefers-color-scheme`) — Etapa 1 não precisa tratar disso.
    > - `.specs/codebase/CONVENTIONS.md § Hard Constraints` já contém a tabela completa de ~23 regras —
    >   é a fonte única para a tabela condensada da Etapa 1.
    > - `ADR-0002-component-pattern.md` está vazio e não é referenciado por nenhuma spec — Etapa 1 pode ignorá-lo.
- [x] Etapa 0c — Initialize project → `.specs/project/{PROJECT,ROADMAP}.md`
    > Concluída em 2026-06-13. Observações para as próximas etapas:
    >
    > - Decisão de produto (usuário): v1 = `feed-publico` + `auth-cookie-httponly` (P1/P2/P3 da
    >   respectiva spec) funcionando com gates; `markdown-rendering` (mesmo sendo P1 na própria
    >   spec) fica para o marco seguinte. Etapa 1 (CLAUDE.md) e Etapa 2 não devem tratar
    >   markdown-rendering como prioridade atual.
    > - PROJECT.md confirma: fora de escopo do v1 = backend real (`backend-api/` PRD v0.6.0,
    >   continua JSON Server mock), tooling de CI/lint/E2E/a11y (todos planejados, ver CONCERNS.md),
    >   itens P2/P3 das specs, refresh token/blacklist JWT.
    > - ROADMAP.md registra status real das tasks: feed-publico 1/9 done (T01 OpenAPI),
    >   auth-cookie-httponly 0/8 done, markdown-rendering 0/10 done (T0-T9). Útil para Etapa 1
    >   ao descrever "estado atual" no CLAUDE.md (nada implementado de fato além de
    >   `truncate.js` + contrato OpenAPI).
    > - "Future Considerations" do ROADMAP já cobre os itens deferidos de STATE.md (syntax
    >   highlighting) e os P2/P3 das 3 specs — Etapa 1 pode apontar para lá sem duplicar.
- [x] Etapa 1 — `/init` → `CLAUDE.md` (<200 linhas)
    > Concluída em 2026-06-13. Observações para a próxima etapa:
    >
    > - `CLAUDE.md` gerado na raiz com ~95 linhas, dentro do limite de 200. Nenhuma menção a
    >   `docs/adr/` ou `ADR-0001` (verificado).
    > - "Restrições Absolutas" é a tabela condensada das ~23 regras de
    >   `.specs/codebase/CONVENTIONS.md § Hard Constraints`, com nota apontando para lá como
    >   fonte completa.
    > - Seção "Estado atual" deixa explícito que quase nada está implementado
    >   (`truncate.js` + `api/openapi.yaml`) e que o milestone v1 é
    >   feed-publico + auth-cookie-httponly — útil para Etapa 2 não tratar
    >   markdown-rendering como prioridade.
    > - Ponteiros cobrem `.specs/project/*`, `.specs/codebase/*`, `docs/DESIGN.md`,
    >   `api/openapi.yaml` + `.spectral.yaml` e `.specs/features/`, sem duplicar conteúdo.
- [x] Etapa 2 — Atualizar `.specs/features/*`
    > `feed-publico` concluído em 2026-06-13 (1 de 3 features). Observações para a próxima sessão:
    >
    > - `spec.md`: cabeçalho "ADR de referência" → "Convenções: CLAUDE.md § Restrições Absolutas +
    >   .specs/codebase/CONVENTIONS.md"; "Regra ADR" da seção de contratos de API → "Regra
    >   (CLAUDE.md § Restrições Absolutas)" apontando para `api/openapi.yaml`.
    > - `design.md`: cabeçalho "ADR de referência" → "Convenções: CLAUDE.md § Restrições Absolutas +
    >   .specs/codebase/ARCHITECTURE.md"; tabela "Decisões arquiteturais" manteve a coluna de
    >   decisões e trocou "Fundamento no ADR" por "Referência", apontando para anchors de
    >   `.specs/codebase/ARCHITECTURE.md#<pattern>` (Component Pattern, View Lifecycle e Cleanup,
    >   Lazy Loading de Rotas, Error Handling Global, Roteamento), `.specs/codebase/CONVENTIONS.md`
    >   § Hard Constraints, e — para o caso de Autenticação — também
    >   `.specs/features/auth-cookie-httponly/design.md`; "Regras derivadas do ADR (§ CSS)" →
    >   "Regras derivadas de CLAUDE.md § Restrições Absolutas (CSS)".
    > - Próximas features a processar (uma por sessão): `auth-cookie-httponly` e
    >   `markdown-rendering` (este último também tem `tasks.md` com referência ADR, conforme
    >   a EXCEÇÃO descrita na Etapa 2 — renomear seção "ADR Update" para "ARCHITECTURE.md Update").
    >
    > `auth-cookie-httponly` concluído em 2026-06-13 (2 de 3 features). Observações:
    >
    > - `spec.md`: cabeçalho "Fonte: docs/adr/..." → "Convenções: CLAUDE.md § Restrições
    >   Absolutas (localStorage/sessionStorage para JWT proibido) +
    >   .specs/codebase/ARCHITECTURE.md#autenticação--fluxo-modelo-atual"; trecho do Problem
    >   Statement que dizia "O ADR-0001 foi atualizado para mover o JWT..." → reescrito como
    >   "A decisão do projeto (ver CLAUDE.md § Restrições Absolutas) é mover o JWT...".
    > - `design.md`: já era praticamente autocontido — só a frase "não depende de
    >   docs/adr/ADR-0001-arquitetura-base.md" foi generalizada para "a implementação não
    >   depende de documentos externos a .specs/" (sem citar `docs/adr/` para passar no grep
    >   final).
    > - `tasks.md` desta feature não tinha referências ADR (confirmado via grep) — nada a fazer.
    > - Falta apenas `markdown-rendering` (3 de 3), que tem a EXCEÇÃO de renomear "ADR Update"
    >   → "ARCHITECTURE.md Update" em design.md + tasks.md T1, conforme descrito na Etapa 2.
    > - Drift não tratado nesta sessão (fora do escopo da Etapa 2): `feed-publico/spec.md` linha
    >   72 ainda referencia `docs/api/openapi.yaml` (caminho do ADR) em vez de `api/openapi.yaml`
    >   real — já registrado em `.specs/codebase/CONCERNS.md`, mas pode valer corrigir junto numa
    >   passada futura.
    >
    > `markdown-rendering` concluído em 2026-06-13 (3 de 3 features — Etapa 2 completa).
    > Observações (com EXCEÇÃO aplicada):
    >
    > - `spec.md`: cabeçalho "ADR canônico" → "Convenções: CLAUDE.md § Restrições Absolutas +
    >   .specs/codebase/ARCHITECTURE.md + .specs/codebase/CONVENTIONS.md"; P1 renomeado para
    >   "ARCHITECTURE.md/CONVENTIONS.md e contrato atualizados", com User Story/Why/Acceptance
    >   Criteria/Independent Test apontando para `.specs/codebase/ARCHITECTURE.md` (novo
    >   Identified Pattern) e `.specs/codebase/CONVENTIONS.md` § Hard Constraints (+ versão
    >   condensada em `CLAUDE.md`); MDR-08 reescrito na tabela de Requirement Traceability.
    > - `design.md`: tabela "Integration Points" trocou a linha do ADR por duas linhas
    >   (`.specs/codebase/ARCHITECTURE.md` + `.specs/codebase/CONVENTIONS.md`); seção
    >   "## ADR Update" → "## ARCHITECTURE.md Update — Pattern a adicionar em
    >   .specs/codebase/ARCHITECTURE.md" (EXCEÇÃO da Etapa 2), mantendo a tabela técnica de
    >   dimensões (O quê, Policy, DOMPurify, CSP, Fallback, ALLOWED_TAGS, Proibido); seção
    >   "Atualização em Restrições Absolutas" → "Atualização em CONVENTIONS.md / CLAUDE.md",
    >   explicando o fluxo CONVENTIONS.md (completo) → CLAUDE.md (condensado).
    > - `tasks.md`: T1 renomeado para "Atualizar ARCHITECTURE.md/CONVENTIONS.md/CLAUDE.md com
    >   pattern Markdown Rendering" (EXCEÇÃO da Etapa 2), com Where/Reuses/Done
    >   when/Verify apontando para os 3 documentos; linha T1 da tabela "Test Co-location
    >   Validation" atualizada de "docs/ADR" para ".specs/codebase + CLAUDE.md".
    > - Confirmado via grep: nenhuma referência a `adr-0001`/`docs/adr` restante em
    >   `.specs/features/markdown-rendering/`.
- [x] Verificação final (grep)
    > Executada em 2026-06-13.
    >
    > - `grep -ri "adr-0001\|docs/adr" CLAUDE.md .specs/features/ -r` → **nenhum resultado**.
    >   Migração ADR-0001 → CLAUDE.md + `.specs/features/` concluída para as 3 features
    >   (`feed-publico`, `auth-cookie-httponly`, `markdown-rendering`), conforme o escopo
    >   da Etapa 2.
    > - `grep -ri "adr-0001\|docs/adr" CLAUDE.md .specs/ -r` (escopo amplo do playbook, linha
    >   217) **ainda retorna resultados**, todos em `.specs/codebase/*` (CONCERNS.md,
    >   CONVENTIONS.md, INTEGRATIONS.md, STRUCTURE.md). São referências geradas na Etapa 0
    >   (brownfield mapping) e **intencionais**: CONVENTIONS.md cita ADR-0001 como fonte
    >   histórica da tabela "Hard Constraints" já copiada; STRUCTURE.md/CONCERNS.md/
    >   INTEGRATIONS.md documentam o ADR-0001 como "snapshot histórico" e registram drifts
    >   (OpenAPI 3.1.0 vs. 3.0.3, modelo sessionStorage superseded). Nenhuma é um ponteiro
    >   vivo que um agente seguiria para implementação — não fazem parte do escopo da
    >   Etapa 2 (`.specs/features/*`) e não foram alteradas nesta sessão.
    > - `docs/adr/ADR-0001-arquitetura-base.md` permanece apenas como snapshot histórico
    >   para leitura humana, conforme as "Regras permanentes pós-migração" deste playbook.

---

## Etapa 0 — Map codebase

```markdown
Map codebase: gere os 7 docs em `.specs/codebase/` — STACK.md, ARCHITECTURE.md,
CONVENTIONS.md, STRUCTURE.md, TESTING.md, INTEGRATIONS.md, CONCERNS.md —
seguindo os templates e limites de `references/brownfield-mapping.md`
(STACK 2k, ARCHITECTURE 4k, CONVENTIONS 3k, STRUCTURE 2k, TESTING 4k,
INTEGRATIONS 5k, CONCERNS 5k tokens).

Fontes: `docs/adr/ADR-0001-arquitetura-base.md` (decisões documentadas) +
código real (public/js/, api/, tests/, package.json, .spectral.yaml,
api/openapi.yaml, docs/DESIGN.md). Onde o ADR descreve algo que ainda NÃO
existe no código, marque como "decidido, não implementado" — não apresente
como convenção observada.

Roteamento de conteúdo (ADR-0001 → doc):

- Estrutura de Módulos → STRUCTURE.md (Where Things Live)
- Roteamento, Component Pattern, State Management, View Lifecycle, Error
  Handling Global, Lazy Loading, Segurança XSS (data flow) → ARCHITECTURE.md,
  como "Identified Patterns" (Location/Purpose/Implementation/Example —
  referência a arquivo real, não copie código inteiro)
- Tooling → STACK.md (lista de ferramentas-alvo) + TESTING.md (estado real:
  hoje só `test`/`test:coverage` existem em package.json; demais →
  CONCERNS.md como gap)
- API Contract + Autenticação → INTEGRATIONS.md, com caminho/versão REAIS
  (`api/openapi.yaml`, OpenAPI 3.0.3 — NÃO o que o ADR diz:
  docs/api/openapi.yaml@3.1.0)
- Autenticação: NÃO copie a seção "json-server-auth/sessionStorage" do ADR
  (modelo superseded). Em INTEGRATIONS.md, aponte para
  `.specs/features/auth-cookie-httponly/design.md` como modelo atual.
- CSS: NÃO duplique a tabela de tokens (já está em docs/DESIGN.md). Em vez
  disso, ADICIONE a docs/DESIGN.md as regras que faltam (rem-only, proibição
  de border-radius/box-shadow/gradiente, @property, prefers-reduced-motion,
  prefers-color-scheme) como novas linhas da tabela de verificação já
  existente ali.

CONVENTIONS.md — seção obrigatória "## Hard Constraints (MUST / MUST NOT)":
copie a tabela completa "Restrições Absolutas" do ADR-0001 (todas as ~25
linhas, Proibido | Alternativa obrigatória). Esta seção é a ÚNICA fonte para
a Etapa 1 gerar o CLAUDE.md — depois desta etapa, o ADR-0001 não é mais lido.

CONCERNS.md — registre com evidência (arquivo/linha):

- Drift OpenAPI (caminho/versão real vs. ADR)
- Tooling planejado vs. configurado (lint, lint:api, test:e2e, test:a11y,
  format, mock:api ausentes em package.json)
- Auth: seção do ADR superseded pela feature auth-cookie-httponly
- ADR-0002-component-pattern.md vazio ("futuras decisões separadas")

A partir do fim desta etapa, `docs/adr/ADR-0001-arquitetura-base.md` não é
mais lido em nenhuma etapa seguinte.
```

---

## Etapa 0c — Initialize project

```markdown
Initialize project: gere `.specs/project/PROJECT.md` e
`.specs/project/ROADMAP.md` (limites 2k e 3k tokens), usando como fontes
APENAS `.specs/codebase/*` (gerados na Etapa 0), `.specs/features/*` e
`.specs/project/STATE.md`. NÃO leia docs/adr/.

PROJECT.md:

- Vision/For/Solves — rascunhe a partir de
  `.specs/codebase/STACK.md`/`ARCHITECTURE.md`. Depois me pergunte até 3
  perguntas objetivas (conforme references/project-init.md): Goals
  mensuráveis, Scope v1 vs. fora de escopo, Constraints.
- Tech Stack — copie o resumo de STACK.md.

ROADMAP.md:

- Milestone atual + Features com status PLANNED/IN PROGRESS/COMPLETE,
  derivado do "Status geral" de cada `.specs/features/*/tasks.md` e das
  prioridades P1/P2/P3 de cada `spec.md`.
- "Future Considerations" — extraia de `STATE.md § Ideias Deferidas` e de
  itens P2/P3/fora-de-escopo mencionados nas specs.
```

---

## Etapa 1 — `/init` → CLAUDE.md

```markdown
/init

Gere CLAUDE.md na raiz, NO MÁXIMO 200 linhas, usando como fontes APENAS:
`.specs/project/{PROJECT,ROADMAP,STATE}.md`, `.specs/codebase/*.md` (gerados
nas etapas anteriores) e o `package.json` real. NÃO leia docs/adr/.

Conteúdo:

1. Visão geral (2-3 linhas) — de PROJECT.md § Vision.
2. Comandos — apenas scripts reais de package.json hoje; nota sobre os
   planejados (ver .specs/codebase/TESTING.md + CONCERNS.md).
3. "Restrições Absolutas" — versão CONDENSADA de
   `.specs/codebase/CONVENTIONS.md § Hard Constraints`. Adicione nota:
   "lista completa + exemplos em .specs/codebase/CONVENTIONS.md; toda nova
   regra MUST entra primeiro lá, depois condensada aqui."
4. Convenções rápidas — estrutura de pastas (de STRUCTURE.md) e padrão de
   testes (de TESTING.md).
5. Ponteiros, sem copiar conteúdo: - `.specs/project/{PROJECT,ROADMAP,STATE}.md` - `.specs/codebase/{STACK,ARCHITECTURE,CONVENTIONS,STRUCTURE,TESTING,
INTEGRATIONS,CONCERNS}.md` - `docs/DESIGN.md` - `api/openapi.yaml` + `.spectral.yaml` - `.specs/features/`

PROIBIDO: qualquer menção a `docs/adr/` ou `ADR-0001`.
```

---

## Etapa 2 — Atualizar `.specs/features/`

```markdown
Pré-requisito: CLAUDE.md + .specs/project/_ + .specs/codebase/_ existem e
foram revisados.

Para cada feature (auth-cookie-httponly, feed-publico, markdown-rendering),
em spec.md e design.md: troque referências a
docs/adr/ADR-0001-arquitetura-base.md por:

- CLAUDE.md § Restrições Absolutas — regra MUST/MUST NOT do cheat-sheet
- .specs/codebase/ARCHITECTURE.md#<pattern> — padrão de implementação
- .specs/codebase/CONVENTIONS.md — regra de estilo/convenção completa
- .specs/codebase/STRUCTURE.md — localização de módulo

feed-publico/design.md: na tabela "Decisões arquiteturais", mantenha o texto
da decisão e troque a coluna "Fundamento no ADR" pelo ponteiro acima.

EXCEÇÃO markdown-rendering: renomeie a seção "ADR Update" (design.md) e a
task T1 (tasks.md) para "ARCHITECTURE.md Update". T1 passa a:

- adicionar o pattern "Markdown Rendering / Trusted Types policy" em
  .specs/codebase/ARCHITECTURE.md
- adicionar a regra "innerHTML só via policy md-renderer" em
  .specs/codebase/CONVENTIONS.md § Hard Constraints
- adicionar a mesma regra (condensada) na tabela "Restrições Absolutas" do
  CLAUDE.md

Processe uma feature por vez (turnos/sessões separadas).
```

---

## Verificação final

```bash
grep -ri "adr-0001\|docs/adr" CLAUDE.md .specs/ -r
# esperado: nenhum resultado
```

---

## Regras permanentes pós-migração

- Agentes **nunca** leem `docs/adr/ADR-0001-arquitetura-base.md`.
- Se faltar contexto durante uma task → registrar em `STATE.md`/`CONCERNS.md`,
  perguntar ao humano, ou seguir com `SPEC_DEVIATION` documentado. Nunca abrir
  o ADR como "última saída".
- Toda nova regra `MUST` → primeiro em `.specs/codebase/CONVENTIONS.md § Hard
Constraints` (completo), depois condensada em `CLAUDE.md § Restrições
Absolutas`.
- Toda nova feature/spec → referencia `CLAUDE.md` / `.specs/codebase/*` /
  `.specs/project/*`, nunca `docs/adr/`.
- `ADR-0001` vira snapshot histórico — o humano pode editar livremente, sem
  sincronia automática com `.specs/` (re-sync é tarefa manual, fora deste
  playbook).

## Carga de contexto esperada (sessão de execução de feature)

| Arquivo                                                                | Carga   | Quando                          |
| ---------------------------------------------------------------------- | ------- | ------------------------------- |
| `CLAUDE.md`                                                            | ~1.5-2k | sempre (automático)             |
| `.specs/project/STATE.md`                                              | até 10k | sempre                          |
| `.specs/features/<feature>/{spec,design,tasks}.md`                     | até 23k | sempre, da feature ativa        |
| `.specs/codebase/TESTING.md`                                           | até 4k  | sempre, para gates              |
| `.specs/codebase/{ARCHITECTURE,CONVENTIONS,STRUCTURE,INTEGRATIONS}.md` | até 14k | on-demand, só a seção relevante |

Total típico: ~35-40k sem on-demand, ~50k com 1-2 docs de codebase abertos —
zona verde/amarela de 200k.
