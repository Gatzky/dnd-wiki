/**
 * Polish grammatical number.
 *
 * Polish splits counted nouns three ways, and the split is not the English
 * singular/plural one:
 *
 *   - `one`    n === 1                                    1 minuta
 *   - `few`    n % 10 in 2..4, except n % 100 in 12..14    2, 23, 104 minuty
 *   - `many`   everything else                             5, 12, 25 minut
 *
 * The `n % 100` guard is the part that is usually missed: 12, 13 and 14 end in
 * 2, 3 and 4 but take the `many` form, and so do 112, 213 and so on.
 */

export interface PolishPluralForms {
  /** n === 1 — e.g. "minuta", "słowo" */
  one: string
  /** n % 10 is 2-4 and n % 100 is not 12-14 — e.g. "minuty", "słowa" */
  few: string
  /** everything else, including 0 — e.g. "minut", "słów" */
  many: string
}

export type PolishPluralCategory = keyof PolishPluralForms

/**
 * Pick the Polish plural category for a count.
 *
 * Non-integer counts fall back to `many`, which matches how Polish treats
 * decimal quantities ("2,5 minuty" is the genitive-plural pattern).
 */
export function polishPluralCategory(n: number): PolishPluralCategory {
  if (!Number.isInteger(n)) return "many"

  const abs = Math.abs(n)
  if (abs === 1) return "one"

  const lastDigit = abs % 10
  const lastTwoDigits = abs % 100
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
    return "few"
  }

  return "many"
}

/**
 * Select the correct form of a noun for a count, without the number itself.
 *
 *   plPlural(5, MINUTA) === "minut"
 */
export function plPlural(n: number, forms: PolishPluralForms): string {
  return forms[polishPluralCategory(n)]
}

/**
 * Format a count together with the correct noun form.
 *
 *   plCount(1, MINUTA)  === "1 minuta"
 *   plCount(23, MINUTA) === "23 minuty"
 *   plCount(12, MINUTA) === "12 minut"
 */
export function plCount(n: number, forms: PolishPluralForms): string {
  return `${n} ${plPlural(n, forms)}`
}

export const MINUTA: PolishPluralForms = {
  one: "minuta",
  few: "minuty",
  many: "minut",
}

export const SLOWO: PolishPluralForms = {
  one: "słowo",
  few: "słowa",
  many: "słów",
}

export const ZNACZNIK: PolishPluralForms = {
  one: "znacznik",
  few: "znaczniki",
  many: "znaczników",
}

export const ELEMENT: PolishPluralForms = {
  one: "element",
  few: "elementy",
  many: "elementów",
}

export const NOTATKA: PolishPluralForms = {
  one: "notatka",
  few: "notatki",
  many: "notatek",
}
