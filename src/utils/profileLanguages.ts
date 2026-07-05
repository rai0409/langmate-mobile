import { languageLabel } from "../constants/options";
import type { LanguageCode, Profile } from "../types/domain";

function uniqueLanguages(values: (LanguageCode | undefined | null)[]): LanguageCode[] {
  return values.filter(
    (value, index, array): value is LanguageCode =>
      Boolean(value) && array.indexOf(value) === index
  );
}

export function nativeLanguagesForProfile(profile: Profile): LanguageCode[] {
  return uniqueLanguages([...(profile.nativeLangs ?? []), profile.nativeLang]);
}

export function targetLanguagesForProfile(profile: Profile): LanguageCode[] {
  return uniqueLanguages([...(profile.targetLangs ?? []), profile.targetLang]);
}

export function formatLanguageList(languages: LanguageCode[]): string {
  return languages.map(languageLabel).join(", ");
}

export function languageListsIntersect(
  left: LanguageCode[],
  right: LanguageCode[]
): boolean {
  const rightSet = new Set(right);
  return left.some((language) => rightSet.has(language));
}
