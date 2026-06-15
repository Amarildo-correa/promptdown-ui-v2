---
name: rules-ai
description: 'Aplica convenções de escrita de Markdown destinado a consumo por IA — não por humanos. Use sempre que for criar, editar ou revisar qualquer arquivo .md que será lido por um modelo de linguagem: CLAUDE.md, skills, ADRs, context files, commands, docs de arquitetura, project-state, active-decisions, templates, ou qualquer documento de engenharia de contexto. Use também quando o usuário mencionar "arquivo para IA", "md para Claude Code", "contexto de projeto", "escrever seguindo as regras de IA", "documentação para LLM", ou pedir para criar/revisar documentação técnica que o Claude vai ler.'
---

# Convenções de Markdown para Consumo por IA

**Princípio central:** estrutura semântica explícita > legibilidade visual.

O leitor é um modelo de linguagem. Todas as decisões de formato `MUST` favorecer parsing mecanicista, não apresentação visual.

---

## Por que tabelas funcionam melhor para IA

Ao revisar ou criar arquivo `.md` para consumo por IA, `MUST` preferir tabelas a prosa sempre que correlação, classificação ou decisão estiver envolvida.

Tabelas permitem parsing **mecanicista** — modelo não precisa especular sobre estrutura implícita.

| Quando arquivo usa | O modelo consegue                   | Benefício                                                        |
| ------------------ | ----------------------------------- | ---------------------------------------------------------------- |
| Tabelas            | Parse de colunas sem ambiguidade    | Não inferir categorias implícitas                                |
| Tabelas            | Correlacionar linhas explicitamente | Célula = unidade atômica de significado                          |
| Tabelas            | Reconhecer padrões mecanicamente    | "Se Verificação = X, então Resultado = Y"                        |
| Tabelas            | Referenciar com precisão            | "seção Cache, linha 3, coluna Implicação"                        |
| Prosa              | Inferir estrutura enquanto lê       | ❌ Especulação contínua sobre categorias, precedência, estrutura |

| Métrica                     | Tabela                     | Prosa                          |
| --------------------------- | -------------------------- | ------------------------------ |
| Parse mecânico              | Trivial — colunas = struct | Inferência necessária          |
| Correlação entre itens      | Explícita na linha         | Implícita (pronomes, contexto) |
| Referência futura           | "linha 3, col 2" — precisa | "aquele parágrafo..." — frágil |
| Escalabilidade (50+ linhas) | Continua claro             | Inlegível                      |
| Detecção de inconsistência  | Coluna irregular é óbvia   | Escondida em prosa             |

**Instrução:** `MUST` consolidar inventários, decisões, regras e estado em tabelas. `MUST NOT` deixar em prosa quando houver correlação entre items.

---

## Regra principal: quando usar cada formato

| Situação                                      | Ação                                                               | Restrição                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Fluxo com múltiplos atores em ordem temporal  | Usar `sequenceDiagram` Mermaid                                     | Atores `MUST` estar presentes; ordem temporal `MUST` ser clara               |
| Fluxo com condicionais (HIT/MISS, alt/else)   | Usar `sequenceDiagram` com blocos `alt`/`else`                     | Cada branch `MUST` ser executável                                            |
| Inventário, componentes, decisões (sem fluxo) | Consolidar em **tabela Markdown**                                  | Colunas `MUST` ser consistentes em toda linha; `MUST NOT` misturar formatos  |
| Sequência linear, um ator, sem ramificação    | Prosa ou lista numerada                                            | Prosa só se explicação > 3 linhas; lista se puro inventário                  |
| Regras de verificação, condicionais IF/THEN   | Tabela com colunas **Verificação \| Resultado esperado**           | Cada célula `MUST` ser atômica e acionável                                   |
| Estado de arquivos, serviços, módulos         | Tabela com coluna **Estado**                                       | `MUST NOT` usar checkboxes `- [ ]` para estado (checkboxes sinalizam tarefa) |
| Definição de template, instruções de uso      | Frontmatter YAML + prosa explicativa                               | `MUST NOT` colocar `/** ... */` ou `// ...` — IA lê como conteúdo literal    |
| Fluxo visual (swimlanes, hierarquia)          | `MUST NOT` usar `flowchart` Mermaid                                | `flowchart` é para humanos; use `sequenceDiagram` ou tabela                  |
| ASCII art (árvores de diretório)              | `MUST NOT` usar `├──`, `└──`, `│`                                  | Reescrever como tabela com coluna Responsabilidade                           |
| Obrigações, proibições, restrições            | Usar vocabulário normativo `MUST`, `MUST NOT`, `SHALL` em backtick | Termos normativos `MUST` estar em backtick para parsing semântico            |

