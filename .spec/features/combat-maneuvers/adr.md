<!-- onp-spec:documentation-contract=v1 -->

# ADR: Automação de Manobras de Combate (Agarrar, Empurrar e Desarmar)

> feature: combat-maneuvers
> status: revisado

[PRD](prd.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)

## Identificação e contexto

- **Decisão**: ADR-001 — Adoção de Itens de Ação Dedicados, Prompt Socket Prévio de Defesa e Disputa Visual via Epic Rolls 5e.
- **Responsáveis**: Time de Desenvolvimento Endless Tower & Vitor Manoel.
- **Data**: 15/11/2026.
- **Domínio**: Combate e Automação D&D 5e no Foundry VTT v13.
- **Requisitos**: Atender ao fluxo solicitado pelo usuário para as 3 manobras (Agarrar, Empurrar, Desarmar) com seleção dinâmica de perícia pelo defensor, suporte à visibilidade ágil e automação de condições/movimentação.

## Restrições e regras anteriores

- **P-001**: Todo critério de aceite deve ter teste unitário observável (`@spec:AC-xxx`).
- **P-003**: Desacoplamento entre lógica de regras e hooks do Foundry. Os cálculos matemáticos, matrizes de tamanho e vetores de empurrão devem residir em `src/rules/maneuvers.ts` sem referências globais (`game`, `canvas`, `Hooks`, `ui`).
- **P-004**: Reversibilidade visual em três níveis para efeitos de partículas/animação.
- **P-007**: Política de segurança Foundry MCP (HITL). Não executar ações destrutivas em fichas ou inventários de forma autônoma. No Desarmar, a arma não é excluída nem desequipada sem consentimento, apenas notificada.

## Alternativas consideradas

1. **Alternativa 1 — Diálogo e cards nativos 100% isolados (sem Epic Rolls 5e)**:
   - *Vantagem*: Total controle sobre cada elemento do DOM e isolamento estrito de módulos externos.
   - *Desvantagem*: Não aproveita a apresentação audiovisual cinematográfica do `Epic Rolls 5e` já instalado e configurado no mundo.
2. **Alternativa 2 — Seleção automática da maior perícia do defensor (sem perguntar)**:
   - *Vantagem*: Mais rápido, sem necessidade de socket de espera.
   - *Desvantagem*: Viola a agência do jogador defensor, que pode ter habilidades, itens ou circunstâncias táticas para preferir Atletismo ou Acrobacia.
3. **Alternativa 3 (Proposta Aprovada) — Fluxo Híbrido com Prompt Socket + Epic Rolls 5e**:
   - *Vantagem*: O defensor escolhe ativamente sua defesa em um modal rápido na sua máquina; o Epic Rolls 5e conduz a disputa cinematográfica sincronizada em tela cheia; fallback seguro com timeout e suporte total à visibilidade ágil.
   - *Desvantagem*: Requer orquestração limpa de socket antes da chamada da API do Epic Rolls.

## Decisão e justificativa

Decidiu-se pela **Alternativa 3**. O fluxo arquitetural funciona da seguinte forma:
1. O atacante ativa o item de manobra (`Manobra: Agarrar`, `Manobra: Empurrar` ou `Manobra: Desarmar`) com um alvo selecionado.
2. O sistema valida alcance e compatibilidade de tamanho de criaturas usando o motor puro `src/rules/maneuvers.ts`.
3. Um pop-up rápido é exibido para o atacante para confirmação e seleção de visibilidade (com padrão pré-selecionado para o `rollMode` ativo no chat).
4. O cliente emite um socket `COMBAT_MANEUVER_DEFENSE_PROMPT` para o dono do defensor (ou GM). O defensor vê um modal de escolha: Atletismo ou Acrobacia (com seus bônus calculados). Se não responder em 30 segundos, o sistema adota automaticamente a perícia com maior bônus.
5. O sistema chama `ui.EpicRolls5e.requestRoll(...)` com `type: "skill.ath"` e `contest: "skill.ath" | "skill.acr"`.
6. Após a resolução, os efeitos automáticos são executados:
   - Agarrar: Aplica condição `Grappled` (via DFreds ou Core).
   - Empurrar: Prompt ao atacante para Derrubar Caído (`Prone`) ou Empurrar 5 pés (movimento vetorial com checagem de colisão de paredes).
   - Desarmar: Emite notificação de sucesso no chat destacando a arma caída no chão, preservando o inventário do ator.
   - VFX/SFX leves via Sequencer são disparados se ativos.

## Consequências e riscos

- **Ganhos**: Máxima imersão, combate dinâmico, conformidade com as regras de D&D 5e e respeito à agência dos jogadores.
- **Riscos e Mitigação**:
  - *Defensor desconectado ou AFK*: Mitigado pelo timeout automático de 30 segundos com fallback para o maior bônus.
  - *Módulo Epic Rolls desativado*: Mitigado por um adaptador que detecta a ausência do módulo e realiza a disputa via rolagens nativas de D&D 5e no chat.

## Validade, revisão e substituição

Esta decisão é válida para o módulo Endless Tower no Foundry VTT v13 (D&D 5e v5.2.5+). Uma revisão só será necessária caso o sistema D&D 5e mude o formato fundamental de rolagens de perícia ou o módulo Epic Rolls seja descontinuado.

## Respostas e aprovação

Confirmado e aprovado pelo usuário no alinhamento via `/grill-me` em 15/11/2026.
