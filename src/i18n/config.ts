import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

const supportedLanguages = ['de', 'en', 'el', 'es', 'fr', 'it', 'nl', 'pt', 'sv', 'ar', 'ja', 'tr', 'zh-Hans', 'zh-Hant', 'yue-Hant-HK'] as const

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: {
      'zh-CN': ['zh-Hans'],
      'zh-SG': ['zh-Hans'],
      'zh-Hans': ['zh-Hans'],
      'zh-TW': ['zh-Hant'],
      'zh-MO': ['zh-Hant'],
      'zh-Hant': ['zh-Hant'],
      'zh-HK': ['yue-Hant-HK'],
      'yue-Hant-HK': ['yue-Hant-HK'],
      default: ['en']
    },
    supportedLngs: supportedLanguages,
    detection: {
      order: ['localStorage', 'sessionStorage', 'cookie', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      lookupSessionStorage: 'i18nextLng',
      lookupCookie: 'i18nextLng',
    },
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
      el: {
        translations: require('./locales/el/translation.json')
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
      },
      tr: {
        translations: require('./locales/tr/translation.json')
      },
      'zh-Hans': {
        translations: require('./locales/zh-Hans/translation.json')
      },
      'zh-Hant': {
        translations: require('./locales/zh-Hant/translation.json')
      },
      'yue-Hant-HK': {
        translations: require('./locales/yue-Hant-HK/translation.json')
      }
    },
    ns: ['translations'],
    defaultNS: 'translations'
  })

export default i18n
