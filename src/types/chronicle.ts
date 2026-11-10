/**
 * Interfaces e tipos para o sistema Celestial Chronicle (Pause & Scene Transitions).
 */

export interface Quote {
  text: string;
  author: string;
}

export type ChronicleState = "IDLE" | "PAUSED" | "TRANSITIONING" | "TRANSITIONING_PAUSED";
