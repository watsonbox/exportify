import { csvRecords, parseCsv } from "./csv"

test("parses quoted fields containing commas, escaped quotes and newlines", () => {
  expect(parseCsv('"a","b, c"\n"say ""hi""","line\nbreak"\n')).toEqual([
    ['a', 'b, c'],
    ['say "hi"', 'line\nbreak'],
  ])
})

test("keys records by the header row", () => {
  expect(csvRecords('"Name","Count"\n"x","1"\n"y","2"\n')).toEqual([
    { Name: 'x', Count: '1' },
    { Name: 'y', Count: '2' },
  ])
})
