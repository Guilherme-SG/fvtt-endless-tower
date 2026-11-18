---
trigger: always_on
---
# Padrão Oficial de Arquitetura e Código (Vertical Slices + Functional Core)

Ao planejar, criar ou refatorar qualquer feature em `src/features/`, estas diretrizes são bloqueantes:

1. **Arquitetura (Vertical Slices + Functional Core)**:
   Toda nova feature deve residir em `src/features/<feature-name>/` e ser dividida estritamente em:
   - `config.ts`: Única fonte de constantes, caminhos de assets/áudio, DCs, durações e textos de UI (`UI_TEXT` tipado com `as const`). Proibido magic strings ou magic numbers fora deste arquivo.
   - `rules.ts`: Lógica pura em TypeScript. Proibido importar ou referenciar globais do Foundry (`game`, `canvas`, `Hooks`, `ui`, `ChatMessage`).
   - `adapter.ts`: Camada fina que escuta hooks do Foundry/módulos, extrai dados, chama `rules.ts` e executa side-effects.
   - `index.ts`: Exporta a função de inicialização da feature.

2. **Idioma**:
   - **Inglês (obrigatório para código)**: Nomes de arquivos, pastas, identificadores, variáveis, funções, tipos, comentários de código e logs de console devem ser escritos sempre em **Inglês**.
   - **Português do Brasil (exclusivo para jogador)**: Apenas textos visíveis ao jogador (UI, chat, banners, notificações e tooltips) devem ser em **Português do Brasil (PT-BR)**, agrupados em um objeto `UI_TEXT` (`as const`) dentro do `config.ts` da feature (exceto strings pré-jogo da tela `/join`, que seguem o padrão em inglês do Foundry).

3. **SOLID Pragmático (Anti-Overengineering)**:
   - Prefira funções puras e composição de tipos sobre hierarquias de classes.
   - Proibido criar interfaces para implementação única ou padrões GoF (`Factory`, `Strategy`, `Abstract*`) sem ao menos 3 casos de uso concretos no código.

4. **Regra de Migração (Boy Scout)**:
   - Não refatore features legadas em massa sem pedido explícito do usuário.
   - Aplique este padrão obrigatoriamente em toda feature nova ou quando uma feature legada for reescrita/refatorada.