---

## Consolidação em tabelas: padrões práticos

| Padrão                         | Aplicação                                                       | Exemplo                                                                                                     |
| ------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Agrupar por categoria**      | Múltiplas decisões sobre um tema (autenticação, cache, módulos) | Coluna 1 = Área, Coluna 2 = Decisão, Coluna 3 = Implicação                                                  |
| **Evitar redundância com "—"** | Quando múltiplas linhas pertencem à mesma categoria             | `Autenticação` → `JWT em cookie` → `Secure MUST estar`, depois linha `—` → `—` → `SameSite MUST ser Strict` |
| **Coluna "Quando"**            | Regras contextuais (válido em situação X, proibido em Y)        | `innerHTML` com dados de usuário = `MUST NOT`, com string estática = Aceitável                              |
| **Coluna "Observação"**        | Estados complexos que precisam contexto                         | `auth` = `Em andamento` + obs: "JWT pronto, falta refresh token"                                            |
| **Estado vs Tarefa**           | Representar fato atual, não trabalho pendente                   | Tabela com coluna Estado (Implementado/Em andamento/Não iniciado); `MUST NOT` usar checkboxes               |

---

## Formatação inline: quando usar cada elemento

| Elemento         | Quando usar                                                        | Restrição                                       |
| ---------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `` `backtick` `` | Nomes de arquivo, caminhos, comandos, valores de config, variáveis | Sempre para código, chaves, constantes          |
| `**Negrito**`    | Sinalizar restrições absolutas (NUNCA, VIOLAÇÃO)                   | `MUST NOT` usar para ênfase retórica            |
| _Itálico_        | `MUST NOT` usar — IA não distingue ênfase de conteúdo              | Use negrito ou backtick em vez                  |
| `## Cabeçalho`   | Seções principais do documento                                     | `MUST NOT` usar para sub-ênfase dentro de prosa |

---

## Mermaid: `sequenceDiagram` (o único tipo permitido)

| Situação                                            | Ação                                        | Restrição                                                      |
| --------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| Dois ou mais atores em ordem temporal               | Usar `sequenceDiagram`                      | Bloco `MUST` iniciar com ` ```mermaid ` (não genérico ` ``` `) |
| Condicionais entre atores (HIT/MISS, sucesso/falha) | Usar blocos `alt`/`else` dentro do diagrama | Cada branch `MUST` representar caminho executável              |
| Fluxo de dados, requisição/resposta                 | Setas `->>`/`-->>` entre atores             | Ordem temporal `MUST` ser inequívoca                           |

**Proibido:**

| Uso                                  | Por quê                                                   | Alternativa                        |
| ------------------------------------ | --------------------------------------------------------- | ---------------------------------- |
| `flowchart` Mermaid                  | Projetado para clareza visual humana, não para LLM        | Usar `sequenceDiagram` ou tabela   |
| Listas de componentes sem interação  | Sem comunicação entre atores = sem semântica de sequência | Tabela Markdown                    |
| Sequências lineares de um único ator | Sem ramificação = prosa é suficiente                      | Prosa ou lista numerada            |
| Estrutura de diretórios (`graph TD`) | IA não parseia hierarquia visual                          | Tabela com coluna Responsabilidade |

---

## Vocabulário normativo RFC 2119

