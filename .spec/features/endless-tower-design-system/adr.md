<!-- onp-spec:documentation-contract=v1 -->

# ADR: endless tower design system

> feature: endless-tower-design-system
> status: revisado

[PRD](prd.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)

## Identificação e contexto

- **Identificador**: ADR-ET-001 — Arquitetura de Escopo Estrito e Não-Interferência do Design System Celestial
- **Data**: 2026-11-11
- **Responsáveis**: Vitor Manoel (O Novo Programador), Antigravity Pair Assistant
- **Domínios**: `ui`, `chat`, `audio`, `foundry-v13`
- **Contexto**: O projeto Endless Tower necessita de uma identidade visual unificada ("Celestial Chronicle"), mas o ecossistema do Foundry VTT v13 abriga mais de 50 módulos e o sistema de regras D&D 5e em um DOM global compartilhado. Estilos genéricos em elementos HTML brutos geraram regressões severas (desaparecimento de ícones, campos esticados, quebra de layout no Token Action HUD e nas fichas de personagem).

## Restrições e regras anteriores

- **P-001**: Todo requisito deve ter prova automatizada executável.
- **P-003**: A lógica matemática e o controle de áudio devem permanecer desacoplados de variáveis globais do Foundry (`game`, `canvas`, `Hooks`).
- **P-004**: Reversibilidade visual mandatória em 3 níveis (Settings, API toggle e limpeza em `canvasTearDown`).
- **P-005**: Anúncios e avisos épicos devem adotar exclusivamente o padrão Edge-to-Edge Ribbon (100vw, sem bordas laterais, backdrop-filter blur e título em linha única).
- **P-008**: Protocolo HITL estrito para commits no Git.
- **Multi-Module Coexistence**: Nenhuma estilização proprietária pode quebrar janelas nativas do core (`Configure Settings`), fichas de ator (`.sheet`), o módulo Token Action HUD (`#token-action-hud`) ou o YouTube Player (`#youtube-player`).

## Alternativas consideradas

1. **Alternativa 1 — Escopo Mínimo (Utility CSS solto)**:
   - *Descrição*: Criar apenas variáveis CSS (`--et-*`) e classes utilitárias isoladas sem padronização de componentes nem proteção explícita para outros módulos.
   - *Prós*: Baixo esforço inicial.
   - *Contras*: Risco constante de novos módulos introduzirem seletores universais; sem proteção estrutural para ícones e sem governança de componentes.
2. **Alternativa 2 (Escolhida) — Governança Expandida (Strict Component Scoping + Font Shielding + 3-Level Reversibility)**:
   - *Descrição*: Proibir terminantemente seletores de tag HTML universais (`button`, `input`, `select`, `textarea`, `.window-app`). Exigir classes com namespace estrito (`.et-btn`, `.et-input`, `.et-select`, `.et-window`). Blindar incondicionalmente a família de fontes FontAwesome contra sobrescrita tipográfica. Preservar o visual nativo das fichas D&D 5e e janelas do sistema. Desacoplar áudio de cliques genéricos e implementar testes automatizados contra regressões CSS.
   - *Prós*: Eliminação total de efeitos colaterais em módulos de terceiros, preservação dos ícones, estabilidade em atualizações do Foundry, 100% testável via Vitest.
   - *Contras*: Requer disciplina dos desenvolvedores na aplicação das classes `.et-*`.
3. **Alternativa 3 — Sobrescrita Global Total (Hard Theme)**:
   - *Descrição*: Forçar estilos escuros e fontes cinematográficas em todos os elementos da página indiscriminadamente.
   - *Prós*: Cobertura rápida de todas as janelas do Foundry.
   - *Contras*: Quebra irreparável de mais de 20 módulos ativos, deformação de fichas e perda de legibilidade em formulários de configuração. (Rejeitada sumariamente após teste prático).

## Decisão e justificativa

Decidiu-se pela **Alternativa 2 (Governança Expandida)**.
- **Justificativa**: O Foundry VTT não utiliza Shadow DOM para encapsular o estilo de suas aplicações; todo o CSS reside em um escopo global. No Foundry v13, aplicar `font-family` ou dimensões globais a `button` ou `input` corrompe a fonte FontAwesome (transformando ícones de dados, ferramentas e atalhos em glifos ausentes `[X]`), deforma caixas de diálogo nativas e sobrepõe controles do Token Action HUD. O modelo de escopo estrito `.et-*` com blindagem FontAwesome e não-interferência em fichas (`.sheet`) garante fidelidade visual de alto padrão com zero impacto colateral no restante da plataforma.

## Consequências e riscos

- **Ganhos**:
  - Restauração imediata de todos os ícones da interface do Foundry.
  - Janelas de configurações e fichas de personagens permanecem 100% estáveis e funcionais.
  - Eliminação de cliques acidentais e sons de clique irritantes.
  - Banners e cards do chat com visual cinematográfico consistente e legível.
- **Custos e Regras para o Futuro**:
  - Toda nova janela ou modal criada pela Endless Tower deve herdar a classe `.et-window` ou `.et-dialog`.
  - Formulários personalizados da Torre devem usar `.et-form-group`, `.et-input`, `.et-select` e `.et-btn`.
- **Mitigação de Riscos**:
  - Criar teste automatizado em `tests/design-system.test.ts` que escaneia as folhas de estilo do módulo e o bundle gerado, falhando o build caso surjam seletores desprotegidos em tags HTML nuas.

## Validade, revisão e substituição

Esta decisão permanece válida durante todo o ciclo de vida do Foundry VTT v13 e para todas as novas interfaces desenvolvidas no módulo Endless Tower. Deverá ser revisada caso o Foundry VTT v14 migre nativamente para Shadow DOM em todos os componentes ou se o sistema D&D 5e adotar um framework de temas com suporte a temas dinâmicos isolados.

## Respostas e aprovação

- **Sessão de Alinhamento**: `/grill-me` em 2026-11-11.
- **Resposta do Usuário**: Aprovado o escopo com remoção do clique de botão, retorno das fichas ao padrão original, correção de largura das configurações, preservação do YouTube Player e implementação da suíte de testes do Design System.

## Documentos relacionados

[PRD](prd.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)
