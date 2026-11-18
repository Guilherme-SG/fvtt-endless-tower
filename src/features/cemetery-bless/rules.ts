import { CEMETERY_SCENE_TAG, UNDEAD_KEYWORDS } from "./config";

/**
 * Checks whether an actor's type or race corresponds to an undead creature
 * (supports both English and Portuguese D&D 5e terms).
 */
export function isUndeadCreature(typeValue?: string | null, raceValue?: string | null): boolean {
  const normType = (typeValue || "").toLowerCase().trim();
  const normRace = (raceValue || "").toLowerCase().trim();

  return UNDEAD_KEYWORDS.some(
    (keyword) => normType.includes(keyword) || normRace.includes(keyword)
  );
}

/**
 * Checks whether a scene name includes the cemetery blessing tag.
 */
export function hasCemeterySceneTag(
  sceneName?: string | null,
  sceneTag: string = CEMETERY_SCENE_TAG
): boolean {
  return Boolean(sceneName && sceneName.includes(sceneTag));
}
