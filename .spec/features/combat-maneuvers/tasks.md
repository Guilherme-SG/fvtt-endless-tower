<!-- onp-spec:documentation-contract=v1 -->

# Tasks: Combat maneuvers

> feature: combat-maneuvers

## T-001 — Implementar motor de regras puras de manobras (alcance, tamanhos, desempates e vetores) [concluida]

- Refs: US-022, AC-022, AC-023, AC-026, AC-028
- Arquivos: src/features/combat-maneuvers/rules.ts
- Notas: Segue o princípio P-003 da Constituição (livre de globais do Foundry).

## T-002 — Implementar suíte de testes unitários em Vitest para regras de manobras [concluida]

- Refs: AC-022, AC-023, AC-026, AC-028
- Arquivos: tests/maneuvers.test.ts
- Notas: Cada teste deve conter as anotações @spec:AC-xxx e @principle:P-xxx.

## T-003 — Criar definições dos itens de manobra e sincronização automática em atores [concluida]

- Refs: US-021, AC-021
- Arquivos: src/features/combat-maneuvers/config.ts, src/features/combat-maneuvers/adapter.ts, src/features/combat-maneuvers/index.ts
- Notas: Criação idempotente dos 3 itens de ação nas fichas de todos os atores (PCs e NPCs).

## T-004 — Implementar interceptação de uso de item, validação de alvo e seleção ágil de visibilidade [concluida]

- Refs: US-022, AC-022, AC-023, US-023, AC-024
- Arquivos: src/features/combat-maneuvers/adapter.ts
- Notas: Intercepta dnd5e.preUseItem, valida se há alvo selecionado e pré-preenche a visibilidade com o chat rollMode.

## T-005 — Implementar comunicação socket para prompt interativo de defesa com timeout [concluida]

- Refs: US-023, AC-025
- Arquivos: src/features/combat-maneuvers/adapter.ts
- Notas: Emite diálogo na máquina do dono do defensor com escolha entre Atletismo e Acrobacia e fallback de 30s.

## T-006 — Integrar com Epic Rolls 5e e implementar resolução de efeitos, empurrão vetorial e aviso de desarmar [concluida]

- Refs: US-024, AC-026, US-025, AC-027, AC-028, AC-029
- Arquivos: src/features/combat-maneuvers/adapter.ts
- Notas: Dispara EpicRolls5e.requestRoll, aplica Grappled no Agarrar, escolha de Prone ou deslocamento vetorial no Empurrar e aviso sem alteração de inventário no Desarmar.

## T-007 — Implementar efeitos audiovisuais Sequencer, settings de reversibilidade e registro no módulo [concluida]

- Refs: US-026, AC-030
- Arquivos: src/features/combat-maneuvers/adapter.ts, src/features/combat-maneuvers/config.ts, src/main.ts
- Notas: Segue P-004 da Constituição (setting booleana, método api.toggleManeuverEffects e limpeza).

## Documentos relacionados

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Pesquisa](research.md)
