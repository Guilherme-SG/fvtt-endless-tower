<!-- onp-spec:documentation-contract=v1 -->

# Tasks: Endless tower design system

> feature: endless-tower-design-system

## T-001 — Estrutura de Tokens CSS, Catálogo W3C DTCG e Blindagem FontAwesome [concluida]

- Refs: US-001, AC-001, AC-002, AC-003
- Arquivos: styles/design-system/tokens.css, styles/design-system/buttons.css, src/features/design-system/agentic-tokens.ts
- Notas: Estabelecer paleta canônica, catálogo estruturado W3C DTCG com auditoria matemática WCAG 2.1 (`P-011`) e regra incondicional de proteção de fontes para classes FontAwesome.

## T-002 — Escopo Estrito de Botões, Formulários, Janelas e Fichas Opt-In [concluida]

- Refs: US-002, AC-004, AC-005, AC-006
- Arquivos: styles/design-system/forms.css, styles/design-system/windows.css, styles/design-system/hud.css, styles/design-system/sheets.css, src/features/design-system/celestial-sheets.ts
- Notas: Remover seletores universais em tags brutas; isolar `.et-btn`, `.et-input`, `.et-window`; restringir `#context-menu` a cores preservando espaçamento vanilla e ícones de módulos; registrar fichas opt-in "Endless Tower Sheet" (Player e NPC) escopadas em `.et-sheet`; garantir compatibilidade com Token Action HUD, YouTube Player e Character Monitor.

## T-003 — Chat Enhancer e Cartões de Combate Escuros [concluida]

- Refs: US-003, AC-007, AC-008, AC-009
- Arquivos: styles/design-system/chat.css, src/features/design-system/chat-enhancer.ts
- Notas: Ajustar contraste dos cartões Midi-QoL e posicionar selo de sussurro antes de `.message-header.flexrow`.

## T-004 — Banners Cinemáticos Edge-to-Edge e BannerService [concluida]

- Refs: US-004, AC-010, AC-011, AC-012
- Arquivos: styles/design-system/banners.css, src/features/design-system/banner-service.ts
- Notas: Implementar layout Ribbon 100vw com `white-space: nowrap` e fila FIFO no BannerService.

## T-005 — Pausa Celestial, Transições e Reversibilidade [concluida]

- Refs: US-005, AC-013, AC-014, AC-015
- Arquivos: styles/chronicle.css, src/features/celestial-chronicle.ts
- Notas: Conter largura da barra de pausa com `fit-content` e garantir desacoplamento de cena e reversibilidade P-004.

## T-006 — Despachante Sonoro e Inicializador do Sistema [concluida]

- Refs: US-006, AC-016, AC-017, AC-018
- Arquivos: src/features/design-system/sound-effects.ts, src/features/design-system/design-system.ts
- Notas: Remover som de clique de botão e eventos globais intrusivos; manter rolagens de dados e stingers.

## T-007 — Suíte de Testes Automatizados Vitest [concluida]

- Refs: US-001, US-002, US-003, US-004, US-005, US-006, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019
- Arquivos: tests/design-system.test.ts
- Notas: Testes executáveis para todos os critérios de aceitação AC-001 até AC-019 com anotações @spec e @principle.

## T-008 — Unificação do DNA Visual da Tela de Login e Cantoneiras Celestiais [concluida]

- Refs: US-001, US-002, US-003, AC-019
- Arquivos: styles/design-system/tokens.css, styles/design-system/sheets.css, styles/design-system/buttons.css, styles/design-system/chat.css, src/features/design-system/agentic-tokens.ts, tests/design-system.test.ts
- Notas: Sincronizar paleta da tela de login (`--et-ink`, `--et-gold-satin-top`, `--et-gradient-login-btn`, vidro âmbar) e aplicar cantoneiras celestiais vetoriais SVG com `pointer-events: none` sem alteração de layout em fichas e chat.

## Documentos relacionados

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Pesquisa](research.md)
