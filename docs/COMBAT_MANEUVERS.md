# Manobras de Combate (`combat-maneuvers`)

Automação ágil e estrita às regras de D&D 5e (PHB p. 195 e DMG p. 271) para as três manobras básicas de combate no Foundry VTT v13: **Agarrar (Grapple)**, **Empurrar (Shove)** e **Desarmar (Disarm)**.

## O que a feature faz

1. **Sincronização Automática de Itens**:
   - Adiciona automaticamente 3 itens de Ação (`Manobra: Agarrar`, `Manobra: Empurrar`, `Manobra: Desarmar`) na ficha de todos os atores (PCs e NPCs/Monstros) de forma idempotente.
2. **Validação Estrita de D&D 5e**:
   - Exige exatamente 1 alvo selecionado no canvas.
   - Verifica alcance corpo a corpo de **5 pés** (métrica Chebyshev).
   - Para *Agarrar* e *Empurrar*, bloqueia alvos com mais de 1 categoria de tamanho acima do atacante.
3. **Visibilidade Ágil e Escolha Dinâmica do Defensor**:
   - O atacante confirma a visibilidade da disputa em um diálogo rápido pré-configurado com o `rollMode` ativo do chat (`publicroll`, `gmroll`, `blindroll`, `selfroll`).
   - O proprietário do alvo recebe um prompt via socket na sua tela para escolher entre **Atletismo (Força)** ou **Acrobacia (Destreza)** com seus bônus calculados e temporizador de 30s (fallback automático para o maior bônus).
4. **Disputa Visual via Epic Rolls 5e**:
   - Integra-se com `ui.EpicRolls5e.requestRoll` para exibir a disputa em tela cheia para a mesa (com fallback transparente para rolagens nativas de D&D 5e caso o módulo não esteja ativo).
   - Empates favorecem o defensor (manutenção do status quo conforme D&D 5e).
5. **Automação de Efeitos no Sucesso**:
   - **Agarrar**: Aplica a condição `Grappled` via *DFreds Convenient Effects* (ou status nativo do Foundry) e anuncia no chat.
   - **Empurrar**: O atacante escolhe entre derrubar o alvo (`Prone`) ou empurrá-lo **5 pés** em linha reta oposta ao atacante com detecção de colisão contra paredes.
   - **Desarmar**: Identifica a arma empunhada e publica um aviso destacado no chat para o Mestre e jogadores, **sem remover ou alterar itens da ficha** (salvaguarda HITL).

## Configurações e Módulos Recomendados

- **Epic Rolls 5e** (Recomendado): Fornece a interface cinemática de disputa oposta.
- **DFreds Convenient Effects** (Recomendado): Aplica as condições `Grappled` e `Prone` com ícones e automações completas.
- **Sequencer** (Opcional): Executa efeitos visuais e sonoros leves ao concluir manobras com sucesso.

## Configurações de UI e Comandos de API / Macro

- **Configuração do Módulo**: Em *Configure Settings → Endless Tower → Efeitos Audiovisuais de Manobras*, é possível ativar ou desativar os efeitos visuais/sonoros do Sequencer.
- **API Pública** (`game.modules.get('endless-tower').api`):
  - `toggleManeuverEffects()`: Alterna os efeitos audiovisuais em tempo de execução.
  - `syncManeuvers()`: Força a sincronização dos 3 itens de manobra em todos os atores do mundo e cena ativa.
  - `ensureManeuvers(actor)`: Garante os 3 itens de manobra em um ator específico.

## Arquivos Principais

- `src/rules/maneuvers.ts` — Motor de regras puras (alcance, tamanhos, desempate, modificadores de desarmar e cálculo vetorial de empurrão).
- `src/features/combat-maneuvers.ts` — Adaptador Foundry VTT (itens, hooks de uso, sockets, diálogos, integração Epic Rolls 5e, condições e Sequencer).
- `src/main.ts` — Registro da feature e exposição na API pública.
- `tests/maneuvers.test.ts` & `test/combat-maneuvers.spec.test.js` — Suíte de testes unitários e provas de critérios de aceite (`AC-001` a `AC-010`).
