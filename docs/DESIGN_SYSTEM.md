# Celestial Chronicle — Design System (Endless Tower)

O **Celestial Chronicle Design System** é a base de interface unificada do mundo **Endless Tower** no Foundry VTT (v13, D&D 5e). Ele estabelece uma identidade visual imersiva, elegante e consistente inspirada no Panteão Celestial, na atmosfera dark fantasy de *Souls-like* e na nostalgia de *Ragnarok Online*.

Com este sistema, todos os menus, janelas, rolagens de chat, cartões, formulários, botões, tipografias, efeitos visuais e sonoros passam a compartilhar as mesmas regras estéticas e funcionais.

---

## 1. Filosofia de Design

1. **Vidro Negro Obsidiana (*Frosted Dark Glass*)**:
   - Superfícies escuras translúcidas (`rgba(14, 12, 10, 0.88)` a `0.95`) com desfoque de fundo (`backdrop-filter: blur(12px-16px)`).
   - Mapas, tokens e luzes dinâmicas permanecem visíveis através da interface sem poluição visual.
2. **Paleta Celestial (Marfim e Ouro Profundo)**:
   - Marfim radiante (`--et-ivory: #fff8e6`) para texto e títulos de alto contraste.
   - Ouro celestial (`--et-gold: #f3e2b0`) e ouro queimado (`--et-gold-deep: #d9b865`) para runas, bordas, destaques e botões dourados.
   - Halos e auras luminosas suaves (`rgba(243, 226, 176, 0.45)`).
3. **Acentos Semânticos Rúnicos**:
   - **Carmesim Sangue** (`--et-crimson: #9e1b1b`): Combate, ameaças, falhas críticas, monstros e perigo.
   - **Azul Celeste / Mana** (`--et-azure: #7bb5e6`): Magias arcanas, segredos, sussurros privados (`ᛟ`) e pontos de mana.
   - **Verde Esmeralda** (`--et-emerald: #5bc88e`): Cura, vitalidade, bênçãos, sucessos e toggles ativos.
   - **Âmbar** (`--et-amber: #e6a73a`): Concentração, iniciativa e avisos.
4. **Faixas Edge-to-Edge (Nunca Caixas Flutuantes Centralizadas)**:
   - Grandes anúncios e alertas utilizam faixas horizontais de tela inteira (`100vw`) com fade lateral, bordas superior e inferior afiladas e tipografia em linha única sem quebra de texto.
5. **Feedback Multissensorial**:
   - Cada clique, abertura de janela, mudança de aba ou rolagem de dado possui resposta sonora sutil e animações suaves (shimmer, respiração de luz e partículas douradas).

---

## 2. Tokens de Design (CSS Variables)

Todos os tokens são declarados globalmente em `:root` e disponibilizados em `styles/design-system/tokens.css`:

### Cores Principais
```css
:root {
  --et-ivory: #fff8e6;
  --et-ivory-dim: rgba(255, 248, 230, 0.78);
  --et-ivory-muted: rgba(255, 248, 230, 0.48);

  --et-gold: #f3e2b0;
  --et-gold-bright: #ffeab3;
  --et-gold-deep: #d9b865;
  --et-gold-glow: rgba(243, 226, 176, 0.45);
  --et-gold-glow-subtle: rgba(217, 184, 101, 0.22);

  --et-obsidian-95: rgba(12, 10, 8, 0.95);
  --et-obsidian-88: rgba(14, 12, 10, 0.88);
  --et-obsidian-78: rgba(14, 12, 10, 0.78);
  --et-obsidian-card: rgba(16, 13, 11, 0.88);
  --et-obsidian-well: rgba(8, 7, 6, 0.75);

  --et-glass-border: rgba(243, 226, 176, 0.28);
  --et-glass-border-strong: rgba(243, 226, 176, 0.48);
  --et-glass-border-focus: rgba(243, 226, 176, 0.75);
}
```

### Tipografia
```css
:root {
  --et-font-cinematic: "Signika", "Modesto Condensed", "Palatino", "Georgia", serif;
  --et-font-body: "Signika", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --et-font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
```

### Vidro e Sombras
```css
:root {
  --et-blur-sm: blur(8px);
  --et-blur-md: blur(14px);
  --et-blur-lg: blur(20px);
  --et-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.45);
  --et-shadow-md: 0 6px 24px rgba(0, 0, 0, 0.65), 0 0 16px var(--et-gold-glow-subtle);
  --et-shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.85), 0 0 28px var(--et-gold-glow-subtle);
}
```

---

## 3. Componentes de Interface

