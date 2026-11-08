/**
 * Interfaces e tipos para o sistema Celestial Chronicle (Pause & Scene Transitions).
 */

export interface Quote {
  text: string;
  author: string;
}

export type ChronicleState = "IDLE" | "PAUSED" | "TRANSITIONING" | "TRANSITIONING_PAUSED";

export interface ChronicleSettings {
  enableTransitions: boolean;
  enableCustomPause: boolean;
  minTransitionDuration: number; // segundos
  quoteCycleInterval: number; // segundos durante pause
  customRollTableId: string; // ID da RollTable personalizada (opcional)
  customSplashFolder: string; // Caminho da pasta de imagens (opcional)
}
