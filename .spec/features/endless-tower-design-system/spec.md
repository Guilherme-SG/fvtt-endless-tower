<!-- onp-spec:documentation-contract=v1 -->

# Spec: Endless tower design system

> feature: endless-tower-design-system
> status: implementada

## Contexto

Sistema de design unificado ("Celestial Chronicle") para o Foundry VTT v13 no mundo Endless Tower, estabelecendo coerência visual dark fantasy (vidro obsidiana, ouro antigo e marfim) com escopo estrito e proteção total para fichas de ator e módulos essenciais de terceiros.

## Histórias

### US-001 — Tokens & Tipografia Celestial

Como usuário da mesa virtual, quero um conjunto canônico de variáveis CSS e tipografia cinematográfica elegante, para que todas as interfaces proprietárias da Torre possuam uma identidade visual coesa e ícones consistentes.

#### AC-001 — Definição e integridade de variáveis CSS canônicas

- **Dado** o arquivo de estilos canônicos `styles/design-system/tokens.css` carregado no Foundry VTT
- **Quando** o tema Celestial Chronicle é inicializado
- **Então** os tokens essenciais `--et-obsidian`, `--et-gold`, `--et-ivory`, `--et-crimson`, `--et-font-cinematic` e `--et-glass-bg` devem estar definidos e disponíveis para consumo.

#### AC-002 — Blindagem explícita de ícones FontAwesome contra substituição de fontes

- **Dado** qualquer botão, controle de navegação ou elemento que contenha ícones FontAwesome (`i.fa`, `i.fas`, `i.fab`, `i.fa-brands`, `[class*="fa-"]`)
- **Quando** os estilos do módulo Endless Tower são aplicados à página
- **Então** os seletores de ícones devem manter obrigatoriamente a família de fontes FontAwesome protegida com prioridade `!important`, preservando `"Font Awesome 6 Brands"` separadamente para ícones de marca (`.fab`, `.fa-brands` como *Import*) e impedindo o surgimento de caixas de caractere ausente (`[X]`).

#### AC-003 — Isolamento tipográfico de aspas em citações sem colapso faux-italic

- **Dado** um bloco de citação estilizado com aspas tipográficas (`“` e `”`) em fontes como Signika
- **Quando** o texto da citação é renderizado em itálico
- **Então** os caracteres de aspas devem ser isolados em elementos `.et-quote-mark` com `font-style: normal !important; font-family: "Georgia", serif;`, evitando o colapso do glifo em um único traço no Chromium.

### US-002 — Escopo Estrito de Componentes e Não-Interferência

Como Mestre da mesa, quero que os estilos do Endless Tower não alterem as fichas de personagem nem as janelas de configuração nativas do Foundry, para que o gerenciamento técnico do jogo permaneça intacto.

#### AC-004 — Fichas nativas preservadas, menu de contexto apenas em cores e fichas opt-in `Endless Tower Sheet`

- **Dado** a abertura de uma ficha padrão D&D 5e, um menu de contexto (`#context-menu`) ou as fichas registradas **`Endless Tower Sheet`** (`character` e `npc`)
- **Quando** o Design System Celestial Chronicle estiver ativo (`windows.css`, `sheets.css` e `celestial-sheets.ts`)
- **Então** nenhum estilo genérico em `.window-app` ou `.sheet` deve afetar fichas nativas; `#context-menu` deve preservar tamanhos, espaçamentos, fonte e ícones/cores originais de módulos (aplicando somente cores da paleta Celestial); e as subclasses opt-in `EndlessTowerCharacterSheet` e `EndlessTowerNPCSheet` devem estender as fichas nativas adicionando estritamente a classe `.et-sheet` (`makeDefault: false`), replicando o layout 1:1 do D&D 5e e alterando apenas tokens de cor em `styles/design-system/sheets.css`.

#### AC-005 — Formulários e inputs com escopo estrito .et-input e .et-select

- **Dado** um campo de formulário do módulo Endless Tower
- **Quando** for renderizado na interface
- **Então** deve utilizar classes dedicadas `.et-input` ou `.et-select`, e nenhum seletor global `input[type="text"]` ou `select` desprotegido deve existir nas folhas de estilo.

#### AC-006 — Botões com escopo estrito .et-btn e compatibilidade com Token Action HUD, YouTube Player e simraki-character-monitor

- **Dado** a presença de módulos de interface como Token Action HUD (`#token-action-hud`), YouTube Player (`#youtube-player`) e Character Monitor (`simraki-character-monitor` / `.cm-msg`)
- **Quando** o HUD ou chat são exibidos na tela
- **Então** botões e cards de terceiros protegidos não devem receber estilos forçados do Design System, a seta de recolhimento do menu não deve sobrepor botões, e o seletor de botão do módulo deve aplicar-se estritamente a `.et-btn`.