### 3.1 Menu & HUD
- **Barra Superior de Cenas (`#navigation`)**: Cápsulas translúcidas com borda de vidro e destaque em ouro na cena ativa.
- **Barra de Ferramentas Esquerda (`#controls`)**: Coluna vertical em vidro obsidiana, ícones com halo dourado ao passar o cursor e estado ativo luminoso.
- **Hotbar Inferior (`#hotbar`)**: Bandeja em vidro fosco com 10 slots delimitados por bordas finas douradas e indicadores numéricos rúnicos.
- **Cápsula de Jogadores (`#players`)**: Painel inferior translúcido com pips de status verde/dourado e destaque para o usuário local e o Mestre.
- **Barra Lateral Direita (`#sidebar`)**: Abas de navegação (Chat, Combate, Cenas, Atores, Itens, Diários, Tabelas, Cartões, Áudio, Compêndios, Configurações) unificadas sob o tema Celestial.

### 3.2 Chat & Cartões de Rolagem
- **Mensagens do Chat (`.chat-message`)**:
  - Cartões em vidro obsidiana com cabeçalho refinado, nome do emissor em ouro cinemático e avatar com borda dourada.
  - Links de itens e rolagens inline com estilo de gema em ouro translúcido.
- **Sussurros Arcanos (`.chat-message.whisper`)**:
  - Cartão tingido em azul celeste profundo com o selo rúnico `ᛟ Comunicação Sigilosa`.
- **Rolagens de Dados (`.dice-roll`)**:
  - Caixa de fórmula minimalista e valor total (`.dice-total`) em fonte de alto impacto com halo luminoso.
  - **Sucesso Crítico (`.dice-total.critical` / `.et-chat-critical`)**: Borda dourada pulsante com badge runa `✦ SUCESSO CRÍTICO ✦` e fanfarra triunfante.
  - **Falha Crítica (`.dice-total.fumble` / `.et-chat-fumble`)**: Borda carmesim com badge `✧ FALHA CRÍTICA ✧` e stinger dramático.
- **Cartões de Magia e Itens (D&D 5e e Midi-QoL)**:
  - Cabeçalho com ícone emoldurado, título em capitais e botões de ação ("Ataque", "Dano", "Salvataguarda") no padrão dourado do design system.

### 3.3 Janelas, Popups e Modais
- **Janelas do Foundry (`.window-app`, `.dialog`, ApplicationV2)**:
  - Estrutura de vidro obsidiana com 16px de desfoque e sombra profunda.
  - Cabeçalho de bronze queimado com tipografia em capitais espaçadas (`letter-spacing: 0.12em`).
  - Botão de fechar (`.close`) com rotação sutil e brilho carmesim ao passar o cursor.
  - Botão de confirmação/ação principal estilizado como ouro primário (`.dialog-button.default`).
- **Menu de Contexto (`#context-menu`)**:
  - Dropdown fosco com deslocamento e iluminação dourada no hover de cada item.
- **Tooltips (`#tooltip`)**:
  - Cápsulas translúcidas com microborda dourada e sombra suave.

### 3.4 Formulários e Controles
- **Campos de Texto e Senha (`input[type="text"]`, `input[type="password"]`, etc.)**:
  - Fundo fosco com poço de sombra interna e foco brilhante em ouro (`box-shadow: 0 0 14px var(--et-gold-glow)`).
- **Caixas de Seleção (`select`)**:
  - Estilização escura moderna com seta dourada personalizada em SVG.
- **Áreas de Texto (`textarea`)**:
  - Painéis foscos com rolagem celestial dourada.
- **Barras de Deslize (`input[type="range"]`)**:
  - Trilho fino translúcido com botão circular dourado que expande no hover.
- **Interruptor Deslizante (`.et-switch`)**:
  - Toggle switch deslizante com brilho esmeralda suave ao ser ativado.

### 3.5 Botões
- **Primário Dourado (`.et-btn-primary`, `button.default`, `.dialog-button.yes`)**:
  - Gradiente em folha de ouro (`linear-gradient(135deg, #f7e8be, #d9b865, #b8933b)`), texto escuro em negrito, halo dourado intenso e animação de feixe de luz (*shimmer*).
- **Secundário Obsidiana (`.et-btn-secondary`, `.dialog-button.no`)**:
  - Vidro translúcido escuro com borda dourada e texto em marfim.
- **Perigo Carmesim (`.et-btn-danger`)**:
  - Vidro vermelho profundo com borda carmesim e brilho de alerta.
- **Arcano Celeste (`.et-btn-azure`)**:
  - Vidro azul marinho translúcido com halo ciano para ações mágicas.
- **Vitalidade Esmeralda (`.et-btn-emerald`)**:
  - Vidro esmeralda para cura e restauração.
- **Botões de Ícone (`.et-btn-icon`)**:
  - Formato squircle ou circular com expansão de 8% no hover.

