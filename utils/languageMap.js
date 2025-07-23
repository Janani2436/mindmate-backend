/**
 * Bidirectional language map for name/code lookups
 */

export const languageMap = {
  English: 'en',
  Tamil: 'ta',
  Hindi: 'hi',
  Spanish: 'es',
  French: 'fr',
  German: 'de',
  Arabic: 'ar',
  Chinese: 'zh',
  Japanese: 'ja',
  Telugu: 'te',
  // Add new languages here...
};

/**
 * Reverse map for fast lookups from ISO code to display name
 */
export const codeToLanguageMap = Object.entries(languageMap).reduce(
  (acc, [name, code]) => {
    acc[code] = name;
    return acc;
  },
  {}
);

/**
 * Get ISO 639-1 language code from human-readable name
 * @param {string} languageName - e.g. "Spanish"
 * @returns {string} code - e.g. "es"
 */
export const getLanguageCode = (languageName = '') =>
  languageMap[languageName.trim()] || 'en';

/**
 * Get human-readable language name from code
 * @param {string} languageCode - e.g. "es"
 * @returns {string} name - e.g. "Spanish"
 */
export const getLanguageName = (languageCode = 'en') =>
  codeToLanguageMap[languageCode.trim()] || 'English';
