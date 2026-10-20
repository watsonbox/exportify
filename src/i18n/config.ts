import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

const localeFiles = import.meta.glob<Record<string, unknown>>("./locales/*/translation.json", { eager: true, import: "default" })
const resources = Object.fromEntries(
  Object.entries(localeFiles).map(([path, translations]) => [path.split("/")[2], { translations }])
)

// Browsers report Chinese by region or script, but the translations are by script, with Cantonese for Hong Kong
export const normalizeDetectedLanguage = (language: string): string => {
  const code = language.toLowerCase()

  if (code.startsWith('yue') || (code.startsWith('zh-') && code.endsWith('-hk'))) return 'yue-Hant-HK'
  if (code.startsWith('zh-hant') || code === 'zh-tw' || code === 'zh-mo') return 'zh-Hant'
  if (code === 'zh' || code.startsWith('zh-')) return 'zh-Hans'

  return language
}

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: "en",
    detection: {
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
