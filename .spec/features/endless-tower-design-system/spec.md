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

- **Dado** qualquer botão, controle de navegação ou elemento que contenha ícones FontAwesome (`i.fa`, `i.fas`, `[class*="fa-"]`)
- **Quando** os estilos do módulo Endless Tower são aplicados à página
- **Então** os seletores de ícones devem manter obrigatoriamente a família de fontes FontAwesome protegida com prioridade `!important`, impedindo o surgimento de caixas de caractere ausente (`[X]`).

#### AC-003 — Isolamento tipográfico de aspas em citações sem colapso faux-italic

- **Dado** um bloco de citação estilizado com aspas tipográficas (`“` e `”`) em fontes como Signika
- **Quando** o texto da citação é renderizado em itálico
- **Então** os caracteres de aspas devem ser isolados em elementos `.et-quote-mark` com `font-style: normal !important; font-family: "Georgia", serif;`, evitando o colapso do glifo em um único traço no Chromium.

### US-002 — Escopo Estrito de Componentes e Não-Interferência

Como Mestre da mesa, quero que os estilos do Endless Tower não alterem as fichas de personagem nem as janelas de configuração nativas do Foundry, para que o gerenciamento técnico do jogo permaneça intacto.

#### AC-004 — Fichas de personagem D&D 5e e janelas nativas preservadas sem interferência global

- **Dado** a abertura de uma ficha de personagem (`.dnd5e.sheet`, `.tidy5e-sheet`) ou janela nativa de configuração (`Configure Settings`)
- **Quando** a folha de estilo `styles/design-system/windows.css` está ativa
- **Então** nenhum estilo genérico em `.window-app` ou `.application` deve sobrescrever a largura ou o layout das fichas, ficando restrito a contêineres explícitos `.et-window` e `.et-dialog`.

#### AC-005 — Formulários e inputs com escopo estrito .et-input e .et-select

- **Dado** um campo de formulário do módulo Endless Tower
- **Quando** for renderizado na interface
- **Então** deve utilizar classes dedicadas `.et-input` ou `.et-select`, e nenhum seletor global `input[type="text"]` ou `select` desprotegido deve existir nas folhas de estilo.

#### AC-006 — Botões com escopo estrito .et-btn e compatibilidade com Token Action HUD e YouTube Player

- **Dado** a presença de módulos de interface como Token Action HUD (`#token-action-hud`) e YouTube Player (`#youtube-player`)
- **Quando** o HUD é exibido na tela
- **Então** botões de terceiros não devem receber padding ou fontes forçadas, a seta de recolhimento do menu não deve sobrepor botões, e o seletor de botão do módulo deve aplicar-se estritamente a `.et-btn`.

### US-003 — Chat e Cartões de Combate

Como jogador e Mestre, quero que os cartões de rolagem, dano e sussurros no painel de chat tenham leitura clara e contraste adequado, para que as mensagens sejam legíveis em combate.

#### AC-007 — Legibilidade de texto marfim sobre cartões escuros Midi-QoL e D&D 5e

- **Dado** um cartão de item, rolagem de ataque ou dano do Midi-QoL / D&D 5e renderizado no chat
- **Quando** o chat enhancer do Endless Tower estiver ativo
- **Então** o contêiner interno do cartão (`.dnd5e.chat-card`, `.card-content`, `.description`) deve receber fundo escuro em vidro obsidiana e tipografia em marfim (`--et-ivory`), eliminando texto branco sobre fundo pergaminho claro.

#### AC-008 — Selo de comunicação sigilosa posicionado sem corromper o cabeçalho flexrow

- **Dado** uma mensagem de chat classificada como sussurro (`whisper`)
- **Quando** o selo de comunicação sigilosa (`.et-whisper-banner`) for injetado na mensagem
- **Então** ele deve ser inserido como nó irmão anterior a `.message-header.flexrow`, preservando o alinhamento flex nativo e a exibição de destinatários e horário.

#### AC-009 — Enriquecimento visual para acertos e falhas críticas

- **Dado** uma rolagem de ataque processada pelo Midi-QoL resultando em acerto crítico ou falha crítica (fumble)
- **Quando** o cartão de mensagem é exibido no chat
- **Então** o cartão deve receber a classe `.et-critical-hit` (borda dourada radiante) ou `.et-critical-fumble` (borda carmesim pulsante).

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

- Redesenho de fichas de personagens de regras D&D 5e ou módulos terceiros de ficha (permanecem 100% nativas).
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
