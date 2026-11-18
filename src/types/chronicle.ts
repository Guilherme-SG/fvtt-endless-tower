/**
 * Interfaces and types for the Celestial Chronicle system (Pause & Scene Transitions).
 */

export interface Quote {
  text: string;
  author: string;
}

export type ChronicleState = "IDLE" | "PAUSED" | "TRANSITIONING" | "TRANSITIONING_PAUSED";
