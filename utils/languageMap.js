// MindMate backend - languageMap.js
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
  // additional languages can be added
};

 // fast lookups
export const codeToLanguageMap = Object.entries(languageMap).reduce(
  (acc, [name, code]) => {
    acc[code] = name;
    return acc;
  },
  {}
);

/**
 * language code from name
 * @param {string} languageName language name
 * @returns {string} language code
 */
export const getLanguageCode = (languageName = '') =>
  languageMap[languageName.trim()] || 'en';

/**
 * language name from code
 * @param {string} languageCode language code
 * @returns {string} language name
 */
export const getLanguageName = (languageCode = 'en') =>
  codeToLanguageMap[languageCode.trim()] || 'English';
