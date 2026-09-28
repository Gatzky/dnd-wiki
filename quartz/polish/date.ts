/**
 * Polish date rendering.
 *
 * The house format is `27 lipca 2026 r.` — day, genitive month name, year, then
 * the `r.` abbreviation (short for `roku`, "of the year"). Every date on this
 * site is a real-world publication or amendment date.
 *
 * `Intl` already produces the genitive month for `pl-PL` when `month: "long"`
 * is combined with a numeric day, so there is no month-name table here; only
 * the ` r.` suffix is appended.
 */

const PL_LOCALE = "pl-PL"

const PL_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
}

/** `27 lipca 2026 r.` */
export function formatPolishDate(d: Date): string {
  return `${d.toLocaleDateString(PL_LOCALE, PL_DATE_FORMAT)} r.`
}

/**
 * `27 lipca 2026` — the same date without the ` r.` suffix, for the few places
 * where the abbreviation reads as clutter (for example inside a sentence that
 * already names the year).
 */
export function formatPolishDateBare(d: Date): string {
  return d.toLocaleDateString(PL_LOCALE, PL_DATE_FORMAT)
}