Sempre que um arquivo `.md` for destinado a consumo por IA e contiver obrigações, `MUST` usar termos normativos em backtick.

| Termo            | Semântica                         | Quando usar                                          | Exemplo                           |
| ---------------- | --------------------------------- | ---------------------------------------------------- | --------------------------------- |
| `` `MUST` ``     | Obrigação absoluta — sem exceção  | Regra que, se violada, torna output incorreto        | `` `MUST` usar ES Modules ``      |
| `` `MUST NOT` `` | Proibição absoluta — sem exceção  | Padrão proibido que invalida o output                | `` `MUST NOT` usar `require()` `` |
| `` `SHALL` ``    | Obrigação por contrato de negócio | Requisito derivado de decisão registrada (ADR, spec) | ``Cache `SHALL` ter TTL de 24h``  |

**Comparação:**

| Tipo                 | Ambíguo para IA                             | Semântica inequívoca                                                                 |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Restrição técnica    | "Sempre use ES Modules. Não use require()." | "O projeto `MUST` usar ES Modules. `require()` `MUST NOT` aparecer."                 |
| Obrigação de negócio | "O cache deve usar TTL de 24h."             | "Cache `SHALL` aplicar TTL de 24h em todas as chaves de sessão."                     |
| Condição permitida   | "Se for string estática, innerHTML é ok."   | "`` `innerHTML` com string estática = Aceitável`` (em tabela Verificação/Resultado)" |

---

## Quando usar RFC 2119

RFC 2119 tem impacto **MÉDIO** em arquivos `.md` para consumo por IA — não é transformador como tabelas, mas é crítico em contextos específicos onde obrigação vs. recomendação precisam ser inequívocas.

### Use RFC 2119 nestes contextos

| Contexto                                     | Impacto    | Razão                                                                              |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| Tabelas de verificação/resultado             | MUITO ALTO | Célula atômica; modelo mapeia `Verificação` → `Resultado esperado` sem ambiguidade |
| Decisões arquiteturais (coluna `Implicação`) | MUITO ALTO | `` `MUST` `` em implicação vincula decisão a restrição executável                  |
| `CLAUDE.md` e arquivos de configuração       | MUITO ALTO | Modelo precisa parsing inequívoco de restrições técnicas para seguir regra         |
| Frontmatter de template ou skill             | ALTO       | Sinaliza obrigações de uso, não apenas recomendações                               |

### Não use RFC 2119 nestes contextos

| Contexto                               | Impacto | Razão                                                                             |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| Prosa explanatória                     | BAIXO   | Ambiguidade persiste; mesmo com `` `MUST` ``, sentença exige inferência de escopo |
| Termos normativos sem backtick         | ZERO    | Modelo trata como texto comum; backtick é obrigatório                             |
| Como ênfase retórica (ex: `**NUNCA**`) | ZERO    | Negrito invisível para modelo; `` `MUST NOT` `` é 100× mais claro                 |
| Documentação educacional/descritiva    | BAIXO   | RFC 2119 em contexto educacional não muda parsing semântico                       |

### Referência rápida — Impacto comparativo

| Formato               | Impacto         | Exemplo                                       |
| --------------------- | --------------- | --------------------------------------------- |
| RFC 2119 em tabela    | 60-70% relativo | `Resultado esperado: MUST NOT usar require()` |
| RFC 2119 em prosa     | 20-30% relativo | "O arquivo `MUST` usar ES Modules."           |
| Negrito sem RFC 2119  | 0%              | "Sempre use **ES Modules**"                   |
| Backtick sem RFC 2119 | 40% relativo    | "Use `require()` para imports"                |

**Regra simples:** `` `MUST` ``, `` `MUST NOT` ``, `` `SHALL` `` em backtick dentro de tabelas = máximo impacto. Em prosa = impacto reduzido. Sem backtick = sem impacto.

---

## Estrutura de diretórios

`MUST NOT` usar ASCII art (`├──`, `└──`, `│`). IA lê como texto decorativo sem semântica.

