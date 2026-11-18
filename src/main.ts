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
  type MidiRollSystem,
} from "./features/critical-encounter";
import {
  registerSolitudeFeature,
  checkSolitude,
  ensureIsolationEffect,
  isIsolated,
  getDistanceInFeet,
} from "./features/solitude";
import {
  registerTemporalSynchronyFeature,
  promptTemporalSynchrony,
  getTemporalSynchronyUses,
} from "./features/temporal-synchrony";
import {
  registerDesignSystem,
  DesignSystem,
  BannerService,
  DesignSystemSound,
} from "./features/design-system";
import {
  registerCombatManeuvers,
  syncManeuversOnAllActors,
  ensureManeuverItemsOnActor,
  toggleManeuverEffects,
  executeManeuverWorkflow,
} from "./features/combat-maneuvers";

Hooks.once("init", () => {
  console.log(`${MODULE_TITLE} | Initializing TypeScript module`);

  // Register features and hooks during 'init' so they are active before sheets open
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
  registerTemporalSynchronyFeature();
  registerDesignSystem();
  registerCombatManeuvers();
});

Hooks.once("ready", () => {
  console.log(`${MODULE_TITLE} | Ready`);

  // Expose public API for macros, external scripts, and console diagnostics
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
      getRollSystem: () => CriticalEncounterManager.getInstance().getRollSystem(),
      setRollSystem: (mode: MidiRollSystem, notify = true) =>
        CriticalEncounterManager.getInstance().setRollSystem(mode, notify),
      toggleRollSystem: () => CriticalEncounterManager.getInstance().toggleRollSystem(),
      abracadoDestino: AbracadoDestinoManager.getInstance(),
      checkSolitude,
      ensureIsolationEffect,
      isIsolated,
      getDistanceInFeet,
      promptTemporalSynchrony,
      getTemporalSynchronyUses,
      designSystem: DesignSystem.getInstance(),
      banner: BannerService.getInstance(),
      sound: DesignSystemSound.getInstance(),
      ui: {
        showBanner: (opts: any) => BannerService.getInstance().show(opts),
        playSound: (type: any, vol?: number) => DesignSystemSound.getInstance().play(type, vol),
        startParticles: () => DesignSystem.getInstance().startGlobalParticles(),
        stopParticles: () => DesignSystem.getInstance().stopGlobalParticles(),
      },
      syncManeuvers: syncManeuversOnAllActors,
      ensureManeuvers: ensureManeuverItemsOnActor,
      toggleManeuverEffects,
      executeManeuver: executeManeuverWorkflow,
    };
  }
});
