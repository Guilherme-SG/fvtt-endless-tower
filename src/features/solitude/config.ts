export const ISOLATION_EFFECT_NAME = "Foco Solitário";
export const LEGACY_EFFECT_NAME = "Protocolo de Isolamento";
export const ISOLATION_ICON = "icons/environment/wilderness/arch-stone.webp";
export const ISOLATION_DISTANCE_FEET = 10;
export const DISTANCE_EPSILON_FEET = 0.1;
export const DEFAULT_GRID_SIZE = 100;
export const DEFAULT_FEET_PER_GRID = 5;
export const INCAPACITATED_STATUSES = ["dead", "unconscious"] as const;

export const SOLITUDE_EFFECT_CHANGES = [
  {
    key: "system.attributes.concentration.bonuses.save",
    mode: 2,
    value: "1",
    priority: 20,
  },
  {
    key: "system.bonuses.rwak.attack",
    mode: 2,
    value: "1",
    priority: 20,
  },
  {
    key: "system.bonuses.rsak.attack",
    mode: 2,
    value: "1",
    priority: 20,
  },
  {
    key: "system.abilities.dex.bonuses.save",
    mode: 2,
    value: "1",
    priority: 20,
  },
  {
    key: "system.skills.prc.bonuses.passive",
    mode: 2,
    value: "2",
    priority: 20,
  },
] as const;

export const UI_TEXT = {
  effectName: ISOLATION_EFFECT_NAME,
  legacyEffectName: LEGACY_EFFECT_NAME,
  effectDescription: `
      <p><strong>Foco Solitário (Bênção Solitude)</strong></p>
      <p>Concedido enquanto não houver nenhum aliado consciente a até 10 ft de você:</p>
      <ul>
        <li>+1 em salvaguardas de Constituição para manter a concentração em magias.</li>
        <li>+1 em jogadas de ataque à distância e salvaguardas de Destreza.</li>
        <li>+2 em Sabedoria passiva (Percepção).</li>
      </ul>
    `,
} as const;
