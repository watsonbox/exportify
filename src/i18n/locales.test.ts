import { languages } from "./languages"

type Translations = { [key: string]: string | Translations }

const localeFiles = import.meta.glob<Translations>("./locales/*/translation.json", { eager: true, import: "default" })
const locales = Object.fromEntries(Object.entries(localeFiles).map(([path, translations]) => [path.split("/")[2], translations]))

function flatten(translations: Translations, prefix = ""): Record<string, string> {
  return Object.fromEntries(Object.entries(translations).flatMap(([key, value]) =>
    typeof value === "string" ? [[prefix + key, value]] : Object.entries(flatten(value, `${prefix}${key}.`))
  ))
}

const placeholders = (text: string) => (text.match(/{{\s*\w+\s*}}/g) ?? []).map(placeholder => placeholder.replace(/[{}\s]/g, "")).sort()

// Keys under these prefixes fall back to English until someone translates them
const englishOnly = ["api_error."]
const translatable = (key: string) => !englishOnly.some(prefix => key.startsWith(prefix))

// Languages need different plural forms, so keys are compared without their plural suffix
const pluralBase = (key: string) => key.replace(/_(zero|one|two|few|many|other)$/, "")
const baseKeys = (keys: string[]) => [...new Set(keys.filter(translatable).map(pluralBase))].sort()

const en = flatten(locales.en)
const others = Object.keys(locales).filter(locale => locale !== "en")

test("the language menu lists exactly the locales that have translations", () => {
  expect(Object.keys(languages).sort()).toEqual(Object.keys(locales).sort())
})

test("loads English and at least one other locale", () => {
  expect(Object.keys(en).length).toBeGreaterThan(0)
  expect(others.length).toBeGreaterThan(0)
})

describe.each(others)("%s", locale => {
  const translations = flatten(locales[locale])

  test("has the same keys as en", () => {
    expect(baseKeys(Object.keys(translations))).toEqual(baseKeys(Object.keys(en)))
  })

  test("uses the same placeholders as en", () => {
    const mismatches = Object.keys(en)
      .filter(key => key in translations)
      .filter(key => placeholders(translations[key]).join() !== placeholders(en[key]).join())

    expect(mismatches).toEqual([])
  })
})
