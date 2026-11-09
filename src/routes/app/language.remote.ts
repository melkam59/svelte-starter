import { asCommand } from '#lib/server/remote-functions.ts';
import { saveMyLanguage } from '#lib/server/modules/members/index.ts';

/** Saves the signed-in member's language, so their next sign-in on any device uses it. */
export const saveLanguage = asCommand(saveMyLanguage);
