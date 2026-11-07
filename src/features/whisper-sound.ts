import { MODULE_TITLE } from "../constants";

declare const Sequence: any;

export function registerWhisperSound(): void {
  console.warn(`${MODULE_TITLE} | Satanas Sound Effects`);

  const basePath = "endless-tower/audios/minecraft-ghast-sounds";
  const ghastSounds = {
    die: `${basePath}/ghast-morte.mp3`,
    attackFire: `${basePath}/disparo-Fogo.mp3`,
    attackScream: `${basePath}/disparo-ghast.mp3`,
    pain: [
      `${basePath}/ghast-dor-1.mp3`,
      `${basePath}/ghast-dor-2.mp3`,
      `${basePath}/ghast-dor-3.mp3`,
      `${basePath}/ghast-dor-4.mp3`,
    ],
  };

  function playSound(soundPath: string) {
    if (typeof Sequence !== "undefined") {
      new Sequence().sound().file(soundPath).volume(0.7).play();
    }
  }

  Hooks.on("preUpdateActor", (actor: any, update: any) => {
    if (actor.name !== "Whisper") return;

    if (update.system?.attributes?.hp?.value === 0) {
      playSound(ghastSounds.die);
      return;
    }

    if (update?.flags?.["midi-qol"]?.["concentration-damage"] > 0) {
      const randomPain =
        ghastSounds.pain[Math.floor(Math.random() * ghastSounds.pain.length)];
      playSound(randomPain);
    }
  });
}
