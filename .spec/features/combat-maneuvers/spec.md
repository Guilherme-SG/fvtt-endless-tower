<!-- onp-spec:documentation-contract=v1 -->

# Spec: Combat maneuvers

> feature: combat-maneuvers
> status: implementada

## Contexto

Automação ágil, estrita às regras de D&D 5e e visualmente cinemática para as manobras de combate Agarrar, Empurrar e Desarmar no Foundry VTT v13, com seleção dinâmica de defesa e integração ao Epic Rolls 5e.

## Histórias

### US-001 — Acesso e Disponibilidade das Manobras nas Fichas

Como jogador ou Mestre controlando qualquer criatura no combate,
quero ter as 3 manobras de combate básicas disponíveis diretamente na ficha como itens de ação,
para que eu possa acioná-las com um clique durante o meu turno.

#### AC-001 — Itens de manobra criados e sincronizados em todos os atores

- **Dado** que um ator (PC ou NPC) existe no mundo ou acabou de ser criado,
- **Quando** o módulo Endless Tower é carregado ou a ficha é inspecionada,
- **Então** os itens `Manobra: Agarrar`, `Manobra: Empurrar` e `Manobra: Desarmar` estão presentes na lista de ações do ator sem duplicações.

---

### US-002 — Validação Estrita de Regras de Alcance e Tamanho (D&D 5e)

Como atacante tentando uma manobra de combate,
quero que o sistema valide automaticamente se o alvo está no alcance corpo a corpo e respeita os limites de tamanho da 5ª Edição,
para que não haja jogadas ilegais ou disputas de regras na mesa.

#### AC-002 — Bloqueio de alvos fora do alcance corpo a corpo

- **Dado** que o atacante tem um alvo selecionado a uma distância maior que o alcance corpo a corpo (5 pés),
- **Quando** o atacante aciona qualquer uma das manobras,
- **Então** o sistema bloqueia a execução e exibe uma notificação amigável avisando que o alvo está fora do alcance.

#### AC-003 — Bloqueio de Agarrar/Empurrar em alvos com tamanho superior ao permitido

- **Dado** que o atacante é de tamanho Médio e seleciona um alvo de tamanho Enorme (Huge) ou Imenso (Gargantuan) (mais de 1 categoria maior),
- **Quando** o atacante tenta as manobras `Manobra: Agarrar` ou `Manobra: Empurrar`,
- **Então** o sistema cancela a manobra e informa que o alvo é grande demais para ser agarrado ou empurrado.

---

### US-003 — Seleção de Visibilidade Ágil e Escolha do Defensor

Como atacante ou defensor em uma manobra,
quero escolher a visibilidade da rolagem de forma ágil e ter a liberdade de defender com Atletismo ou Acrobacia,
para que as rolagens respeitem o segredo do Mestre e a tática do jogador.

#### AC-004 — Seletor de visibilidade pré-configurado com o modo do chat

- **Dado** que o atacante ativou uma manobra válida,
- **Quando** a janela de confirmação de rolagem é aberta,
- **Então** o campo de visibilidade de rolagem está pré-selecionado para o modo atualmente ativo no chat do usuário (ex: Pública, Cega ou GM Roll).

#### AC-005 — Prompt interativo de defesa para o dono do alvo

- **Dado** que a manobra foi iniciada,
- **Quando** o atacante confirma a ativação,
- **Então** o cliente do proprietário do defensor recebe um diálogo na tela para escolher entre `Atletismo` e `Acrobacia` (com exibição dos respectivos bônus), com fallback automático para o maior bônus após 30 segundos.

---

### US-004 — Disputa Visual e Resolução de Empate

Como participantes do combate,
queremos que a disputa ocorra com suspense visual e que as regras de desempate do D&D 5e sejam seguidas,
para que o momento seja dramático e justo.

#### AC-006 — Disputa via Epic Rolls 5e e vitória do defensor no empate

- **Dado** que a perícia de defesa foi escolhida,
- **Quando** a disputa é submetida ao Epic Rolls 5e,
- **Então** o confronto é exibido cinematograficamente na tela; se o total do atacante for estritamente maior que o do defensor, o atacante vence; se houver empate ou total do defensor for maior, o defensor resiste com sucesso.

---

### US-005 — Aplicação Automática dos Efeitos de Combate

Como participantes do combate,
queremos que as consequências da manobra bem-sucedida sejam aplicadas imediatamente no jogo,
para que o combate continue sem pausas para ajustes manuais.

#### AC-007 — Aplicação da condição Agarrado (Grappled)

- **Dado** que o atacante venceu a disputa na manobra `Manobra: Agarrar`,
- **Quando** o resultado da disputa é concluído,
- **Então** a condição `Grappled` é aplicada ao token/ator do defensor e um aviso é publicado no chat.

#### AC-008 — Escolha entre Derrubar Caído ou Deslocamento Vetorial de 5 pés

- **Dado** que o atacante venceu a disputa na manobra `Manobra: Empurrar`,
- **Quando** o resultado é concluído,
- **Então** o atacante pode escolher entre aplicar a condição `Prone` ou empurrar o alvo 5 pés em linha reta oposta ao atacante (respeitando colisões com paredes).

#### AC-009 — Notificação de Desarmar sem alteração destrutiva de inventário

- **Dado** que o atacante venceu a disputa na manobra `Manobra: Desarmar`,
- **Quando** o resultado é concluído,
- **Então** o sistema publica no chat e notifica o Mestre de que o alvo largou a arma empunhada no chão, sem remover ou excluir o item da ficha do ator.

---

### US-006 — Efeitos Audiovisuais e Reversibilidade

Como Mestre da mesa,
quero que as manobras tenham efeitos visuais e sonoros opcionais que possam ser desativados facilmente,
para que eu tenha controle sobre o estilo visual da sessão.

#### AC-010 — Efeitos audiovisuais via Sequencer com configuração de desativação

- **Dado** que uma manobra é concluída com sucesso,
- **Quando** a configuração `enableManeuverEffects` está ativa,
- **Então** efeitos leves de Sequencer/SFX são executados; caso desativada na configuração do módulo, nenhum efeito adicional é disparado.

## Fora de escopo

- Não remove ou altera dados de itens do inventário do defensor no Desarmar (preservação estrita HITL).
- Não gerencia a ação de escapar do agarrar em turnos futuros.
- Não substitui ou interfere em manobras de Battle Master com dados de superioridade.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-001 | O módulo Epic Rolls 5e está ativo no mundo e expõe `globalThis.ui.EpicRolls5e.requestRoll` | confirmada | Confirmado no ambiente; há fallback para rolagens de chat nativas se inativo. |
| ASM-002 | O alcance de combate corpo a corpo padrão para criaturas sem armas de haste é de 5 pés | confirmada | Confirmado no alinhamento de regras do D&D 5e. |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-001 | O Desarmar deve desequipar ou deletar itens do inventário do alvo? | respondida | Não deve retirar nenhum item, só avisar o mestre do ocorrido (confirmado no Grill-me). |
| Q-002 | O empurrão de 5 pés deve mover o token automaticamente? | respondida | Sim, movimentação vetorial automática oposta ao atacante com detecção de paredes (confirmado no Grill-me). |

## Documentos relacionados

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)
