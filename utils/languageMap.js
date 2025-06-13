export const languageMap = {
    English: 'en',
    Tamil: 'ta',
    Hindi: 'hi',
    Spanish: 'es',
    // Add more languages as needed
  };
  
  export const getLanguageCode = (languageName) => languageMap[languageName] || 'en';
  