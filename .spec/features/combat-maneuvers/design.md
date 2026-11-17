<!-- onp-spec:documentation-contract=v1 -->

# TDD: Automação de Manobras de Combate (Agarrar, Empurrar e Desarmar)

> feature: combat-maneuvers
> status: revisado

[PRD](prd.md) · [ADR](adr.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)

## 1. Identificação e responsáveis

- **Feature**: `combat-maneuvers` (Automação de Manobras de Combate: Agarrar, Empurrar, Desarmar).
- **Autor e Responsável Técnico**: Time Endless Tower & Vitor Manoel.
- **Participantes**: Mestre e Jogadores da campanha Endless Tower.
- **Data e Versão**: 15/11/2026 — Versão 1.0.0.
- **Estado da Revisão**: Revisado e alinhado via `/grill-me`.

## 2. Contexto e sistema atual

O módulo Endless Tower opera em Foundry VTT v13 sobre o sistema D&D 5e v5.2.5. Atualmente, possui recursos como salto com projéteis Sequencer (`src/features/jump.ts`), alertas de combate de chefe (`src/features/critical-encounter.ts`) e isolamento tático (`src/features/solitude.ts`).
As manobras de combate básicas de D&D 5e não possuíam automação: jogadores precisavam calcular distâncias manualmente, comparar fichas, abrir diálogos de perícia separados e calcular empurrões e condições manualmente no canvas.

## 3. Problema e motivação

A ausência de automação para manobras de combate (Grapple, Shove, Disarm) diminui a frequência com que jogadores utilizam opções táticas no combate devido ao tempo gasto (~45s por manobra) e discussões sobre alcance e tamanho de criaturas. A automação reduz o tempo para < 12s, garante precisão estrita de regras e oferece apresentação cinematográfica via `Epic Rolls 5e` e `Sequencer`.

## 4. Escopo e não objetivos

### Escopo
- 3 Itens de Ação nas fichas: `Manobra: Agarrar`, `Manobra: Empurrar`, `Manobra: Desarmar` (AC-001).
- Validação estrita de regras puras: alcance de 5 pés e limite de tamanho (AC-002, AC-003).
- Pop-up com seleção ágil de visibilidade herdada do chat (AC-004).
- Prompt de defesa via socket para o dono do defensor escolher Atletismo ou Acrobacia (AC-005).
- Disputa interativa em tela cheia via Epic Rolls 5e (AC-006).
- Aplicação automática de `Grappled` no Agarrar (AC-007).
- Escolha entre `Prone` e empurrão vetorial de 5 pés com detecção de colisão no Empurrar (AC-008).
- Notificação rica no chat e aviso ao GM no Desarmar, mantendo integridade do inventário (AC-009).
- Efeitos audiovisuais via Sequencer e toggle em settings (AC-010).

### Não Objetivos
- Não alterar itens ou inventário do defensor no Desarmar (regra estrita HITL).
- Não automatizar testes de fuga de agarrar em rodadas subsequentes.
- Não substituir manobras de Battle Master com dados de superioridade.

## 5. Solução e arquitetura

A arquitetura é dividida em dois núcleos estritos conforme o princípio P-003:

### 5.1 Núcleo de Regras Puras (`src/rules/maneuvers.ts`)
Totalmente livre de globais do Foundry (`game`, `canvas`, `Hooks`, `ui`), permitindo testes unitários de alta velocidade em Vitest:
- `validateManeuverPrerequisites(attacker, target, maneuverType)`: Checa se a distância está dentro do alcance permitido (5 pés) e se a diferença de tamanho é válida (alvo no máximo 1 tamanho maior para Agarrar e Empurrar).
- `determineContestWinner(attackerTotal, defenderTotal)`: Retorna `'attacker'` se `attackerTotal > defenderTotal`, senão `'defender'` (empate favorece o defensor).
- `getDisarmModifiers(attackerSize, defenderSize, isTwoHanded)`: Retorna vantagens ou desvantagens conforme as regras de tamanho e arma de duas mãos do DMG p. 271.
- `calculatePushVector(attackerPos, targetPos, distanceUnits, gridSize, gridDistance)`: Calcula a nova coordenada $(x, y)$ empurrando o alvo na direção oposta ao atacante.

