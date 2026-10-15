export type TranslateLanguage = {
  code: string;
  label: string;
};

export const TRANSLATE_LANGUAGES: TranslateLanguage[] = [
  { code: "en", label: "English" },
  { code: "it", label: "Italian" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "ro", label: "Romanian" },
  { code: "ar", label: "Arabic" },
  { code: "fa", label: "Persian" },
  { code: "tr", label: "Turkish" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "hi", label: "Hindi" },
];

export function getLanguageLabel(code: string): string {
  return TRANSLATE_LANGUAGES.find((language) => language.code === code)?.label ?? code;
}
