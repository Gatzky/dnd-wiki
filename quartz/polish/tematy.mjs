/**
 * Topics — the site's word for what Quartz calls tags.
 *
 * Everything the reader sees says "temat": the breadcrumb, the page titles, the
 * search hints and the URL (`/tematy/talenty`). Only the frontmatter key stays
 * `tags:`, because that one is Quartz's own field name and not user-facing.
 *
 * Topics are written in ASCII in frontmatter (see CONTRIBUTING.md) because
 * Quartz slugifies them at parse time and then uses that one value for *both*
 * the URL and the visible label — so a topic written `żywność` would show up as
 * `zywnosc` everywhere it appears. Keeping them ASCII at the source at least
 * made what you type match what you see.
 *
 * This table restores the Polish label at render time. The URL still uses the
 * ASCII slug (`/tematy/wlosci`), which is what makes links safe to paste into
 * Discord; only the text changes.
 *
 * `scripts/patch-polish.mjs` inlines both the segment and this table into the
 * tag components, since they are npm packages with no hook for either.
 *
 * To add a topic: add its slug here with the Polish label. A slug with no entry
 * falls back to its own name with the first letter capitalised, which is
 * already correct for anything without diacritics (`militaria` -> `Militaria`),
 * so only topics with Polish characters or multi-word names strictly need one.
 *
 * A slug also has to differ from every page's filename. A topic page is backed
 * by `content/tematy/<slug>.md` so that it gets a description and its own
 * preview image, and two files with the same stem make `[[Wikilinki]]`
 * ambiguous — Quartz then resolves them to a bare root slug and the link 404s.
 * That is why the topics collecting characters, traits, fiefs, the feudal order
 * and the turn cycle are named `bohaterowie`, `przymioty`, `wlosci`,
 * `hierarchia` and `kalendarz` rather than after the pages `Postacie`, `Cechy`,
 * `Lenna`, `Feudalizm` and `Tury`.
 */
export const TEMAT_LABELS = {
  bitwa: "Bitwa",
  bohaterowie: "Bohaterowie",
  cennik: "Cennik",
  fluff: "Fluff",
  hierarchia: "Hierarchia",
  kalendarz: "Kalendarz",
  przymioty: "Przymioty",
  talenty: "Talenty",
  wlosci: "Włości",
  zasoby: "Zasoby",
}

/**
 * The URL segment topic pages live under.
 *
 * Quartz hardcodes `tags` for this in every plugin that builds a topic link, so
 * the value is swapped in by the "Topic URL segment" patch rather than
 * configured. Changing it here changes every link, the emitted paths and the
 * breadcrumb, but the backing files in `content/` have to be moved to match.
 */
export const SEGMENT = "tematy"

/**
 * The lookup as a self-contained JS expression, for injection into a bundle
 * that cannot import from this repo.
 *
 * @param {string} argExpr the variable holding the topic slug at the patch site
 * @returns {string} an expression evaluating to the display label
 */
export function buildTematLabelExpr(argExpr) {
  return (
    `((t)=>(${JSON.stringify(TEMAT_LABELS)})[t] ?? ` +
    `(typeof t==="string"&&t.length?t.charAt(0).toUpperCase()+t.slice(1):t))(${argExpr})`
  )
}
