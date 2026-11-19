# Constituição — Endless Tower v1.1.0

<!--
  Princípios inegociáveis do projeto Endless Tower (FoundryVTT v13).
  P-xxx = princípio (código de rastreio, como US/AC/T).
  Níveis: [DEVE] obrigatório · [RECOMENDADO] forte · [PODE] permitido/explícito.
  Todo [DEVE] precisa de verificação executável — senão o audit acusa
  "princípio sem verificação" (PRINCIPIO_SEM_VERIFICACAO). Formatos:
    - verificação(gate): satisfeita pelo próprio audit (só p/ princípios "meta")
    - verificação(teste): @principle:P-xxx
    - verificação(proibido): `regex` em `glob`
    - verificação(obrigatório): `regex` em `glob`
-->

## P-001 [DEVE] Todo requisito tem prova executável

Nenhuma feature é declarada pronta sem o audit em modo CI sair limpo (exit 0).
Toda lógica de regras deve ser acompanhada de testes unitários automatizados vinculados aos critérios de aceitação.

- verificação(gate): intrínseca ao audit

## P-002 [RECOMENDADO] Segredos nunca em código

Chaves de API, senhas e credenciais vêm de variáveis de ambiente (`.env`), nunca hard-coded.

- verificação(proibido): `(api[_-]?key|senha|password)\s*[:=]\s*['"][^'"]{8,}` em `src/**/*.ts`

## P-003 [DEVE] Desacoplamento entre lógica de regras e hooks do Foundry (Vertical Slices + Functional Core)

Toda feature nova ou refatorada em `src/features/<feature-name>/` DEVE separar `config.ts` (constantes, DCs, caminhos de assets e `UI_TEXT` `as const`), `rules.ts` (lógica pura), `adapter.ts` (hooks e side-effects do Foundry) e `index.ts`. Lógica matemática de regras, cálculos de combate, probabilidades, baralhos de frases e mecânicas de bênçãos DEVEM residir em funções puras livres de referências globais (`game`, `canvas`, `Hooks`, `ui`, `ChatMessage`).

- verificação(teste): @principle:P-003

## P-004 [DEVE] Reversibilidade visual em três níveis

Qualquer efeito visual dinâmico (partículas em canvas, drift de câmera, ribbons, shaders ou filtros) DEVE fornecer três níveis estritos de reversibilidade imediata:
1. Configuração gráfica booleana em *Module Settings* (`game.settings.register`).
2. Método público de alternância idempotente na API do módulo (`api.toggle<Feature>()`).
3. Limpeza total de listeners, cancelamento de loops de animação (`cancelAnimationFrame`) e remoção de nós do DOM no hook `canvasTearDown` ou desativação.

- verificação(teste): @principle:P-004

## P-005 [DEVE] Padrão cinemático Edge-to-Edge Ribbon para anúncios

Avisos de combate épicos, chefes e alertas cinemáticos DEVEM usar o layout Edge-to-Edge Ribbon (largura `100vw`, fade gradiente horizontal nas extremidades, backdrop de vidro fosco com blur e títulos em linha única com `white-space: nowrap`). É terminantemente proibido o uso de caixas de diálogo ou modais flutuantes centralizados (`dialog boxes`) para anúncios cinemáticos.

- verificação(teste): @principle:P-005

## P-006 [DEVE] Estrutura padronizada e equilíbrio de tabelas críticas

Tabelas de acertos e falhas críticas (`data/tables/critical/`) DEVEM manter o título do efeito no campo `name` de cada entrada (sem duplicação com `<h3>` dentro de `description`) e usar a estrutura HTML semântica do Celestial Chronicle Design System (`.et-critical-table-card` com variante `.is-hit` ou `.is-fumble`), contendo parágrafo opcional `<p class="et-card-lore">`, bloco `<div class="et-card-mechanic">` utilizando notação de rolagem interativa do Foundry (`[[/save ...]]` ou `[[/check ...]]`) e `<div class="et-card-media">` preservando os `<img>` originais quando existentes, sem `style=` inline nem cores hexadecimais hardcoded.
As Classes de Dificuldade (DCs) DEVEM ser padronizadas:
- CD fixa **15** para testes de resistência ou perícias em acertos críticos.
- CD fixa **10** para testes de Constituição de recuperação em falhas críticas.

