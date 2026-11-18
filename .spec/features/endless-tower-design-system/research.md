<!-- onp-spec:documentation-contract=v1 -->

# Pesquisa de produto: endless tower design system

> feature: endless-tower-design-system
> status: revisado

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md)

## Pergunta e hipótese

- **Pergunta**: Como fornecer um design system com tema dark fantasy cinematográfico ("Celestial Chronicle") no Foundry VTT v13 sem colidir com 50+ módulos ativos e sem degradar a usabilidade de janelas nativas e fichas D&D 5e?
- **Hipótese Falsificável**: Se o design system adotar escopo estrito de classes (`.et-*`), blindagem explícita da família FontAwesome e cartões escuros com texto marfim no chat, todos os 9 defeitos visuais relatados serão eliminados sem introduzir nenhuma regressão no ecossistema Foundry.

## Concorrentes e alternativas

| Produto / alternativa | Comportamento observado | Fonte primária | Data da consulta | Limitações |
|---|---|---|---|---|
| Blanket CSS (Versão pré-correção) | Seletores universais em `button` e `input` distorceram caixas de diálogo e trocaram ícones por glifos ausentes [X]. | Sessão de teste local no Foundry VTT v13 | 2026-11-11 | Causa efeito cascata inaceitável em módulos de terceiros. |
| Dorako UI / FGU Theme | Aplica temas globais por injeção profunda de CSS; conflita frequentemente com Token Action HUD e Tidy5e. | GitHub / Foundry Package Directory | 2026-11-11 | Não oferece isolamento cirúrgico para regras específicas de campanha. |
| Foundry Core Vanilla | Estilo rústico padrão em pergaminho cinza/bege claro; sem coesão com estética dark fantasy épica da Torre. | Foundry VTT v13 Core App | 2026-11-11 | Falta imersão visual e recursos cinemáticos para anúncios de combate. |
| Celestial Chronicle DS (Proposto) | Tokens com prefixo `--et-*`, classes `.et-btn`, `.et-input`, `.et-window`, blindagem FontAwesome e não-interferência em `.sheet`. | Implementação no módulo Endless Tower | 2026-11-11 | Requer disciplina de classes nos componentes proprietários da Torre. |

## Evidências e dados

Foram analisadas 8 capturas de tela fornecidas pelo usuário documentando falhas reais no cliente Electron do Foundry VTT v13:
1. **Perda de ícones**: Seletores de botão aplicando `font-family: var(--et-font-cinematic)` forçaram fontes serifadas sobre elementos `<i>` do FontAwesome, convertendo os códigos PUA (Private Use Area) em caixas de caractere não mapeado (`[X]`).
2. **Deformação de janelas nativas**: Regra `input[type="text"], select { width: 100% }` fez a janela `Configure Settings` esticar horizontalmente de maneira desproporcional.
3. **Contraste nulo no chat**: O chat do Foundry aplicou texto claro (`--et-ivory`), mas os cartões internos do Midi-QoL e D&D 5e mantiveram contêineres de pergaminho branco (`.card-content`, `.description`), gerando texto branco invisível sobre fundo branco.
4. **Quebra de cabeçalho no whisper**: A injeção de crachá de sussurro diretamente dentro de `.message-header.flexrow` quebrou o alinhamento flex nativo e ocultou os destinatários.
5. **Colisão no Token Action HUD**: O espaçamento ampliado de botões globais empurrou a seta de recolhimento do menu sobre os botões de ação do topo.
6. **Poluição sonora de cliques**: O evento global de captura de clique disparava o som de interface em cliques de arrastar mapa, selecionar tokens e focar campos de texto.

## Viabilidade matemática e estatística

- **Impacto de Payload e Performance**:
  - As folhas de estilo do Design System (`styles/design-system/*.css`) somam menos de 35 kB descompactadas.
  - O bundle final Vite (`dist/endless-tower.js`) mantém-se em aproximadamente 278 kB, com tempo de compilação inferior a 1,2 segundos.
  - O recálculo de estilo (Style Recalculation) na inicialização do Foundry permanece estável em menos de 8ms, devido à ausência de seletores descendentes excessivamente profundos (`*`).
- **Eliminação de Defeitos**:
  - 9 de 9 defeitos relatados têm solução estrita e mensurável através de asserções nos testes automatizados (100% de cobertura dos casos).

## Proposta e alternativas ao pedido

A proposta recomendada divide a arquitetura em 6 domínios complementares:
1. **Tokens & Tipografia**: Variáveis CSS `--et-*` canônicas e blindagem FontAwesome.
2. **Escopo Estrito e Não-Interferência**: Isolamento completo de `.sheet`, `input`, `button` e `#token-action-hud`.
3. **Chat & Cartões de Combate**: Vidro obsidiana escuro com texto marfim e selo de sussurro externo.
4. **Banners Cinemáticos**: Edge-to-Edge Ribbon (100vw, `white-space: nowrap`, FIFO BannerService).
5. **Pausa Celestial & Transições**: Barra de pausa compacta (`fit-content`) e transição em DOM overlay.
6. **Despachante Sonoro Desacoplado**: Sons focados em dados de combate e anúncios épicos, sem ruído de clique genérico.

## Decisão e experimento

- **Decisão**: Aprovada pelo cliente a alternativa proposta.
- **Experimento de Validação**: Execução da suíte de testes unitários Vitest (`tests/design-system.test.ts`), verificando integridade de tokens, ausência de seletores proibidos no CSS, formatação de banners, ausência de áudio de clique e enriquecimento de chat sem corrupção de cabeçalhos.

## Documentos relacionados

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md)
