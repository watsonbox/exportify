import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

const localeFiles = import.meta.glob<Record<string, unknown>>("./locales/*/translation.json", { eager: true, import: "default" })
const resources = Object.fromEntries(
  Object.entries(localeFiles).map(([path, translations]) => [path.split("/")[2], { translations }])
)

const supportedLanguages = ['de', 'en', 'el', 'es', 'fr', 'it', 'nl', 'pt', 'sv', 'ar', 'ja', 'tr', 'zh-Hans', 'zh-Hant', 'yue-Hant-HK'] as const

const normalizeDetectedLanguage = (language: string): string => {
  switch (language.toLowerCase()) {
    case 'zh-cn':
    case 'zh-sg':
    case 'zh-hans':
      return 'zh-Hans'
    case 'zh-tw':
    case 'zh-mo':
    case 'zh-hant':
      return 'zh-Hant'
    case 'zh-hk':
    case 'yue':
    case 'yue-hk':
    case 'yue-hant-hk':
      return 'yue-Hant-HK'
    case 'zh':
      return 'en'
    default:
      return language
  }
}

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
      convertDetectedLanguage: normalizeDetectedLanguage,
    },
    interpolation: {
      escapeValue: false,
    },
    resources,
    ns: ['translations'],
    defaultNS: 'translations'
  })

export default i18n
