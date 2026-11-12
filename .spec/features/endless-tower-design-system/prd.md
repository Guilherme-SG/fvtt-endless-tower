<!-- onp-spec:documentation-contract=v1 -->

# PRD: endless tower design system

> feature: endless-tower-design-system
> status: revisado

[ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)

## Pedido original do cliente

> Let make the design system for this project. The foundry vtt world Endless Tower will have a unified UX/UI under the same system. With this system, all other chats and features will have visual coherence. The desired look is the one we created and called it as celestial chronical. The UI: menu, chat, card, popup, banner, forms, button, fonts, free text, visual/sound effect, everything.

## Problema, público e contexto

O mundo Endless Tower no Foundry VTT v13 (sistema D&D 5e) acumulou dezenas de módulos ativos e customizações visuais divergentes. O objetivo é unificar toda a experiência de usuário sob a identidade estética "Celestial Chronicle" (vidro obsidiana escuro, detalhes em ouro antigo e marfim, tipografia cinematográfica e efeitos imersivos), garantindo ao mesmo tempo compatibilidade absoluta com módulos de terceiros essenciais (Token Action HUD, YouTube Player, Midi-QoL e fichas D&D 5e). O público-alvo primário é o Mestre da Torre e seus jogadores em sessão de jogo ao vivo.

Data do pedido inicial: 2026-11-11. Origem: Solicitação do usuário via chat e refinamento iterativo via `/grill-me` com evidências visuais de 9 pontos de atrito.

## Resultados desejados e métricas

1. **Coerência Visual Unificada (100%)**: Toda a interface proprietária do módulo (banners, cards de chat, barra de pausa, diálogos de bênçãos e controles) segue os tokens canônicos do tema Celestial Chronicle.
2. **Não-Interferência e Compatibilidade Zero-Regressão**: Fichas de personagem D&D 5e (`.sheet`), janelas nativas de configuração (`Configure Settings`) e módulos como Token Action HUD e YouTube Player operam com 100% de integridade funcional e visual, sem distorção de caixas de seleção, botões ou sobreposição de setas.
3. **Resolução dos 9 Defeitos Críticos**:
   - Ícones FontAwesome preservados em toda a UI sem substituição indevida por fontes tipográficas (`[X]`).
   - Janela de configurações mantém largura original sem esticar inputs em 100%.
   - Contraste legível no chat com texto marfim sobre cartões escuros Midi-QoL.
   - Cabeçalhos de sussurro organizados sem quebrar o layout flexbox nativo.
   - Token Action HUD sem colisão entre a seta de recolhimento e botões de ação.
   - Fichas de personagens inalteradas em seu estilo original.
   - Remoção de som de clique genérico intrusivo ao pressionar botões.
   - Barra de pausa com largura contida (`fit-content`) e citações centralizadas.
   - Acesso irrestrito e botões operáveis no YouTube Player.
4. **Métricas Técnicas**: 100% dos testes unitários passando em Vitest (`npm test`), bundle do Vite construído sem erros (`dist/endless-tower.js`), e conformidade estrita com a Constituição (P-001 a P-010).

## Requisitos e prioridades

| Requisito | Palavras do cliente / origem | Prioridade | Critérios na spec |
|---|---|---|---|
| Design Tokens & Tipografia | "The desired look is the one we created and called it as celestial chronical... fonts, free text" | Alta | AC-001, AC-002, AC-003 |
| Não-Interferência & Fichas | "Para as fichas, retorne como era originalmente; O Configure Settings tá largo; Action HUD ficou com seta em cima" | Alta | AC-004, AC-005, AC-006 |
| Legibilidade e Cartões de Chat | "O chat não está legível; Tem mensagens que ficam mal formatadas" | Alta | AC-007, AC-008, AC-009 |
| Banners Cinemáticos Souls-like | "banner... popup... visual effect" | Média | AC-010, AC-011, AC-012 |
| Pausa Celestial & Transições | "A mensagem de pause já tinha um formato adequado, agora ficou largo demais" | Alta | AC-013, AC-014, AC-015 |
| Efeitos Sonoros Desacoplados | "Remova o som de click (mudaremos no futuro); sound effect" | Alta | AC-016, AC-017, AC-018 |

## Escopo e exclusões

- **No Escopo**:
  - Tokens CSS canônicos de cor, tipografia, bordas, sombras e espaçamentos sob o prefixo `--et-*`.
  - Escopo estrito para elementos interativos próprios (`.et-btn`, `.et-input`, `.et-select`, `.et-window`, `.et-dialog`).
  - Proteção universal e incondicional para glifos FontAwesome (`i.fa, [class*="fa-"]`).
  - Formatação e contraste visual de cartões do chat D&D 5e e Midi-QoL, incluindo selo elegante para comunicação sigilosa (sussurro).
  - Banners cinemáticos Edge-to-Edge Ribbon (100vw, sem quebra de título, sem caixa flutuante).
  - Barra de pausa ajustada com largura intrínseca (`fit-content`) e citações filosóficas.
  - Despachante de efeitos sonoros de interface, com remoção do clique genérico de botões e suporte a rolagens de dados, críticos e stingers de banner.
- **Fora de Escopo**:
  - Reestilização de fichas de personagens de jogadores (`.sheet`, Tidy5e ou D&D 5e padrão) — permanecem 100% nativas.
  - Sobrescrita de formulários e janelas de configuração nativas do Foundry ou de terceiros fora do namespace `.et-*`.
  - Novos sons de clique de botão (postergados explicitamente para iteração futura).

## Regras de produto e domínios

- **P-001 [DEVE]**: Todo requisito tem prova executável automatizada via Vitest com tags `@spec:AC-xxx`.
- **P-003 [DEVE]**: Desacoplamento entre lógica de regras/áudio e hooks do Foundry.
- **P-004 [DEVE]**: Reversibilidade visual em três níveis (Configurações, método `api.toggle<Feature>()` e cleanup em `canvasTearDown`).
- **P-005 [DEVE]**: Padrão cinemático Edge-to-Edge Ribbon (largura 100vw, bordas laterais ausentes, backdrop blur, `white-space: nowrap`).
- **P-007 [DEVE]**: Protocolo HITL para Foundry MCP.
- **P-008 [DEVE]**: Protocolo HITL estrito de 4 etapas para Git commit.
- **P-010 [RECOMENDADO]**: Progressive HUD (atenuação suave e restauração por `:hover`).
- Domínios afetados: `ui`, `audio`, `chat`, `combat`, `foundry-v13`.

## Dependências, riscos e suposições

- **Dependências**: Foundry VTT v13 Stable (build 351), D&D 5e System 5.2.5, Midi-QoL, Token Action HUD, FVTT YouTube Player.
- **Riscos Técnicos**: Colisão de estilos CSS caso desenvolvedores apliquem seletores puros em tags HTML (`button`, `input`). Mitigado por regra estrita de linter e governança de seletores de classe com namespace `.et-*`.
- **Suposições**: A estrutura de cabeçalho do chat do Foundry mantém `.message-header.flexrow`, permitindo anexar o selo de sussurro antes do cabeçalho sem quebrar a flexbox.

## Validação com o cliente

- **Sessão de Alinhamento**: Realizada em 2026-11-11 via `/grill-me`.
- **Entradas do Cliente**: 8 capturas de tela e lista pontual de 9 correções necessárias.
- **Decisão Arquitetural**: Aprovada a "Alternativa 2: Governança Expandida" (Strict Component Scoping com `.et-*`, proteção FontAwesome, suite de testes Vitest automatizada).
- **Status do Documento**: Revisado e aprovado como base contratual de especificação.

## Documentos relacionados

[ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)
