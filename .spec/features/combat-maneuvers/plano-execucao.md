# Plano de execução: combat-maneuvers

Harness: **antigravity** · modo: **paralelo** · execução: implement_combat_maneuvers_automation-combat-maneuvers-mwijfgwz-f7e5192f

Use o plano/tarefas, perguntas, agentes, timers e notificações NATIVOS disponíveis nesta sessão.
Confirme a seleção de tarefas e o custo quando ainda não autorizados. Modelos são resolvidos no catálogo atual do harness; nenhum nome é presumido.

| faixa | tarefa | modelo solicitado | esforço | arquivos |
|---|---|---|---|---|
| faixa-1 | T-001 — Implementar motor de regras puras de manobras (alcance, tamanhos, desempates e vetores) | padrão disponível do harness | medium | src/rules/maneuvers.ts |
| faixa-2 | T-002 — Implementar suíte de testes unitários em Vitest para regras de manobras | padrão disponível do harness | medium | tests/maneuvers.test.ts |
| faixa-3 | T-003 — Criar definições dos itens de manobra e sincronização automática em atores | padrão disponível do harness | medium | src/features/combat-maneuvers.ts |
| faixa-3 | T-004 — Implementar interceptação de uso de item, validação de alvo e seleção ágil de visibilidade | padrão disponível do harness | medium | src/features/combat-maneuvers.ts |
| faixa-3 | T-005 — Implementar comunicação socket para prompt interativo de defesa com timeout | padrão disponível do harness | medium | src/features/combat-maneuvers.ts |
| faixa-3 | T-006 — Integrar com Epic Rolls 5e e implementar resolução de efeitos, empurrão vetorial e aviso de desarmar | padrão disponível do harness | medium | src/features/combat-maneuvers.ts |
| faixa-3 | T-007 — Implementar efeitos audiovisuais Sequencer, settings de reversibilidade e registro no módulo | padrão disponível do harness | medium | src/features/combat-maneuvers.ts, src/main.ts |

## Execução

`node .spec/features/combat-maneuvers/executar-tarefas.mjs`

Opções: --listar, --faixa <id>, --seq <T-xxx>, --gate. Retomadas preservam commits, alterações parciais e sessões registradas.
Cada faixa usa worktree e branch próprios; merge é serial e preserva conflitos para revisão. Tarefas só concluem com commit, árvore limpa e gate verificável.
Antes de implementar, revise o impacto em PRDs, ADRs e domínios anteriores. Conflitos pendentes bloqueiam a execução até resposta explícita do cliente.
A 5% ou menos restantes, o executor aguarda o reset e consulta a cota novamente. Sem telemetria inicial, exige uma ponte nativa antes de iniciar; após bloqueio, preserva a espera até leitura fresca. Nunca inventa um saldo.
Progresso sai como eventos no terminal/ledger para o harness nativo. Notificações dependem da preferência do usuário e da capacidade disponível.

## Encerramento

Rode `onp-spec verify combat-maneuvers` e `onp-spec audit --ci`.
Pergunte com a ferramenta nativa se o usuário quer limpar os worktrees usados. Liste com `onp-spec worktrees combat-maneuvers`; remova somente após resposta afirmativa, com `--limpar --confirmar`.
Worktrees sujos, ativos ou não integrados são preservados. Não apague branches automaticamente.
