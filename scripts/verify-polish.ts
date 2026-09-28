/**
 * Checks the Polish localisation rules that are easy to break silently.
 *
 * Run with `npm run verify-polish`. It exercises the patched slugifier, the
 * plural helper and the date format. The remaining acceptance checks (search,
 * contrast, 375px layout, draft exclusion) need a browser or the built output
 * and are documented in README.md.
 */

import { slugifyFilePath, slugTag, transformInternalLink } from "@quartz-community/utils"
import type { FilePath } from "@quartz-community/utils"

import { formatPolishDate } from "../quartz/polish/date"
import { plCount, MINUTA, SLOWO } from "../quartz/polish/plural"

let failures = 0

function check(label: string, got: string, expected: string) {
  const pass = got === expected
  if (!pass) failures++
  const status = pass ? "  ok  " : " FAIL "
  console.log(`[${status}] ${label}\n           got      ${got}\n           expected ${expected}`)
}

console.log("\n=== Slugs: Polish diacritics must fold to ASCII ===\n")

const slugCases: [string, string][] = [
  // The acceptance-check case. `ł` is the one that a naive NFD-based slugifier
  // leaves behind, and the em dash must not survive as a literal character.
  ["zasady/Pobór wojska — żółć.md", "zasady/pobor-wojska-zolc"],
  ["zasady/Pobór wojska.md", "zasady/pobor-wojska"],
  ["zasady/Żołnierz i łuk.md", "zasady/zolnierz-i-luk"],
  ["zasady/Ława przysięgłych.md", "zasady/lawa-przysieglych"],
  ["zasady/Ćwiczenia i źródła.md", "zasady/cwiczenia-i-zrodla"],
  ["słownik.md", "slownik"],
  ["dziennik-zmian.md", "dziennik-zmian"],
]

for (const [input, expected] of slugCases) {
  check(input, slugifyFilePath(input as FilePath), expected)
}

console.log("\n=== Tag slugs ===\n")
for (const [input, expected] of [
  ["żywność", "zywnosc"],
  ["Wojna i pokój", "wojna-i-pokoj"],
] as [string, string][]) {
  check(input, slugTag(input), expected)
}

console.log("\n=== Wikilink resolution ===\n")
for (const [input, expected] of [
  ["Pobór wojska", "./pobor-wojska"],
  ["zasady/Żołd", "./zasady/zold"],
] as [string, string][]) {
  check(input, transformInternalLink(input), expected)
}

console.log("\n=== Plural forms: minuta / minuty / minut ===\n")
for (const [n, expected] of [
  [1, "1 minuta"],
  [2, "2 minuty"],
  [5, "5 minut"],
  [12, "12 minut"],
  [22, "22 minuty"],
  [25, "25 minut"],
  [23, "23 minuty"],
  [13, "13 minut"],
  [14, "14 minut"],
  [104, "104 minuty"],
  [112, "112 minut"],
  [0, "0 minut"],
] as [number, string][]) {
  check(`${n} min`, plCount(n, MINUTA), expected)
}

console.log("\n=== Plural forms: słowo / słowa / słów ===\n")
for (const [n, expected] of [
  [1, "1 słowo"],
  [3, "3 słowa"],
  [5, "5 słów"],
  [12, "12 słów"],
  [22, "22 słowa"],
  [25, "25 słów"],
] as [number, string][]) {
  check(`${n} sł.`, plCount(n, SLOWO), expected)
}

console.log("\n=== Date format ===\n")
check(
  "2026-07-27",
  formatPolishDate(new Date(Date.UTC(2026, 6, 27, 12))),
  "27 lipca 2026 r.",
)
check("2026-01-01", formatPolishDate(new Date(Date.UTC(2026, 0, 1, 12))), "1 stycznia 2026 r.")
check("2026-03-15", formatPolishDate(new Date(Date.UTC(2026, 2, 15, 12))), "15 marca 2026 r.")

console.log(
  failures === 0
    ? "\nAll Polish localisation checks passed.\n"
    : `\n${failures} check(s) FAILED.\n`,
)

process.exit(failures === 0 ? 0 : 1)
