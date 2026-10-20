import i18n, { normalizeDetectedLanguage } from "./config"

test.each([
  ["zh", "zh-Hans"],
  ["zh-CN", "zh-Hans"],
  ["zh-SG", "zh-Hans"],
  ["zh-Hans", "zh-Hans"],
  ["zh-Hans-CN", "zh-Hans"],
  ["zh-TW", "zh-Hant"],
  ["zh-MO", "zh-Hant"],
  ["zh-Hant", "zh-Hant"],
  ["zh-Hant-TW", "zh-Hant"],
  ["zh-HK", "yue-Hant-HK"],
  ["zh-Hant-HK", "yue-Hant-HK"],
  ["yue", "yue-Hant-HK"],
  ["yue-Hant-HK", "yue-Hant-HK"],
  ["de-DE", "de-DE"],
  ["en-HK", "en-HK"],
  ["en", "en"],
])("detects %s as %s", (detected, expected) => {
  expect(normalizeDetectedLanguage(detected)).toBe(expected)
})

test("regional codes of other languages still resolve to their translation", async () => {
  await i18n.changeLanguage("de-DE")
  expect(i18n.resolvedLanguage).toBe("de")
  await i18n.changeLanguage("en")
})
