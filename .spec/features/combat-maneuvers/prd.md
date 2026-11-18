<!-- onp-spec:documentation-contract=v1 -->

# PRD: Automação de Manobras de Combate (Agarrar, Empurrar e Desarmar)

> feature: combat-maneuvers
> status: revisado

[ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)

## Pedido original do cliente

> Lets implement a generic feature to do disarm/shove/grapple automation. The 3 actions are manovers that all creatures can do and are based on Athletics vs Athletics or Acrobatics. The workflow must be: - Attacker select a target - Attacker uses the feature - Owner of attacker and attacked get prompt to roll check (The attacked chooses what they'll roll, Allows all kind of visibility, Can use other modules already provided)

## Problema, público e contexto

Em partidas de D&D 5e no Foundry VTT v13, manobras de combate básicas (Agarrar / Grapple, Empurrar / Shove e Desarmar / Disarm) exigem disputas de perícias opostas (Atletismo do atacante versus Atletismo ou Acrobacia do defensor).
Atualmente, realizar essas manobras é um processo moroso e manual: os jogadores precisam avisar no chat/voz, abrir as fichas, rolar perícias separadamente, comparar os totais manualmente, verificar restrições de tamanho/alcance e aplicar condições ou movimentar tokens manualmente.

O público afetado são tanto os Jogadores (PCs) quanto o Mestre (GMs controlando NPCs/Monstros). O objetivo é fornecer uma experiência fluida, automatizada e cinemática, respeitando as regras oficiais do D&D 5e (PHB e DMG p. 271) e integrando-se aos módulos visuais instalados no mundo, em especial **Epic Rolls 5e** e **Sequencer**.

Origem do pedido: Prompt inicial via `/grill-me` em 15/11/2026.

## Resultados desejados e métricas

- **Tempo de resolução da manobra**: Reduzir de ~45 segundos (resolução manual via chat/voz) para < 12 segundos (fluxo interativo integrado).
- **Taxa de erro de regras**: Reduzir a zero as violações involuntárias de alcance (> 5 pés) e de tamanho (> 1 categoria de diferença em Agarrar/Empurrar).
- **Aderência dos jogadores**: 100% de disponibilidade dos itens nas fichas de criaturas (PCs e NPCs) sem exigir intervenção manual do Mestre.
- **Segurança operacional**: Zero exclusões ou deleções acidentais de armas no inventário durante a manobra Desarmar.

## Requisitos e prioridades

| Requisito | Palavras do cliente / origem | Prioridade | Critérios na spec |
|---|---|---|---|
| Itens de Ação nas Fichas | "3 itens de Ação separados na ficha de cada criatura ('Manobra: Agarrar', 'Manobra: Empurrar', 'Manobra: Desarmar'), sincronizados automaticamente" | Alta | AC-021 |
| Validação Estrita de Regras | "Validação estrita de D&D 5e: bloqueia Agarrar/Empurrar se o alvo for 2+ tamanhos maior ou fora de alcance (5 pés), e aplica vantagem/desvantagem nas regras de Desarmar" | Alta | AC-022, AC-023 |
| Prompt de Visibilidade Rápida | "Igual a opção 2, só que deixa a escolha padrão já ser o modo de visilibidade escolhido no chat pra agilizar" | Alta | AC-024 |
| Escolha de Defesa via Socket | "The attacked chooses what they'll roll... Owner of attacker and attacked get prompt to roll check" | Alta | AC-025 |
| Disputa Visual via Epic Rolls 5e | "integrar com Epic Rolls 5e: o defensor escolhe a perícia em um pop-up rápido e o Epic Rolls comanda a disputa visual na tela de todos" | Alta | AC-026 |
| Automação de Efeitos no Sucesso | "Completa: Agarrar aplica condição 'Grappled'; Empurrar pergunta se deseja derrubar ou empurrar 5 pés; Desarmar avisa que caiu no chão" | Alta | AC-027, AC-028, AC-029 |
| Movimento Vetorial com Colisão | "Movimentação vetorial automática: O sistema calcula o vetor oposto ao atacante e desloca o token 5 pés automaticamente (com detecção de colisão contra paredes)" | Média | AC-028 |
| Desarmar Seguro (Sem Excluir Itens) | "Não deve retirar nenhum item, só avisar o mestre do ocorrido" | Alta | AC-029 |
| Efeitos Audiovisuais Sequencer | "Sim, efeitos audiovisuais leves via Sequencer/JB2A quando disponíveis" | Média | AC-030 |

## Escopo e exclusões

### Dentro do Escopo
- 3 Itens de Ação nativos do D&D 5e injetados/sincronizados em todos os atores (PCs e NPCs): `Manobra: Agarrar`, `Manobra: Empurrar`, `Manobra: Desarmar`.
- Validador puro de regras (`src/rules/maneuvers.ts`) para alcance de combate corpo a corpo (5 pés) e compatibilidade de categoria de tamanho de criaturas.
- Janela de confirmação do atacante com seletor de visibilidade pré-selecionado para o `rollMode` ativo do chat.
- Mensagem de socket para o cliente do defensor com pop-up modal exibindo opções de Atletismo (com bônus) e Acrobacia (com bônus), com temporizador de 30s e seleção automática do maior bônus em caso de inatividade.
- Disparo de disputa interativa via `Epic Rolls 5e` (`ui.EpicRolls5e.requestRoll`).
- Resolução do empate como vitória do defensor (manutenção do status quo segundo o PHB).
- Automação de condições: condição `Grappled` aplicada ao alvo no Agarrar (via DFreds Convenient Effects ou efeito ativo nativo); condição `Prone` ou empurrão vetorial de 5 pés no Empurrar.
- Detecção de colisão com paredes ao empurrar (interrompe o deslocamento se encontrar obstáculo impenetrável).
- Notificação rica no chat e aviso para o GM indicando o desarmamento da arma empunhada sem modificação destrutiva de inventário.
- VFX/SFX leves via Sequencer.

### Fora do Escopo
- Não permite alterar ou deletar itens do inventário do defensor no Desarmar (preservação estrita de integridade e regra HITL).
- Não automatiza a manobra de escapar do agarrar em turnos subsequentes (continua sendo ação normal de fuga pelas regras padrão).
- Não interfere em manobras de Battle Master (ex: Disarming Attack do Guerreiro Mestre da Batalha, que possui mecânica própria de dano de arma + superioridade).

## Regras de produto e domínios

- **P-001 / P-003**: Toda lógica matemática de combate, cálculo de distância, vetores de empurrão e matriz de comparação de tamanhos deve ser pura e testada em `tests/` sem dependência de globais do Foundry (`src/rules/maneuvers.ts`).
- **P-004**: Efeitos audiovisuais devem possuir toggle em Module Settings (`enableManeuverEffects`) e exposição na API pública (`game.modules.get('endless-tower').api.toggleManeuverEffects()`).
- **P-007**: Ações no Foundry MCP seguem HITL. A manobra de Desarmar não exclui nem desequipa itens de atores automaticamente sem consentimento explícito.

## Dependências, riscos e suposições

- **Epic Rolls 5e**: Módulo ativo no mundo (`globalThis.ui.EpicRolls5e`). Caso não esteja disponível, deve haver fallback limpo com rolagem nativa de D&D 5e.
- **DFreds Convenient Effects**: Utilizado para aplicar `Grappled` e `Prone`. Se ausente, utiliza os status effects nativos do Foundry v13 (`CONFIG.statusEffects`).
- **Sequencer**: Módulo ativo no mundo para VFX/SFX. Se indisponível, a automação mecânica segue normalmente sem erros.
- **Socketlib / Foundry Sockets**: Comunicação client-to-client para emissão do prompt de defesa na máquina do defensor.

## Validação com o cliente

| Pergunta no Grill-me | Opção Recomendada | Resposta Literal do Cliente | Data |
|---|---|---|---|
| Acesso e ativação das manobras | 3 itens de Ação separados nas fichas | "(Recommended) 3 itens de Ação separados na ficha de cada criatura ('Manobra: Agarrar', 'Manobra: Empurrar', 'Manobra: Desarmar'), sincronizados automaticamente" | 15/11/2026 |
| Integração com Epic Rolls 5e | Sim, integrar com Epic Rolls 5e | "(Recommended) Sim, integrar com Epic Rolls 5e: o defensor escolhe a perícia em um pop-up rápido e o Epic Rolls comanda a disputa visual na tela de todos" | 15/11/2026 |
| Nível de automação de efeitos | Completa (condições + empurrão vetorial + aviso de desarmar) | "(Recommended) Completa: Agarrar aplica condição 'Grappled' (DFreds/Core); Empurrar pergunta se deseja derrubar ('Prone') ou empurrar 5 pés; Desarmar desequipa a arma principal e avisa que caiu no chão" | 15/11/2026 |
| Restrições de tamanho e alcance | Validação estrita de D&D 5e | "(Recommended) Validação estrita de D&D 5e: bloqueia Agarrar/Empurrar se o alvo for 2+ tamanhos maior ou fora de alcance (5 pés), e aplica vantagem/desvantagem nas regras de Desarmar" | 15/11/2026 |
| Visibilidade da rolagem | Diálogo com seleção de visibilidade | "Igual a opção 2, só que deixa a escolha padrão já ser o modo de visilibidade escolhido no chat pra agilizar" | 15/11/2026 |
| Movimento vetorial no empurrão | Vetorial automático com colisão | "(Recommended) Movimentação vetorial automática: O sistema calcula o vetor oposto ao atacante e desloca o token 5 pés automaticamente (com detecção de colisão contra paredes)" | 15/11/2026 |
| Manuseio do item no Desarmar | Não retirar itens, apenas avisar | "Não deve retirar nenhum item, só avisar o mestre do ocorrido" | 15/11/2026 |
| Distribuição para Atores | Todos os atores (PCs e NPCs) | "(Recommended) Todos os Atores (Personagens dos Jogadores e NPCs/Monstros), já que as regras de D&D 5e permitem que qualquer criatura use manobras" | 15/11/2026 |
| Efeitos audiovisuais Sequencer | Sim, leves via Sequencer/JB2A | "(Recommended) Sim, efeitos audiovisuais leves via Sequencer/JB2A quando disponíveis" | 15/11/2026 |
