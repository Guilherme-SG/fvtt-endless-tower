export const DEFAULT_SPLASH_FOLDER = "modules/endless-tower/assets/screen-transition";
export const DEFAULT_LANDSCAPE_SRC = "endless-tower/landscape/endless-tower-login-screen.webp";
export const DEFAULT_MIN_DURATION_SEC = 3;
export const DEFAULT_CYCLE_INTERVAL_SEC = 45;
export const MIN_CYCLE_INTERVAL_SEC = 15;
export const DEFAULT_GIFT_CHANCE_PERCENT = 0.5;
export const GATE_REVEAL_DURATION_MS = 850;
export const QUOTE_FADE_DURATION_MS = 350;
export const TRANSITION_PARTICLE_COUNT = 40;

export const UI_TEXT = {
  settingEnableTransitionsName: "Ativar Transições de Cena Cinemáticas",
  settingEnableTransitionsHint:
    "Exibe a tela com arte splash, partículas celestiais e citações ao trocar de cena.",
  settingEnablePauseName: "Ativar Modo de Pausa Celestial (Lower-Third)",
  settingEnablePauseHint:
    "Substitui o ícone padrão de pausa pelo banner inferior translúcido com runa e citação.",
  settingMinDurationName: "Duração Mínima da Transição (Segundos)",
  settingMinDurationHint:
    "Tempo mínimo que a tela de carregamento permanece visível para permitir leitura (clique na tela para avançar imediatamente).",
  settingCycleIntervalName: "Intervalo de Rotação de Citações na Pausa (Segundos)",
  settingCycleIntervalHint: "Tempo entre trocas automáticas de frases durante pausas longas.",
  settingRollTableName: "RollTable Personalizada de Citações",
  settingRollTableHint:
    "Selecione uma RollTable do mundo para usar suas entradas como citações do baralho.",
  settingRollTableNoneChoice: "— Nenhuma (Usar quotes.json padrão) —",
  settingSplashFolderName: "Pasta de Imagens de Splash (Opcional)",
  settingSplashFolderHint:
    "Caminho da pasta com ilustrações para transição (ex: 'modules/endless-tower/assets/screen-transition').",
  settingGiftEnabledName: "Presente do Mestre: Ativar Mensagem Secreta Rara",
  settingGiftEnabledHint:
    "Ativa o sorteio de uma mensagem secreta com recompensa para o primeiro jogador que encontrá-la.",
  settingGiftChanceName: "Presente do Mestre: Probabilidade de Aparição (%)",
  settingGiftChanceHint:
    "Porcentagem de chance de exibir a mensagem secreta a cada transição ou rotação (ex: 0.5% = 1 em 200).",
  settingGiftMessageName: "Presente do Mestre: Texto da Mensagem Secreta",
  settingGiftMessageHint:
    "Mensagem ou código secreto que o jogador deve enviar ao Mestre. Altere o texto após a recompensa ser resgatada.",
  settingGiftMessageDefault:
    "Parabéns, esta é uma mensagem super rara! Envie secretamente ao mestre a mensagem a seguir (uso único) e ganhe um presente misterioso: Na minha ilha não entram crianças!",
  settingGiftAuthorName: "Presente do Mestre: Assinatura da Mensagem",
  settingGiftAuthorHint: "Título ou autor exibido na autoria da mensagem secreta.",
  settingGiftAuthorDefault: "Presente do Mestre",
  unknownAuthor: "Desconhecido",
  fallbackQuoteText: "Desconfio que o lago é o anjo.",
  fallbackQuoteAuthor: "Jogadores do Lago / 4 Asas",
  pauseTooltip: "Jogo Pausado",
  transitionAlt: "Transição Celestial",
  transitionHint: "Clique para continuar",
  sceneConfigLabel: "Endless Tower: Imagem de Transição (Splash Art)",
  sceneConfigBrowseTitle: "Procurar Arquivo",
  sceneConfigPlaceholder: "Ex: endless-tower/landscape/minha-cena.webp",
  sceneConfigNotes:
    "Imagem exibida durante a tela de transição celestial ao entrar nesta cena. Se vazia, usa a arte padrão da Torre.",
} as const;
