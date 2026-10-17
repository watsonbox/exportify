import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

const localeFiles = import.meta.glob<Record<string, unknown>>("./locales/*/translation.json", { eager: true, import: "default" })
const resources = Object.fromEntries(
  Object.entries(localeFiles).map(([path, translations]) => [path.split("/")[2], { translations }])
)

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    resources,
    ns: ['translations'],
    defaultNS: 'translations'
  })

export default i18n
