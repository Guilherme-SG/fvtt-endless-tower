# Endless Tower Sheet — Fichas Celestial Chronicle (Player & NPC)

Guia de referência para as fichas personalizadas **Endless Tower Sheet**, criadas como variantes opt-in das fichas oficiais do D&D 5e no Foundry VTT v13.

## O que a feature faz

- Registra duas fichas alternativas chamadas **`Endless Tower Sheet`**:
  - **Jogador (`character`)**: Estende `dnd5e.applications.actor.CharacterActorSheet`.
  - **NPC (`npc`)**: Estende `dnd5e.applications.actor.NPCActorSheet`.
- Mantém **100% do layout, dimensões, grades, abas e automações originais** do sistema D&D 5e (sem sobrescrever templates HTML nem `makeDefault`).
- Aplica exclusivamente a paleta tonal **Warm Obsidian** do Celestial Chronicle Design System por meio da classe isolada `.et-sheet`: elevação suave entre fundo (`#141210`) e cartões (`#1d1a16`), separação por bordas hairline sutis (regra 60-30-10), hierarquia de texto em 3 degraus (osso quente `#e6dfd3`, cinza médio `#aca496` e muted `#989083`), acentos focais em ouro envelhecido (`#b89b63`) e cabeçalhos de lista em carmesim profundo (`#4a1b22` → `#2d1418`).
- Preserva integralmente as fichas nativas do D&D 5e quando não selecionada.

## Como alternar para a ficha

1. Abra qualquer ficha de **Jogador** ou **NPC**.
2. No canto superior direito da barra da janela (ou menu de três pontos `⋮`), clique em **Configure Sheet** (*Configurar Ficha*).
3. No seletor **This Sheet**, escolha **`Endless Tower Sheet`**.
4. Clique em **Save** (ou **Default Sheet** se quiser definir como padrão apenas para novos atores daquele tipo).

## Configurações e comandos

- **Reversibilidade instantânea**: basta voltar para **`Default Sheet (D&D 5e)`** em *Configure Sheet* para restaurar a aparência vanilla na hora.
- As cores são carregadas junto com o bundle principal do Design System (`styles/design-system/sheets.css`).

## Arquivos principais envolvidos

- `src/features/design-system/celestial-sheets.ts` — Subclasses `EndlessTowerCharacterSheet` e `EndlessTowerNPCSheet` com classe `.et-sheet` e registro em `DocumentSheetConfig`.
- `src/features/design-system/design-system.ts` — Invoca `registerEndlessTowerSheets()` no hook `setup`.
- `styles/design-system/sheets.css` — Variáveis `--dnd5e-*` e cores escopadas estritamente em `.dnd5e2.sheet.actor.et-sheet`.
- `styles/design-system.css` — Bundle mestre que importa `./design-system/sheets.css`.
