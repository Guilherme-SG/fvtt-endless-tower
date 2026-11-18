export const LANDING_SCENE_NAME = "Landing Page";
export const LEGACY_LANDING_SCENE_NAME = "Panteão dos Deuses";
export const LANDING_IMAGE_SRC = "endless-tower/landscape/endless-tower-login-screen.webp";
export const SETTING_LANDING_EFFECTS = "landingEffects";

export const LANDING_CONFIG = {
  defaultWidth: 1672,
  defaultHeight: 941,
  paddingFactor: 0.96,
  minScale: 0.1,
  particleCount: 45,
  particleCanvasId: "et-landing-particles",
  backgroundColor: "#000000",
} as const;

export const UI_TEXT = {
  settingName: "Efeitos Visuais na Landing Page",
  settingHint: "Ativa câmera viva suave e partículas douradas flutuantes na cena Landing Page.",
  sceneCreatedNotification: (sceneName: string): string =>
    `Endless Tower | Cena "${sceneName}" criada com sucesso!`,
} as const;