### 5.2 Adaptador do Foundry VTT (`src/features/combat-maneuvers.ts`)
Conecta os eventos do Foundry ao motor puro:
- **Injeção de Itens**: Sincroniza os 3 itens de manobra nos atores (PCs e NPCs) em `ready` e `createActor`.
- **Hook `dnd5e.preUseItem`**: Intercepta a ativação do item de manobra para iniciar o fluxo.
- **Validação de Alvo**: Verifica se o atacante tem 1 alvo selecionado (`game.user.targets`).
- **Comunicação Socket**:
  - `SOCKET_ACTION_DEFENSE_PROMPT`: Envia requisição para a máquina do dono do defensor.
  - `SOCKET_ACTION_DEFENSE_RESPONSE`: Retorna a perícia escolhida (`ath` ou `acr`).
- **Execução do Epic Rolls 5e**:
  - Chama `ui.EpicRolls5e.requestRoll({ actors: [attacker.uuid], contestants: [target.uuid], type: "skill.ath", contest: chosenSkill, options: { blindRoll } })`.
- **Aplicação de Efeitos e Movimento**:
  - Agarrar: Aplica condição via `game.dfreds.effectInterface` ou status effect nativo.
  - Empurrar: Exibe diálogo de escolha (Derrubar vs Empurrar 5ft). Para o empurrão, checa colisão de paredes via `canvas.walls.checkCollision` e desloca o token via `token.document.update({ x, y })`.
  - Desarmar: Localiza a arma empunhada do alvo e cria mensagem no chat com aviso destacado para o Mestre.

## 6. Riscos e mitigação

| Risco | Evidência / hipótese | Probabilidade | Impacto | Mitigação | Responsável |
|---|---|---|---|---|---|
| Defensor ausente ou AFK | Jogador não clica no diálogo de defesa | Média | Alto (trava o combate) | Timeout de 30s com fallback automático para a maior perícia | Dev / Feature |
| Colisão com parede no empurrão | Empurrar token para dentro de uma parede | Média | Médio (quebra imersão) | Uso de `checkCollision` antes de atualizar posição | Dev / Feature |
| Epic Rolls 5e indisponível | Módulo desinstalado ou desativado | Baixa | Médio | Fallback limpo com rolagens padrão de D&D 5e no chat | Dev / Feature |
| Deleção acidental de arma | Script remover item do inventário do alvo | Baixa | Crítico | Regra HITL: o Desarmar apenas notifica e não modifica o inventário | Dev / Feature |

## 7. Plano de implementação

1. **Etapa 1 (Regras Puras)**: Implementar `src/rules/maneuvers.ts` e suite de testes unitários `tests/maneuvers.test.ts` cobrindo todos os casos de regras e vetores.
2. **Etapa 2 (Definição de Itens e Sincronização)**: Criar os dados dos 3 itens de Ação e a rotina de injeção em atores em `src/features/combat-maneuvers.ts`.
3. **Etapa 3 (Comunicação Socket e Diálogos)**: Implementar a troca de mensagens de socket para a escolha de defesa do defensor com timeout.
4. **Etapa 4 (Integração com Epic Rolls 5e e Resolução)**: Chamar `requestRoll` e processar o vencedor com resolução de empates.
5. **Etapa 5 (Automação de Efeitos e Sequencer)**: Aplicar condições, empurrão vetorial com colisão e VFX/SFX leves.
6. **Etapa 6 (Auditoria e Validação)**: Executar suite de testes Vitest e auditoria do `onp-spec audit`.

## 8. Segurança e privacidade

- **Permissões**: Apenas o proprietário do token atacante (ou GM) pode iniciar a manobra. Apenas o proprietário do token defensor (ou GM) pode escolher a perícia de defesa.
- **Integridade de Fichas (HITL / P-007)**: Não há alteração destrutiva ou remoção de itens em fichas alheias.
- **Validação de Socket**: Todas as mensagens de socket validam a existência dos tokens e a legitimidade dos remetentes antes de processar.

## 9. Estratégia de testes

