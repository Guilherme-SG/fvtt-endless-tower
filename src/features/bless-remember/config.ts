export const OWNERSHIP_OWNER = 3;
export const BLESSING_FOLDER_NAME = "Bençãos Divinas";
export const INITIATIVE_BLESSING_NAME = "Rápido E Devagar";

export const UI_TEXT = {
  initiativeReminder: (actorName: string, blessName: string, description: string): string =>
    `${actorName}, você tem a benção ${blessName}!\n\n${description}`,
  turnReminder: (actorName: string, blessNames: string[]): string =>
    `<b>${actorName}</b>, você tem as bençãos <b>${blessNames.join(", ")}</b>, lembre-se de usar!`,
} as const;
