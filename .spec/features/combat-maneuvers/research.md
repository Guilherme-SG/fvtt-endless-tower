<!-- onp-spec:documentation-contract=v1 -->

# Pesquisa de produto: combat maneuvers

> feature: combat-maneuvers
> status: revisado

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md)

## Pergunta e hipótese

- **Pergunta**: Como fornecer uma automação elegante e ágil de manobras de combate (Agarrar, Empurrar e Desarmar) no Foundry VTT v13 que permita ao defensor escolher dinamicamente entre Atletismo e Acrobacia, suporte visibilidade customizada e utilize os módulos visuais já instalados no mundo?
- **Hipótese**: Orquestrar a ativação a partir de 3 itens de Ação, resolver a escolha de defesa do defensor por um modal leve via socket e delegar o suspense da disputa visual ao módulo instalado `Epic Rolls 5e` reduzirá o atrito de mesa para menos de 1/3 do tempo manual, preservando a imersão e as regras de D&D 5e.

## Concorrentes e alternativas

| Produto / alternativa | Comportamento observado | Fonte primária | Data da consulta | Limitações |
|---|---|---|---|---|
| **Resolução Manual no Foundry (Status Quo)** | Jogador e Mestre abrem as fichas, clicam em Atletismo/Acrobacia, leem o chat e comparam os dados manualmente. | Foundry VTT v13 nativo | 15/11/2026 | Lento (~45s), sujeito a erros de interpretação de regras (alcance, tamanhos), quebra o ritmo do combate. |
| **Midi-QoL OverTime / Custom Actions** | Midi-QoL permite configurar itens com saving throws, mas não implementa nativamente disputas dinâmicas de perícia oposta com escolha entre Atletismo/Acrobacia pelo defensor. | Midi-QoL v13.0.54 | 15/11/2026 | Requer scripts complexos de OnUseMacro ou ItemMacro; não possui interface visual cinemática de disputa. |
| **Monk's TokenBar (Contested Rolls)** | Permite ao GM solicitar disputas de teste entre dois tokens selecionados. | Monk's TokenBar v13 | 15/11/2026 | Acionado exclusivamente pelo Mestre; não se integra diretamente a um clique de ação na ficha do jogador atacante. |
| **Epic Rolls 5e (Nativo)** | Exibe disputa visual cinematográfica com cartas de atores e botão de rolagem sincronizado. Suporta `requestRoll({ actors, contestants, type, contest })`. | Código fonte em `D:/FoundryVTT/Data/modules/epic-rolls-5e` | 15/11/2026 | Espera que `contest` (a perícia do defensor) já esteja definida no momento da chamada; não pergunta ao defensor antes de abrir o banner. |

## Evidências e dados

- Inspeção do código fonte de `epic-rolls-5e/scripts/app/EpicRoll.js`:
  - `ui.EpicRolls5e.requestRoll(rollData)` retorna uma Promise resolvida com `{ canceled, results, success }`.
  - `rollData.type` define a perícia do atacante (ex: `skill.ath`).
  - `rollData.contest` define a perícia do defensor (ex: `skill.ath` ou `skill.acr`).
  - `rollData.options.blindRoll` controla se o resultado fica oculto aos jogadores (`?` na carta) ou público.
- Teste prático do fluxo:
  - Para permitir ao defensor escolher se quer resistir com Atletismo ou Acrobacia, o sistema do Endless Tower deve interceptar o clique no item de manobra, consultar os modificadores do defensor, emitir um diálogo rápido via socket para o dono do defensor e, após a escolha (ou timeout de 30s), despachar a chamada para `ui.EpicRolls5e.requestRoll`.

## Viabilidade matemática e estatística

- **Regra de Empate (PHB p. 174)**:
  - "If the contest results in a tie, the situation remains the same as it was before the contest."
  - Logo, se `totalAtacante > totalDefensor`, o atacante vence; se `totalAtacante <= totalDefensor`, o defensor vence.
- **Probabilidades da Disputa**:
  - Dados dois dados d20 com modificadores $m_A$ e $m_D$:
    - $P(\text{Sucesso}) = P(d_A + m_A > d_D + m_D) = \frac{1}{400} \sum_{a=1}^{20} \sum_{d=1}^{20} \mathbb{I}(a + m_A > d + m_D)$.
  - O cálculo é uma função determinística implementada em `src/rules/maneuvers.ts`.
- **Cálculo de Deslocamento Vetorial**:
  - Distância fixa de 5 pés. Em um grid com tamanho $S$ pixels correspondendo a 5 pés:
    - $\vec{v} = (\text{alvo}_x - \text{atacante}_x, \text{alvo}_y - \text{atacante}_y)$
    - Normalização: $\hat{u} = \frac{\vec{v}}{\|\vec{v}\|}$
    - Nova posição: $P' = (\text{alvo}_x + \hat{u}_x \cdot S, \text{alvo}_y + \hat{u}_y \cdot S)$ ajustada para o grid center.

## Proposta e alternativas ao pedido

- **Proposta Recomendada**:
  - Arquitetura de 3 camadas:
    1. **Regras Puras (`src/rules/maneuvers.ts`)**: Funções puras para validação de alcance, matriz de tamanho 5e, determinação de vencedor e cálculo vetorial de coordenadas. Testada via Vitest.
    2. **Orquestrador de Manobras (`src/features/combat-maneuvers.ts`)**: Adaptador do Foundry VTT que escuta uso dos itens, abre diálogos, comunica via socket e aciona o Epic Rolls 5e.
    3. **Efeitos Audiovisuais e Condições**: Integração com DFreds Convenient Effects / status effects nativos e Sequencer.

## Decisão e experimento

- **Alternativa Escolhida**: Proposta Recomendada com integração direta ao Epic Rolls 5e e socket próprio do Endless Tower para a seleção prévia da perícia do defensor.
- **Validação com Cliente**: Confirmada integralmente no Grill-me em 15/11/2026.