- verificação(teste): @principle:P-006

## P-007 [DEVE] Protocolo de segurança HITL para ferramentas do Foundry MCP

Ações modificadoras ou destrutivas no Foundry VTT (deleção ou alteração de tokens, atores, fichas, atributos, itens, periódicos ou cenas) NUNCA devem ser executadas de forma autônoma. O assistente DEVE obrigatoriamente pausar sua execução, detalhar as entidades afetadas e os campos a alterar, e aguardar confirmação explícita do usuário no chat.

- verificação(gate): intrínseca ao audit

## P-008 [DEVE] Fluxo de confirmação estrita para Git (HITL para commits)

Nenhum commit pode ser realizado de forma autônoma. Todo processo de gravação de versão DEVE obrigatoriamente seguir as 4 etapas com aprovação humana:
1. `git add` dos arquivos pertinentes.
2. Exibição do diff preparado (`git diff --cached`).
3. Proposta clara da mensagem de commit em português.
4. Aguardar aprovação explícita do usuário antes de rodar `git commit`.

- verificação(gate): intrínseca ao audit

## P-009 [DEVE] Otimização de mídia: WebP obrigatório para artes estáticas

Artes de fundo, paisagens, splash screens e banners de alta resolução DEVEM ser convertidos para o formato WebP (`.webp`) com compressão otimizada (`cwebp -q 90`). É proibido comitar arquivos pesados em PNG ou JPEG sem conversão para artes estáticas.

- verificação(proibido): `assets/screen-transition/.*\.(png|jpg|jpeg)` em `assets/screen-transition/*`

## P-010 [RECOMENDADO] Progressive HUD sobre remoção estrita

Em cenas imersivas e cutscenes, interfaces e HUDs essenciais (`#hotbar`, `#players`, `#controls`, `#navigation`) devem adotar opacidade atenuada (10% a 20%) com restauração suave para 100% sob hover (`:hover` ou `:focus-within`), evitando `display: none` rígido para não desorientar jogadores e Mestre.

## P-011 [DEVE] Governança Agêntica do Design System (W3C DTCG, WCAG 2.1, 60-30-10 e Anti-Box-in-Box)

Todo token visual e componente do Celestial Chronicle Design System DEVE ser governado pelo catálogo canônico W3C DTCG (`src/features/design-system/agentic-tokens.ts`) em sincronia 1:1 com os arquivos CSS e aprovado deterministicamente por guardrails executáveis:
1. **W3C WCAG 2.1**: contraste luminoso calculado (`>= 7.0:1` para texto primário em fichas, `>= 4.5:1` AA para texto terciário/muted e acentos dourados, `>= 3.0:1` SC 1.4.11 para ícones de controle).
2. **Anti-Halação**: textos em superfícies de leitura contínua DEVEM respeitar teto máximo `<= 15.0:1` (proibido `#ffffff` sobre `#000000`).
3. **Anti-Wireframe (Regra 60-30-10)**: bordas estruturais internas (`role: "border-hairline"`) DEVEM manter opacidade `<= 0.16`, reservando ouro envelhecido para 10% focais.
4. **Contratos Anti-Box-in-Box & Zero Layout Drift**: conteúdos customizados no chat (`.et-abracado-chat-card`, `.et-critical-table-card`) NÃO devem criar containers externos redundantes dentro de `.chat-message`, e variantes de ficha `.et-sheet` ou `#context-menu` NÃO devem sobrescrever layout nativo.

- verificação(teste): @principle:P-011

## P-012 [DEVE] Padrão de idioma: código em Inglês e textos do jogador em PT-BR (`UI_TEXT`)

Nomes de arquivos, pastas, identificadores, tipos, comentários de código e logs DEVEM ser escritos estritamente em **Inglês**. Textos voltados ao jogador (UI, chat, banners, notificações e tooltips) DEVEM ser escritos estritamente em **Português do Brasil (PT-BR)** e agrupados em um objeto `UI_TEXT` (`as const`) dentro do `config.ts` de cada feature.

- verificação(gate): intrínseca ao audit