| Diretório / Arquivo | Responsabilidade                                |
| ------------------- | ----------------------------------------------- |
| `src/routes/`       | Definição de endpoints — sem lógica de negócio  |
| `src/services/`     | Lógica de negócio e acesso a dados              |
| `src/middleware/`   | Autenticação, validação, logging                |
| `src/models/`       | Estrutura de dados, schemas, validação de shape |
| `docs/decisions/`   | ADRs — decisões arquiteturais registradas       |

---

## Estado de serviços vs backlog

| Cenário                                               | Formato                            | Restrição                                                       |
| ----------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| Representar fato atual (módulo existe mas incompleto) | Tabela com coluna Estado           | `MUST NOT` usar checkboxes `- [ ]` — sinalizam tarefa, não fato |
| Listar trabalho a executar (backlog real)             | Lista numerada simples             | Sem checkbox; apenas prioridade e descrição                     |
| Rastrear progresso de tarefa                          | TodoWrite (ferramenta de tracking) | Fora do escopo de arquivos `.md` para IA                        |

**Exemplo — Estado de módulo:**

| Módulo          | Estado       | Observação                           |
| --------------- | ------------ | ------------------------------------ |
| `auth`          | Implementado | JWT em cookie; refresh token pending |
| `posts`         | Em andamento | CRUD pronto, falta paginação         |
| `notifications` | Não iniciado | Fase 2 — aguarda requisitos          |

---

## Templates e frontmatter

| Elemento          | Ação                                | Restrição                                                             |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------- |
| Instruções de uso | Colocar em frontmatter YAML (`---`) | `MUST NOT` usar blocos de comentário (`/** ... */`, `// ...`) no topo |
| Descrição         | Campo `description:` no frontmatter | IA lê como instrução, não conteúdo                                    |
| Exemplo           | Campo `example:` ou `usage:`        | Facilita instanciação                                                 |

**Template padrão:**

```yaml
---
description: Documento para registrar decisão arquitetural
usage: Copie para docs/decisions/ADR-<número>-<slug>.md
example: ADR-002-mysql-fase2.md
---
```

---

## Referências internas entre arquivos

| Situação                                     | Ação                                                                 | Restrição                                                       |
| -------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| Referenciar seção de outro arquivo           | Usar nome legível: "docs/architecture.md, seção **Regras de Cache**" | `MUST NOT` usar âncora gerada (`#regras-de-cache`) — pode mudar |
| Referenciar linha específica dentro de skill | Usar "seção X, linha Y, coluna Z"                                    | Permite rastreamento semântico sem URL frágil                   |
| Linkage entre skills                         | Usar `[[skill-name]]` em documentação descritiva                     | IA reconhece como referência cruzada                            |

---

## Checklist de validação

Antes de considerar um arquivo `.md` pronto para consumo por IA, `MUST` verificar:

| Verificação                                                  | Resultado esperado                                                          |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Existe uma prosa explanatória em prosa > 5 linhas?           | Reescrever como tabela ou diagrama `sequenceDiagram`                        |
| Checkboxes `- [ ]` representando estado?                     | `MUST NOT` — reescrever como tabela com coluna Estado                       |
| Termos como "sempre", "nunca", "deve" sem RFC 2119?          | `MUST NOT` — usar `` `MUST` ``, `` `MUST NOT` ``, `` `SHALL` `` em backtick |
| Termos normativos sem backtick?                              | `MUST NOT` — `` `MUST` `` explicitamente marcado                            |
| ASCII art de diretório?                                      | `MUST NOT` — reescrever como tabela                                         |
| Múltiplas seções com formato inconsistente (prosa + tabela)? | `MUST` consolidar em formato único                                          |
| Blocos `/** ... */` ou `// ...` no topo de arquivo?          | `MUST NOT` — mover para frontmatter YAML                                    |
| `flowchart` ou `graph` Mermaid?                              | `MUST NOT` — usar `sequenceDiagram` ou tabela                               |
| Referências com âncora (`#regras-cache`)?                    | `MUST NOT` — usar nome legível de seção                                     |