### 3.6 Tipografia & Textos Livres
- **Iniciais Capitulares Iluminadas (`.et-dropcap`)**:
  - Letra inicial grandiosa estilizada em `Georgia` para introduções de diários e capítulos de lore.
- **Citações Tipográficas (`.et-quote`)**:
  - Bloco com borda esquerda dourada, fundo fosco e aspas clássicas serifadas (`.et-quote-mark`).
- **Divisores de Lâmina (`.et-divider`, `.et-divider-runic`)**:
  - Linha afilada de 1px com degradê para transparência nas pontas e glifo rúnico central (`✦`, `ᛟ`, `✧`).
- **Segredos e Spoilers (`.et-secret`)**:
  - Texto desfocado com instrução para revelar ao passar o cursor ou tocar.

### 3.7 Banners Cinemáticos (Edge-to-Edge Ribbon)
- Anúncios grandiosos de tela cheia que respeitam a regra de design de `AGENTS.md`:
  - **Largura total de 100vw** com bordas apenas superior e inferior (sem laterais, sem cantos arredondados flutuantes).
  - Vinheta perimétrica escura radial (o centro do mapa permanece visível).
  - Tipografia de linha única sem quebra de texto (`white-space: nowrap;`).
  - Efeito sonoro stinger sincronizado.
  - Tipos: `encounter` (carmesim/ouro), `victory` (esmeralda/ouro), `celestial` (marfim/ouro), `arcane` (azul/ouro), `curse` (ametista/sombra).

### 3.8 Efeitos Visuais & Atmosfera
- **Partículas Douradas Ambientais (`#et-global-particles`)**:
  - Partículas douradas lentas flutuando na tela, configuráveis nas opções do módulo para computadores mais modestos.
- **Raios Celestiais (`.et-god-rays`)**:
  - Iluminação suave pulsante no fundo da tela.
- **Vinhetas Perimétricas (`.et-vignette`)**:
  - Escurecimento gradual das bordas para focar a atenção na ação.

---

## 4. Sistema Sonoro de Interface (UI SFX)

O design system inclui um despachante de áudio (`DesignSystemSound`) integrado com atalhos de som:

| Evento | Áudio Padrão | Fallback |
|---|---|---|
| **Clique de Botão** | `endless-tower/audios/ui/ragnarok-login.mp3` | `sounds/lock.wav` |
| **Abertura de Janela** | `endless-tower/audios/skills/begin_cast.wav` | `sounds/doors/magic/wall-open.ogg` |
| **Fechamento de Janela**| `endless-tower/audios/skills/hide_sound.wav` | `sounds/doors/sliding/close-wood.ogg` |
| **Troca de Aba** | `sounds/lock.wav` | `endless-tower/audios/ui/ragnarok-login.mp3` |
| **Rolagem de Dado** | `sounds/dice.wav` | — |
| **Sucesso Crítico** | `endless-tower/audios/critical-sounds/pharmacy_success.wav` | `stage-win.wav` |
| **Falha Crítica** | `endless-tower/audios/critical-sounds/pharmacy_fail.wav` | `eh_eh_eeeeeh.wav` |
| **Banner de Encontro** | `sounds/combat/epic-start-horn.ogg` | — |
| **Banner de Vitória** | `endless-tower/audios/critical-sounds/stage-win.wav` | — |
| **Banner Celestial** | `endless-tower/audios/skills/sanctuary-sound.wav` | `Aspersio.wav` |

### Configurações de Áudio
Acesse `Configurações do Jogo -> Configurações de Módulos -> Endless Tower`:
- **Sons de Interface (Design System)**: Ativa/desativa todos os sons de UI (padrão: `true`).
- **Volume dos Sons de Interface**: Slider de 0% a 100% (padrão: `35%`).
- **Sons em Rolagens de Dados e Críticos**: Ativa fanfarras de dados no chat (padrão: `true`).

---

## 5. API Pública para Macros e Desenvolvedores

O módulo expõe a API pública do Design System em `game.modules.get('endless-tower').api`:

```javascript
const api = game.modules.get('endless-tower').api;
```

### 5.1 Disparar um Banner Cinemático
```javascript
// Exibe um banner de chefe ou desafio para todos os jogadores
game.modules.get('endless-tower').api.ui.showBanner({
  title: "VALQUÍRIA RANDGRIS",
  subtitle: "A Guardiã do 100º Andar desperta de seu sono milenar",
  type: "encounter",       // "encounter" | "victory" | "celestial" | "arcane" | "curse"
  duration: 4500,          // milissegundos
  broadcast: true          // se Mestre, replica na tela de todos os jogadores
});
```

