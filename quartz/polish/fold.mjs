/**
 * Polish text folding: the single source of truth for turning Polish text into
 * ASCII, used by slug generation and by search normalisation.
 *
 * Plain `.mjs` on purpose. `scripts/patch-polish-slugs.mjs` reads the function
 * bodies out of this file and injects them into an npm package at install time,
 * so this module must stay runnable by bare Node with no build step and no
 * imports.
 *
 * Why an explicit table rather than NFD normalisation: `ł`/`Ł` (U+0142/U+0141)
 * are single code points with no combining-mark decomposition, so
 * `"ł".normalize("NFD")` returns `"ł"` unchanged and a strip-the-marks approach
 * silently leaves it in the slug. NFD is still applied afterwards to catch
 * incidental non-Polish accents.
 */

export const POLISH_TO_ASCII = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
  Ą: "A",
  Ć: "C",
  Ę: "E",
  Ł: "L",
  Ń: "N",
  Ó: "O",
  Ś: "S",
  Ź: "Z",
  Ż: "Z",
}

/**
 * Replace Polish diacritics with their ASCII equivalents, preserving case.
 * Any other accented characters are stripped of their combining marks.
 *
 * @param {string} s
 * @returns {string}
 */
export function foldPolish(s) {
  return s
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => POLISH_TO_ASCII[ch])
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .normalize("NFC")
}

/**
 * Prepare a path or title for Quartz's slugifier.
 *
 * Quartz turns each whitespace run into a single `-` and lowercases the result,
 * but it leaves Unicode punctuation alone. A title like `Pobór wojska — żółć`
 * would otherwise slug to `pobor-wojska-—-zolc` with the em dash intact, so
 * dash-like and quote-like punctuation is converted to spaces and whitespace
 * runs are collapsed before handing off.
 *
 * @param {string} s
 * @returns {string}
 */
export function foldPolishForSlug(s) {
  return foldPolish(s)
    .replace(/['’]/g, "")
    // dashes, quotes and other separators that should not survive into a URL
    .replace(/[‐-―−‘‚‛“”„‟«»‹›]/g, " ")
    .replace(/[,;!]/g, "")
    // collapse whitespace runs so they do not become repeated hyphens
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Normalise a string for search comparison: ASCII-folded and lowercased, so a
 * query typed without diacritics (`pobor`, `zolnierz`) matches indexed text
 * that has them (`Pobór`, `żołnierz`).
 *
 * @param {string} s
 * @returns {string}
 */
export function foldPolishForSearch(s) {
  return foldPolish(s).toLowerCase()
}

/** Punctuation that must not survive into a URL, converted to a separator. */
export const SLUG_PUNCTUATION = "[‐-―−‘‚‛“”„‟«»‹›]"

/**
 * Apostrophes, which are dropped rather than turned into a separator: they sit
 * inside a word (`R'hllora`), so a separator would split it (`r-hllora`).
 * U+2019 belongs here rather than in {@link SLUG_PUNCTUATION} — in Polish and
 * English text it is an apostrophe, while quotation marks are `„…”`.
 */
export const SLUG_APOSTROPHE = "['’]"

/**
 * Diacritic folding expressed as a chain of `.replace()` calls, for injection
 * into the client-side search tokenizer. Ends with `.toLowerCase()` so the
 * comparison is case-insensitive as well as diacritic-insensitive.
 *
 * Applied to both the indexed text and the query, since both pass through the
 * same tokenizer — that is what makes `zolnierz` match `żołnierz`.
 *
 * @returns {string} e.g. `.replace(/[ąĄ]/g,"a")....toLowerCase()`
 */
export function buildSearchFoldChain() {
  return `${buildFoldReplaces()}.toLowerCase()`
}

/** Shared `.replace()` chain mapping every Polish letter to its ASCII form. */
function buildFoldReplaces() {
  /** @type {Map<string, string[]>} */
  const byTarget = new Map()
  for (const [source, target] of Object.entries(POLISH_TO_ASCII)) {
    const lower = target.toLowerCase()
    if (!byTarget.has(lower)) byTarget.set(lower, [])
    byTarget.get(lower).push(source)
  }
  return [...byTarget.entries()]
    .map(([target, sources]) => `.replace(/[${sources.join("")}]/g,"${target}")`)
    .join("")
}

/**
 * The same folding as {@link foldPolishForSlug}, expressed as a chain of
 * `.replace()` calls that can be injected into a third-party bundle.
 *
 * `scripts/patch-polish.mjs` splices this into Quartz's slugifier, which lives
 * inside npm packages with no configuration hook. Building the chain from
 * {@link POLISH_TO_ASCII} keeps one source of truth for the mapping.
 *
 * Case is collapsed to lowercase because Quartz's slugifier lowercases the
 * segment immediately afterwards.
 *
 * @returns {string} e.g. `.replace(/[ąĄ]/g,"a")...`
 */
export function buildSlugFoldChain() {
  return (
    buildFoldReplaces() +
    // apostrophes vanish, so `R'hllora` slugs as `rhllora` and not `r-hllora`
    `.replace(/${SLUG_APOSTROPHE}/g,"")` +
    // dashes and typographic quotes become separators rather than surviving
    `.replace(/${SLUG_PUNCTUATION}/g," ")` +
    `.replace(/[,;!]/g,"")` +
    // collapse runs so they do not turn into repeated hyphens
    `.replace(/\\s+/g," ").trim()`
  )
}
