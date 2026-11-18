---
trigger: always_on
---
# Fluxo Obrigatório: Spec-Driven (onp-spec)

1. Antes de criar ou refatorar qualquer feature ou UI, consulte .spec/constituicao.md e siga o fluxo definido em .agents/skills/onp-spec-driven/SKILL.md.
2. Nunca escreva código de implementação sem antes apresentar um plano curto listando arquivos afetados, contratos de componente envolvidos e testes a rodar.
3. Toda alteração de código só é considerada concluída após executar 
pm test e 
pm run build no terminal com exit code 0.