- **Testes Unitários (P-003 / Vitest)** em `tests/maneuvers.test.ts`:
  - Validação de alcance de 5 pés (passa a 5ft, falha a 10ft).
  - Validação de tamanhos de criaturas (Médio vs Grande passa; Médio vs Enorme falha).
  - Determinação de vencedor e regra de empate (Atacante 15 vs Defensor 15 -> Defensor vence).
  - Cálculo de vetores de empurrão em múltiplos ângulos ortogonais e diagonais.
  - Vantagem e desvantagem no desarmamento conforme o tamanho e empunhadura de duas mãos.
- **Rastreabilidade de Critérios**: Cada teste anota `@spec:AC-xxx` e `@principle:P-xxx`.

## 10. Operação e observabilidade

- Logs claros com prefixo `[Endless Tower | Maneuvers]` para inicialização e resolução de disputas.
- Mensagens de erro amigáveis para jogadores via `ui.notifications.warn` (ex: "Alvo fora de alcance corpo a corpo").
- Cartões estilizados no Chat do Foundry resumindo o resultado narrativo e mecânico da manobra.

## 11. Reversão e recuperação

- **Reversibilidade Visual (P-004)**: Configuração booleana em Module Settings (`enableManeuverEffects`) para desativar efeitos de Sequencer.
- **API Pública**: Método `game.modules.get('endless-tower').api.toggleManeuverEffects()`.
- **Desativação Total**: Desativar a opção no módulo restaura o comportamento manual imediatamente.

## 12. Métricas de sucesso

- 100% dos testes unitários passando em Vitest com zero falhas.
- Resolução de manobras concluída em menos de 15 segundos em sessões reais.
- Zero reportes de tokens atravessando paredes ou itens excluídos indevidamente.

## 13. Glossário e domínios

- **Manobra**: Ação de combate especial (Agarrar, Empurrar, Desarmar) que substitui um ataque.
- **Disputa Oposta (Contested Check)**: Teste onde dois participantes rolam dados e o maior total vence; empates mantêm a situação anterior.
- **Grappled (Agarrado)**: Condição que reduz o deslocamento a 0.
- **Prone (Caído)**: Condição onde o alvo está no chão, sofrendo desvantagem em seus ataques e concedendo vantagem para ataques corpo a corpo adjacentes.
- **Disarm (Desarmar)**: Regra opcional do DMG p. 271 onde o atacante tenta fazer o defensor soltar sua arma.

## 14. Alternativas e decisões

Consulte o documento [ADR](adr.md) para análise comparativa entre as três alternativas e a justificativa da adoção da solução híbrida com Epic Rolls 5e e prompt socket.

## 15. Dependências e compatibilidade

- **Foundry VTT**: v13.351+
- **Sistema D&D 5e**: v5.2.5+
- **Epic Rolls 5e**: v5.1.3+ (com fallback transparente se inativo)
- **DFreds Convenient Effects**: v8.2.4+ (com fallback para status effects nativos)
- **Sequencer**: v4.2.3+ (opcional para VFX)

## 16. Performance e capacidade

- As funções de regras puras executam em menos de 1 milissegundo.
- O consumo de banda do socket é insignificante (< 1 KB por manobra).
- Nenhuma consulta contínua em loop ou polling de canvas.

## 17. Migração e implantação

- Sincronização idempotente: verifica a existência dos itens antes de criá-los, garantindo que não haja duplicatas em reloads.
- Não há migração de banco de dados ou formato de dados legado.

## 18. Perguntas e suposições

- **ASM-001**: O módulo Epic Rolls 5e está instalado no mundo ativo (confirmado).
- **Q-001**: O desarmar deve excluir itens do inventário? Respondido: Não, apenas notificar o Mestre e chat (confirmado).

## 19. Marcos e acompanhamento

- **Marco 1**: Regras puras e testes Vitest (T-001, T-002).
- **Marco 2**: Sincronização de itens e adaptador de Foundry (T-003, T-004).
- **Marco 3**: Sockets, Epic Rolls e automação de efeitos (T-005, T-006).
- **Marco 4**: Verificação com `onp-spec audit` e build limpo de produção (T-007).

## 20. Revisão e rastreabilidade

Rastreabilidade completa: PRD → ADR → TDD (design.md) → Spec (spec.md) → Tasks (tasks.md) → Testes (`tests/maneuvers.test.ts`). Status atualizado para revisado com aprovação do usuário.
