import { MODULE_ID, MODULE_TITLE } from "./constants";
import {
  registerAbracadoPeloDestino,
  AbracadoDestinoManager,
} from "./features/abracado-pelo-destino";
import { registerBlessRemember } from "./features/bless-remember";
import { registerCemeteryBless } from "./features/cemetery-bless";
import { registerPlaySoundsHooks } from "./features/play-sounds";
import { registerPrepareSpellsReminder } from "./features/prepare-spells-reminder";
import { registerRagnarokAnimations } from "./features/ragnarok-animations";
import { runSensorialDeturpation } from "./features/sensorial-deturpation";
import {
  registerJumpFeature,
  executeJump,
  syncJumpOnAllActors,
  ensureJumpItemOnActor,
} from "./features/jump";
import {
  registerLandingSceneFeature,
  createLandingScene,
  toggleLandingEffects,
} from "./features/landing-scene";
import {
  registerCelestialChronicleFeature,
  CelestialChronicle,
} from "./features/celestial-chronicle";
import {
  registerCriticalEncounter,
  CriticalEncounterManager,
} from "./features/critical-encounter";
import {
  registerSolitudeFeature,
  checkSolitude,
  ensureIsolationEffect,
} from "./features/solitude";

Hooks.once("init", () => {
  console.log(`${MODULE_TITLE} | Inicializando modulo TypeScript`);

  // Registra features e hooks durante o 'init' para garantir que estejam ativos antes das fichas abrirem
  registerJumpFeature();
  registerAbracadoPeloDestino();
  registerBlessRemember();
  registerCemeteryBless();
  registerPlaySoundsHooks();
  registerPrepareSpellsReminder();
  registerRagnarokAnimations();
  registerLandingSceneFeature();
  registerCelestialChronicleFeature();
  registerCriticalEncounter();
  registerSolitudeFeature();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_TITLE} | Pronto`);

  // Expor API para macros, scripts externos e console
  const moduleData = (game.modules as any)?.get(MODULE_ID);
  if (moduleData) {
    moduleData.api = {
      runSensorialDeturpation,
      jump: executeJump,
      syncJump: syncJumpOnAllActors,
      ensureJump: ensureJumpItemOnActor,
      createLandingScene,
      toggleLandingEffects,
      chronicle: CelestialChronicle.getInstance(),
      criticalEncounter: CriticalEncounterManager.getInstance(),
      abracadoDestino: AbracadoDestinoManager.getInstance(),
      checkSolitude,
      ensureIsolationEffect,
    };
  }
});
