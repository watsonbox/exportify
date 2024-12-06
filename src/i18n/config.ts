import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    resources: {
      de: {
        translations: require('./locales/de/translation.json')
      },
      en: {
        translations: require('./locales/en/translation.json')
      },
      es: {
        translations: require('./locales/es/translation.json')
      },
      fr: {
        translations: require('./locales/fr/translation.json')
      },
      it: {
        translations: require('./locales/it/translation.json')
      },
      nl: {
        translations: require('./locales/nl/translation.json')
      },
      pt: {
        translations: require('./locales/pt/translation.json')
      },
      sv: {
        translations: require('./locales/sv/translation.json')
      },
      ar: {
        translations: require('./locales/ar/translation.json')
      },
      ja: {
        translations: require('./locales/ja/translation.json')
      }
    },
    ns: ['translations'],
    defaultNS: 'translations'
  })

export default i18n