### US-003 — Chat e Cartões de Combate

Como jogador e Mestre, quero que os cartões de rolagem, dano e sussurros no painel de chat tenham leitura clara e contraste adequado, para que as mensagens sejam legíveis em combate.

#### AC-007 — Legibilidade de texto marfim, cards do Monk's Token Bar, hierarquia de negrito/links, filtro do dado, preservação de `.cm-msg` e alternância Monk's/Epic Rolls

- **Dado** um cartão do chat D&D 5e, Midi-QoL, Monk's Token Bar (`.monks-tokenbar.chat-card`), tooltip (`#tooltip`, `.locked-tooltip`) ou `simraki-character-monitor` (`.cm-msg`), além da configuração de salvaguardas do Midi-QoL
- **Quando** o Design System Celestial estiver ativo ou o sistema de salvaguardas for alternado entre `mtb` e `rer` (via Julgamento da Torre, botão no Combat Tracker/Dock ou API)
- **Então** mensagens `.cm-msg` do `simraki-character-monitor` devem permanecer intactas sem interferência de `chat.css` ou `ChatEnhancer`; cards `.monks-tokenbar.chat-card` devem aplicar a paleta Celestial (cabeçalhos em dourado `--et-gold`, subcabeçalho em vidro obsidiana e botões `.footer-button` estilizados); o alternador `buildUpdatedMidiSaveSettings` deve atualizar sempre `playerRollSaves` entre `mtb` e `rer` preservando `rollNPCSaves` e `rollNPCLinkedSaves` quando estiverem em `auto`; nos demais cards, o cabeçalho do remetente deve seguir o layout compacto estilo vanilla sem fundo de cor de jogador, os links `.reference-link` / `.content-link` devem ser discretos (`font-size: 0.9em`, `padding: 0px 3px`), o dado SVG de `.roll-link` deve receber `--dnd5e-roll-icon-filter` claro, textos em negrito devem destacar-se em `--et-gold` e nenhum título ou botão deve sofrer truncamento ou corte lateral horizontal.

#### AC-008 — Selo de visibilidade não-pública com ícones nativos sem corromper o cabeçalho flexrow

- **Dado** uma mensagem de chat não-pública (`whisper` ou `blind`)
- **Quando** o selo de comunicação sigilosa (`.et-whisper-banner`) for injetado na mensagem
- **Então** ele deve ser inserido como nó irmão anterior a `.message-header.flexrow` exibindo o ícone correspondente à visibilidade do Foundry (`fa-eye-slash` para cega, `fa-user` para si mesmo, `fa-user-secret` para privada/GM), sem símbolo rúnico `ᛟ`, preservando o alinhamento flex nativo e os metadados.

#### AC-009 — Crítico/falha restrito a rolagens de ataque e alinhamento lado a lado estilo vanilla no Midi-QoL

- **Dado** uma mensagem de chat contendo botões/rolagens de combate (ataque `d20` e/ou dano `1d6`, `1d8`, etc., ou vantagem com dado descartado)
- **Quando** o `ChatEnhancer` e o layout `.chat-message` processam o cartão
- **Então** a detecção e o destaque visual de crítico/falha (`.et-chat-critical` / `.et-attack-critical` e `.et-chat-fumble` / `.et-attack-fumble`) devem aplicar-se **exclusivamente** a rolagens de ataque em dados `d20` ativos, os botões de ataque e dano devem respeitar o alinhamento `1:3:1` (`flex: 1 1 0` / `flex: 3 1 0`), as colunas lado a lado devem esticar com `align-items: stretch !important` alinhando as caixas `.dice-total` pela base (`margin-top: auto !important`) e posicionando o selo de crítico/falha centralizado abaixo das colunas.

### US-004 — Banners Cinemáticos Souls-like (P-005)

Como Mestre da Torre, quero que anúncios de chefes, combates decisivos e alertas épicos atravessem a tela em um formato ribbon panorâmico de alto impacto, para imersão dos jogadores sem caixas de diálogo genéricas.

#### AC-010 — Formato Edge-to-Edge Ribbon de tela inteira sem bordas laterais

- **Dado** o disparo de um anúncio cinemático pelo BannerService
- **Quando** o banner for renderizado no DOM
- **Então** o elemento contêiner deve ocupar `width: 100vw`, com gradiente horizontal transparente nas pontas, backdrop-filter blur de 12px e bordas laterais estritamente ausentes (`border-left: none; border-right: none;`).

#### AC-011 — Título cinemático em linha única sem quebra de texto

- **Dado** o título principal do banner cinemático
- **Quando** for exibido em resoluções de tela padrão
- **Então** deve aplicar obrigatoriamente `white-space: nowrap;`, impedindo a quebra de linhas no texto principal do julgamento ou anúncio.