### 5.2 Banner de Vitória de Combate
```javascript
game.modules.get('endless-tower').api.ui.showBanner({
  title: "VITÓRIA GLORIOSA",
  subtitle: "O desafio foi superado. Os portões do próximo andar se abriram.",
  type: "victory",
  duration: 4000,
  broadcast: true
});
```

### 5.3 Tocar um Efeito Sonoro da Interface
```javascript
// Toca um dos sons pré-configurados da biblioteca
game.modules.get('endless-tower').api.ui.playSound("click");
game.modules.get('endless-tower').api.ui.playSound("criticalSuccess");
game.modules.get('endless-tower').api.ui.playSound("bannerCelestial");
```

### 5.4 Alternar Partículas Douradas Ambientais
```javascript
// Liga ou desliga as partículas douradas na tela
game.modules.get('endless-tower').api.ui.startParticles();
game.modules.get('endless-tower').api.ui.stopParticles();
```

### 5.5 Diálogo Customizado Estilizado (Macro)
```javascript
new Dialog({
  title: "Bênção da Torre",
  content: `
    <div class="et-card et-blessing-card">
      <div class="et-card-header">
        <div class="et-card-header-left">
          <div class="et-card-icon"><i class="fas fa-sun"></i></div>
          <div>
            <h3 class="et-card-title">Centelha de Valquíria</h3>
            <p class="et-card-subtitle">Bênção Nível IV — Celestial</p>
          </div>
        </div>
      </div>
      <div class="et-card-body">
        <p class="et-dropcap">Uma luz incandescente envolve seus passos. Você recupera todos os pontos de vida e ganha vantagem no próximo teste de salvaguarda.</p>
      </div>
      <div class="et-divider"></div>
      <div class="et-card-footer">
        <span class="et-badge et-badge-gold">✦ Lendário</span>
        <span>Duração: 1 Hora</span>
      </div>
    </div>
  `,
  buttons: {
    aceitar: {
      label: "Receber Bênção",
      callback: () => ui.notifications.info("Bênção recebida!")
    },
    recusar: {
      label: "Recusar",
      callback: () => console.log("Recusado")
    }
  },
  default: "aceitar"
}).render(true);
```

---

## 6. Estrutura dos Arquivos no Repositório

```
styles/
├── design-system.css               # Bundle mestre do Design System
└── design-system/
    ├── tokens.css                  # Variáveis de cor, tipografia, sombras e z-index
    ├── typography.css              # Cabeçalhos, drop caps, citações e divisores
    ├── buttons.css                 # Botões primários dourados, vidro e ações
    ├── forms.css                   # Inputs, selects, textareas, sliders e switches
    ├── windows.css                 # Janelas Foundry, ApplicationV2, context menu, tooltips
    ├── chat.css                    # Redesign do chat, crits/fumbles e cartões D&D 5e
    ├── hud.css                     # Top nav, controls, hotbar, players e sidebar
    ├── banners.css                 # Faixas cinemáticas Souls-like edge-to-edge
    ├── cards.css                   # Cartões reutilizáveis, itens e magias
    └── effects.css                 # Partículas, god-rays e vinhetas

src/features/design-system/
├── agentic-tokens.ts               # Catálogo W3C DTCG, contratos e auditoria WCAG 2.1 (P-011)
├── celestial-sheets.ts             # Fichas opt-in Endless Tower Sheet (Player e NPC)
├── design-system.ts                # Orquestrador mestre, API e injeção dinâmica
├── sound-effects.ts                # Sistema de áudio UI e hooks de rolagem/banners
├── banner-service.ts               # Serviço de banners cinemáticos e sincronização socket
└── chat-enhancer.ts                # Enriquecimento visual de rolagens críticas e sussurros
```

---

## 7. Agentic Design System Contracts (`P-011`)

O **Celestial Chronicle Design System** expõe seus tokens e regras arquiteturais de forma determinística e auditável por agentes e testes automatizados em [agentic-tokens.ts](file:///d:/FoundryVTT/Data/modules/endless-tower/src/features/design-system/agentic-tokens.ts):

- **Consulta em Runtime**:
  - `game.modules.get('endless-tower').api.designSystem.getTokens()` — retorna o catálogo W3C DTCG sincronizado 1:1 com `tokens.css` e `sheets.css`.
  - `game.modules.get('endless-tower').api.designSystem.getContracts()` — retorna o mapa "1 componente por função" (`chat-feature-card`, `cinematic-banner`, `modal-window`, `actor-sheet-theme`, `context-menu`).
  - `game.modules.get('endless-tower').api.designSystem.auditTokens()` — calcula matematicamente as razões de contraste W3C WCAG 2.1 (SC 1.4.3 / 1.4.6 / 1.4.11), teto anti-halaçao (`<= 15:1`) e opacidade máxima das bordas estruturais (`<= 0.16`).
