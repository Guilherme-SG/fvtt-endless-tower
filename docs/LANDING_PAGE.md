# Guia da Landing Page — Endless Tower

Este documento explica como funciona e como utilizar a cena de **Landing Page** integrada ao módulo `endless-tower` no FoundryVTT.

---

## 1. Visão Geral

A **Landing Page** ("Landing Page" ou "Panteão dos Deuses") é a cena de acolhimento dos jogadores no FoundryVTT. Ela utiliza a arte 4K em WebP (`endless-tower-login-screen.webp`) e inclui recursos cinematográficos nativos:

* **Clean UI (Modo Foco):** A barra de atalhos (*hotbar*), a lista de jogadores, os controles de ferramentas e a navegação de cenas ficam esmaecidos (quase invisíveis) para dar destaque total à arte.
* **Recuperação por Hover:** Ao aproximar o mouse de qualquer menu ou barra, o elemento volta suavemente a 100% de visibilidade.
* **Partículas Douradas:** 45 partículas de luz sobem suavemente pelo cenário com movimento senoidal e brilho dourado em tempo real.
* **Câmera Viva (Ken Burns Suave):** Movimento contínuo e sutil de respiração e aproximação (`animation: et-board-drift`).
* **Enquadramento Automático:** Ao abrir a cena, a câmera do Foundry se ajusta e centraliza automaticamente na resolução da arte.

---

## 2. Como Criar ou Ativar a Cena

A cena é criada automaticamente no primeiro carregamento do mundo quando o Gamemaster faz login.

Caso precise recriar ou forçar a ativação via console/macro:
```javascript
// Cria a cena caso não exista e já a ativa imediatamente:
game.modules.get('endless-tower').api.createLandingScene(true);
```

### Configurações recomendadas da cena:
* **Nome:** `Landing Page`
* **Fundo:** `endless-tower/landscape/endless-tower-login-screen.webp`
* **Dimensões:** 1672 x 941 px
* **Padding:** 0
* **Tipo de Grade:** Sem Grade (*Gridless*)
* **Iluminação:** Luz Global ligada, Nível de Escuridão 0.
* **Visão:** Visão de Token desligada, Exploração de Névoa desligada.

---

## 3. Como Ligar, Desligar ou Reverter os Efeitos

O recurso foi projetado para ser **100% reversível e configurável**:

### Opção A: Pela Interface do Foundry (Sem código)
1. Abra as **Configurações de Jogo** ⚙️ no menu lateral direito.
2. Clique em **Configurar Opções** > aba **Opções de Módulos**.
3. Na seção **Endless Tower**, localize a opção:
   `[x] Efeitos Visuais na Landing Page`
4. Desmarque a caixa para desativar as partículas e a câmera viva imediatamente. Marque para reativar.

### Opção B: Por Macro ou Console
```javascript
// Desativa imediatamente:
game.modules.get('endless-tower').api.toggleLandingEffects(false);

// Ativa imediatamente:
game.modules.get('endless-tower').api.toggleLandingEffects(true);

// Alterna entre ligado/desligado:
game.modules.get('endless-tower').api.toggleLandingEffects();
```

---

## 4. Arquivos Envolvidos

* `src/features/landing-scene.ts` — Gerenciador da cena, inicialização do canvas de partículas, hooks de ciclo de vida (`canvasReady`, `canvasTearDown`) e registro da configuração.
* `styles/landing.css` — Estilização do modo Clean UI e da animação de câmera suave no `#board`.
* `module.json` — Declaração do estilo `styles/landing.css`.
* `src/main.ts` — Ponto de entrada do TypeScript que registra a feature e expõe a API pública.