#### AC-012 — Fila sequencial FIFO do BannerService sem sobreposição visual

- **Dado** múltiplos anúncios disparados em sequência ou em combate acelerado
- **Quando** um novo banner for enfileirado enquanto outro ainda está em exibição
- **Então** o serviço deve enfileirar a exibição em fila FIFO, aguardando o término e animação de saída do banner atual antes de exibir o próximo.

### US-005 — Pausa Celestial e Transições de Cena

Como usuário da mesa, quero que a tela de pausa e as transições de cena exibam citações filosóficas da Torre com proporções equilibradas e sem congelar o canvas do Foundry.

#### AC-013 — Barra de pausa com largura intrínseca ajustada e citação centralizada

- **Dado** o jogo pausado pelo Mestre da Torre
- **Quando** a barra de pausa `.et-pause-bar` é renderizada
- **Então** ela deve ter largura ajustada ao conteúdo (`width: fit-content; max-width: min(580px, 86vw);`), com ícone de pausa estilizado e citação em itálico com autor centralizado.

#### AC-014 — Transição de cena em DOM overlay desacoplada do PixiJS

- **Dado** o início de uma troca de cena no Foundry VTT (`canvasInit`)
- **Quando** a transição de cena do Endless Tower for executada
- **Então** a sobreposição visual deve ser injetada diretamente em `document.body` como elemento HTML fixo, desacoplado da destruição e reconstrução do `#board` WebGL.

#### AC-015 — Reversibilidade P-004 em três níveis para efeitos visuais dinâmicos

- **Dado** qualquer efeito visual dinâmico (partículas, transições, animações de banner)
- **Quando** o usuário desativar a opção nas configurações do módulo ou via API pública
- **Então** os loops de animação (`cancelAnimationFrame`) e os nós injetados no DOM devem ser limpos imediatamente e de forma idempotente.

### US-006 — Despachante de Áudio de Interface Desacoplado

Como usuário, quero que os efeitos sonoros da interface sejam pontuais e musicais, sem sons repetitivos a cada clique de botão e com controle total de volume.

#### AC-016 — Remoção total de som de clique genérico de botão e listeners intrusivos

- **Dado** a interação do usuário clicando em botões da interface, tokens ou links do Foundry
- **Quando** o despachante de áudio estiver ativo
- **Então** nenhum evento global capturado de clique deve interceptar os botões e nenhum som de clique genérico deve ser reproduzido.

#### AC-017 — Reprodução desacoplada de sons de rolagem de dados e stingers de banner

- **Dado** o disparo de uma rolagem de dados no chat ou a exibição de um banner cinemático
- **Quando** o áudio correspondente for solicitado
- **Então** o despachante sonoro deve invocar o canal de áudio apropriado sem depender de lógica de hooks inline no motor de regras.

#### AC-018 — Controle de volume independente e suporte a mute nas configurações

- **Dado** o ajuste do volume de efeitos da interface nas configurações do módulo
- **Quando** o volume for alterado para 0 ou desativado
- **Então** a reprodução de efeitos sonoros deve ser imediatamente silenciada respeitando a configuração do usuário.

## Fora de escopo

- Alteração automática ou global das fichas padrão de personagens D&D 5e ou módulos terceiros de ficha (a ficha nativa permanece 100% intacta; a estética Celestial é aplicada apenas de forma opt-in via **`Endless Tower Sheet`**).
- Novos sons de clique de botão (recurso postergado para avaliação e novo design sonoro futuro).
- Suporte a navegadores legados sem suporte a CSS Custom Properties e `backdrop-filter`.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-001 | O DOM de cartões do chat no D&D 5e / Midi-QoL mantém as classes `.card-content` e `.description` | confirmada | Validado nos arquivos de estilo `styles/design-system/chat.css` e testes de integração. |
| ASM-002 | A fonte FontAwesome v6 é servida globalmente pelo Foundry v13 sob a classe `.fa` e correlatas | confirmada | Validado com a inclusão de regra de blindagem `!important` para `font-family` FontAwesome. |
| ASM-003 | O despachante de áudio pode operar sem cliques genéricos mantendo apenas dados e stingers | confirmada | Confirmado pelo cliente e implementado em `src/features/design-system/sound-effects.ts`. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-001 | As fichas de personagem devem receber tema escuro do Celestial Chronicle ou retornar ao original? | respondida | Retornar ao padrão original das fichas D&D 5e (sem sobrescrita de `.sheet`). |
| Q-002 | O som de clique de botão deve ser mantido ou desativado? | respondida | Removido integralmente nesta fase; novo som será reavaliado futuramente. |
| Q-003 | Qual deve ser o formato da barra de pausa após os ajustes de proporção? | respondida | Formato contido (`fit-content`) com limite de 580px e citação centralizada. |

## Documentos relacionados

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)
