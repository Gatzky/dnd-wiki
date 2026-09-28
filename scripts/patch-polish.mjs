#!/usr/bin/env node
/**
 * Applies Polish-specific behaviour to Quartz's community plugin packages.
 *
 * Quartz 5 ships most of its functionality as npm packages under
 * `@quartz-community/*`. Several things this site needs are hard-coded inside
 * those packages with no configuration hook:
 *
 *   1. URL slugs keep Polish diacritics, so `Pobór wojska` would live at
 *      `/zasady/pobór-wojska` — percent-encoded and unreadable once pasted
 *      into Discord.
 *   2. Dates render as `27 lip 2026` rather than the house `27 lipca 2026 r.`
 *   3. The search index does not fold diacritics, so `pobor` finds nothing.
 *   4. Default collation misplaces Ł, Ó and the ogonek letters.
 *   5. Each plugin carries its own copy of the Polish locale, and those copies
 *      contain typos ("Trzyb jasny"), untranslated English, and two-form
 *      plurals for a language that has three.
 *
 * Two structural facts drive the design:
 *
 *   - Packages *bundle* shared helpers rather than importing them at runtime,
 *     so one patch site is never enough. This script scans every package and
 *     patches each copy it finds — ten carry the slugifier, including
 *     `crawl-links` and `obsidian-flavored-markdown`, which resolve wikilinks.
 *   - Each plugin also bundles its own locale table, so editing
 *     `quartz/i18n/locales/pl-PL.ts` only affects components living in Quartz
 *     core. Plugin-rendered strings have to be corrected here.
 *
 * Editing `node_modules` by hand would not survive `npm ci`, so this runs from
 * both `postinstall` and `prebuild`. It is idempotent: every patched file gets
 * a marker comment and is skipped on later runs.
 *
 * If a patch matches nothing on a clean tree, the script exits non-zero rather
 * than silently producing a site with Polish-mangled URLs or English UI.
 */

import { readFile, writeFile, readdir, rm } from "node:fs/promises"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, sep } from "node:path"

import { buildSlugFoldChain, buildSearchFoldChain } from "../quartz/polish/fold.mjs"
import { buildTematLabelExpr, SEGMENT } from "../quartz/polish/tematy.mjs"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const packagesRoot = join(repoRoot, "node_modules", "@quartz-community")
const MARKER = "uczta-dla-wron: polish patch"

/** Recursively collect every `.js` file under a directory. */
async function collectJsFiles(dir) {
  const out = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await collectJsFiles(full)))
    } else if (entry.name.endsWith(".js")) {
      out.push(full)
    }
  }
  return out
}

/**
 * Polish's three-way plural split, as an inline JS expression for injection
 * into a bundle that cannot import from this repo.
 *
 * Mirrors quartz/polish/plural.ts — see that file for the rule itself.
 */
function plInline(countExpr, one, few, many) {
  return (
    `(()=>{const n=Math.abs(${countExpr});const d=n%10,dd=n%100;` +
    `return n===1?${JSON.stringify(one)}:` +
    `(d>=2&&d<=4&&!(dd>=12&&dd<=14))?${JSON.stringify(few)}:${JSON.stringify(many)};})()`
  )
}

/**
 * Corrected Polish locale blocks, keyed by a marker unique to the plugin whose
 * table it is. Each plugin bundles exactly one `pl_PL_default`.
 *
 * Rewriting the whole block rather than individual strings avoids matching
 * against the `\uXXXX` escapes the bundler emits for Polish characters.
 */
const PL_LOCALE_BLOCKS = [
  {
    detect: /backlinks:/,
    body: `{
  components: {
    backlinks: {
      title: "Cytowane przez",
      noBacklinksFound: "Żadna zasada nie cytuje tej strony"
    }
  }
}`,
  },
  {
    detect: /themeToggle:/,
    body: `{
  components: {
    themeToggle: {
      darkMode: "Tryb ciemny",
      lightMode: "Tryb jasny"
    }
  }
}`,
  },
  {
    detect: /readerMode:/,
    body: `{
  components: {
    readerMode: {
      title: "Tryb czytania"
    }
  }
}`,
  },
  {
    detect: /explorer:/,
    body: `{
  components: {
    explorer: {
      title: "Spis zasad"
    }
  }
}`,
  },
  {
    detect: /tableOfContents:/,
    body: `{
  components: {
    tableOfContents: {
      title: "Spis treści"
    }
  }
}`,
  },
  {
    detect: /footer:/,
    body: `{
  components: {
    footer: {
      createdWith: "Zbudowano przy użyciu"
    }
  }
}`,
  },
  {
    detect: /contentMeta:/,
    body: `{
  components: {
    contentMeta: {
      readingTime: ({ minutes }) => \`\${minutes} \${${plInline(
        "minutes",
        "minuta",
        "minuty",
        "minut",
      )}} czytania\`
    }
  }
}`,
  },
  {
    detect: /search:/,
    body: `{
  components: {
    search: {
      title: "Szukaj",
      searchBarPlaceholder: "Szukaj w zasadach…",
      noResults: "Brak wyników.",
      noResultsHint: "Spróbuj innego hasła.",
      tagFilterHint: "Filtruj po temacie",
      noTagsFound: "Brak pasujących tematów"
    }
  }
}`,
  },
  {
    detect: /folderContent:/,
    body: `{
  pages: {
    folderContent: {
      folder: "Dział",
      itemsUnderFolder: ({ count }) => \`W tym dziale: \${count} \${${plInline(
        "count",
        "element",
        "elementy",
        "elementów",
      )}}.\`
    }
  },
  components: {}
}`,
  },
  {
    detect: /tagContent:/,
    body: `{
  pages: {
    tagContent: {
      tag: "Temat",
      tagIndex: "Spis tematów",
      itemsUnderTag: ({ count }) => \`W tej kategorii: \${count} \${${plInline(
        "count",
        "element",
        "elementy",
        "elementów",
      )}}.\`,
      showingFirst: ({ count }) => \`Pokazano pierwsze \${count} \${${plInline(
        "count",
        "temat",
        "tematy",
        "tematów",
      )}}.\`,
      totalTags: ({ count }) => \`Znaleziono łącznie \${count} \${${plInline(
        "count",
        "temat",
        "tematy",
        "tematów",
      )}}.\`
    }
  },
  components: {}
}`,
  },
  {
    detect: /recentNotes:/,
    body: `{
  components: {
    recentNotes: {
      title: "Ostatnie zmiany",
      seeRemainingMore: ({ remaining }) => \`Zobacz pozostałe: \${remaining} →\`
    }
  }
}`,
  },
]

/**
 * A patch is a named regex plus a replacement. `expectAtLeast` guards against
 * an upstream refactor quietly disabling the patch.
 */
const patches = [
  {
    name: "ASCII slugs",
    // `segment.replace(/\s/g, "-").replace(/&/g, "-and-")...` is the head of
    // Quartz's per-segment slugifier, in both minified and formatted bundles.
    // Folding is injected ahead of it so the whitespace-to-hyphen step sees
    // ASCII with single spaces.
    pattern: /\.replace\(\/\\s\/g,\s*"-"\)(?=\.replace\(\/&\/g,\s*"-and-"\))/g,
    replacement: () => `${buildSlugFoldChain()}.replace(/\\s/g,"-")`,
    expectAtLeast: 8,
  },
  {
    name: "Polish date format",
    // The stock `formatDate`, bundled separately into every component package
    // that renders a date. The local parameter name varies between bundles.
    pattern:
      /function formatDate\((\w+),\s*locale\s*=\s*"en-US"\)\s*\{\s*return \1\.toLocaleDateString\(locale,\s*\{\s*year:\s*"numeric",\s*month:\s*"short",\s*day:\s*"2-digit"\s*\}\);?\s*\}/g,
    replacement: (_match, param) =>
      `function formatDate(${param}, locale = "en-US") {` +
      ` if (locale === "pl-PL") {` +
      ` return ${param}.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) + " r.";` +
      ` }` +
      ` return ${param}.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" });` +
      ` }`,
    expectAtLeast: 2,
  },
  {
    // The folder and tag listing pages format their dates inline in a
    // `DateDisplay` component rather than through a shared `formatDate`, so the
    // patch above misses them and listings keep showing `27 lip 2026`.
    //
    // Deliberately requires the multi-line form: the replacement emitted by
    // "Polish date format" is a single line, so this cannot match its output
    // and wrap it twice.
    name: "Polish date format (listings)",
    pattern:
      /(\w+)\.toLocaleDateString\(locale, \{\n\s*year: "numeric",\n\s*month: "short",\n\s*day: "2-digit"\n\s*\}\)/g,
    replacement: (_match, receiver) =>
      `(locale === "pl-PL"` +
      ` ? ${receiver}.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) + " r."` +
      ` : ${receiver}.toLocaleDateString(locale, { year: "numeric", month: "short", day: "2-digit" }))`,
    expectAtLeast: 4,
  },
  {
    // "Cytowane przez" is reference material, consulted after reading rather
    // than during it, and on a well-linked rule it is the longest thing in the
    // margin — it pushes the table of contents, which *is* needed while
    // reading, off the top of the column. Wrapping it in a native <details>
    // collapses it until asked for, and costs no script: the disclosure
    // triangle, keyboard behaviour and the accessible name all come free.
    name: "Collapsible backlinks",
    pattern:
      /u2\("div", \{ class: classNames\(displayClass, "backlinks"\), children: \[\s*\/\* @__PURE__ \*\/ u2\("h3", \{ children: i18n\(locale\)\.components\.backlinks\.title \}\)/g,
    replacement: () =>
      'u2("details", { class: classNames(displayClass, "backlinks"), children: [' +
      'u2("summary", { children: u2("h3", { children: i18n(locale).components.backlinks.title }) })',
    expectAtLeast: 2,
  },
  {
    // A section index is a catalogue, and a catalogue entry is a title *and*
    // what the thing is. PageList emits only the title, so the Podstawy page
    // was a column of eight bare links with no way to tell them apart without
    // opening each one. Every page carries a one-sentence `description`
    // already — this puts it in the entry, where the reader is choosing.
    //
    // Tags need no patch: `pagesFromTrie` passes the real file data through, so
    // they were already there for any page that has them. The article number is
    // a CSS counter in custom.scss rather than markup.
    name: "Descriptions in listings",
    pattern:
      /class: "desc", children: (\/\* @__PURE__ \*\/ u2\("h3", \{ children: \/\* @__PURE__ \*\/ u2\(\s*"a",\s*\{\s*href: resolveRelative\(fileSlug \?\? "", page\.slug\),\s*class: "internal",\s*children: title\s*\}\s*\) \}\)) \}\)/g,
    replacement: (_match, heading) =>
      `class: "desc", children: [${heading}, page.description ? ` +
      `u2("p", { class: "desc-line", children: page.description }) : null] })`,
    expectAtLeast: 4,
  },
  {
    // Backlinks never appear on a folder note, however many pages link to it.
    //
    // Backlinks matches its own slug against the link targets recorded by
    // crawl-links. A link to `[[Dwór]]` is recorded as `dwor`, but the folder
    // note's own slug is `dwor/index`, and `simplifySlug` reduces that to
    // `dwor/` — it calls `stripSlashes(…, true)`, and that second argument
    // means "prefix only", so the trailing slash `trimSuffix` leaves behind
    // survives. `"dwor" !== "dwor/"`, so the match is always empty.
    //
    // Dropping the trailing slash here fixes the comparison without touching
    // `simplifySlug` itself, which resolveRelative and the link rewriter also
    // depend on. The `|| "/"` keeps the root index page, whose simplified slug
    // is exactly "/", from collapsing to an empty string.
    name: "Backlinks on folder notes",
    pattern: /const slug2 = simplifySlug\(fileData\.slug\);/g,
    replacement: () => 'const slug2 = simplifySlug(fileData.slug).replace(/\\/$/, "") || "/";',
    expectAtLeast: 2,
  },
  {
    // Listing pages sort by date first, so a section reads in edit order
    // rather than in an order a reader can predict. Dropping the date
    // comparison lets the function fall through to the title compare it
    // already ends with — folders still sort first.
    name: "Sort listings by name",
    pattern:
      /if \((\w+)\.dates && (\w+)\.dates\) \{\s*return \(getDate\(\2\)\?\.getTime\(\) \?\? 0\) - \(getDate\(\1\)\?\.getTime\(\) \?\? 0\);\s*\} else if \(\1\.dates && !\2\.dates\) \{\s*return -1;\s*\} else if \(!\1\.dates && \2\.dates\) \{\s*return 1;\s*\}/g,
    replacement: () => "",
    expectAtLeast: 4,
  },
  {
    // The per-entry date on listing pages is noise here: a rules index is
    // browsed by subject, not by recency. Falsifying the condition drops the
    // <time> element entirely rather than hiding it in CSS, so it is also gone
    // from the accessibility tree. The now-empty <p class="meta"> is collapsed
    // by a `:empty` rule in custom.scss.
    name: "Drop dates from listings",
    pattern: /children: page\.dates && getDate\(page\) && /g,
    replacement: () => "children: false && ",
    expectAtLeast: 4,
  },
  {
    // Label the date on an article so it is unambiguous which date it is.
    // Wrapping the label and the <time> in one segment keeps ContentMeta's
    // comma separator from landing between them.
    name: "Label the modified date",
    pattern: /segments\.push\(\/\* @__PURE__ \*\/ u2\(DateComponent, \{ date, locale \}\)\);/g,
    replacement: () =>
      'segments.push(u2("span", { class: "meta-modified", children: ' +
      '["ostatnio zmodyfikowano: ", u2(DateComponent, { date, locale })] }));',
    expectAtLeast: 2,
  },
  {
    // Project-specific callout labels.
    //
    // Obsidian-flavoured markdown builds a default title for an unknown callout
    // by capitalising its name, so `[!przyklad]` renders as "Przyklad" — no ł —
    // and `[!opcjonalna]` as "Opcjonalna" rather than "Zasada opcjonalna". The
    // callout name itself cannot carry the diacritic, because the parser's
    // callout regex is `[\w-]+` and `\w` is ASCII-only.
    //
    // Only the default-title branch is touched, so a title written by hand
    // (`> [!uwaga] Własny tytuł`) still wins.
    name: "Polish callout labels",
    pattern: /capitalize\(typeStringValue\)\.replace\(\/-\/g, " "\)/g,
    replacement: () =>
      '({orzeczenie:"Orzeczenie",errata:"Errata",zmiana:"Zmiana",' +
      'przyklad:"Przykład",uwaga:"Uwaga",opcjonalna:"Zasada opcjonalna",wzor:"Wzór",' +
      'procedura:"Procedura",wyjatek:"Wyjątek"}' +
      '[typeStringValue.toLowerCase()] ?? capitalize(typeStringValue).replace(/-/g, " "))',
    expectAtLeast: 1,
  },
  {
    // Tag display names.
    //
    // Quartz slugifies tags at parse time and then uses that single value for
    // both the URL and the label, so a tag reads `dwor` wherever it is shown.
    // The URL should stay ASCII — that is what makes tag links safe to paste
    // into Discord — so only the rendered text is swapped, via the table in
    // quartz/polish/tematy.mjs.
    //
    // Three render sites: the tag page's own title, the headings on the tag
    // index, and the tag chips under each article.
    name: "Tag display names",
    pattern:
      /(\$\{i18n\(locale\)\.pages\.tagContent\.tag\}: \$\{tag\}` : )tag;|class: "internal tag-link", href, children: t2 \}\)|href: linkDest, class: "internal tag-link", children: tag \}\)/g,
    replacement: (match, titlePrefix) => {
      if (titlePrefix) return `${titlePrefix}${buildTematLabelExpr("tag")};`
      if (match.startsWith("class:")) {
        return `class: "internal tag-link", href, children: ${buildTematLabelExpr("t2")} })`
      }
      return `href: linkDest, class: "internal tag-link", children: ${buildTematLabelExpr("tag")} })`
    },
    expectAtLeast: 5,
  },
  {
    // The same swap for the tag chips PageList renders under each entry on the
    // folder and tag listing pages. Same idea as above, different call shape —
    // this one spreads the anchor's props across several lines.
    name: "Tag display names (listings)",
    pattern:
      /(href: resolveRelative\(\s*fileSlug \?\? "",\s*`tags\/\$\{tag\}`\s*\),\s*children: )tag\b/g,
    replacement: (_match, prefix) => `${prefix}${buildTematLabelExpr("tag")}`,
    expectAtLeast: 4,
  },
  {
    // Every plugin bundles its own locale table, so `quartz/i18n/locales/pl-PL.ts`
    // only reaches components that live in Quartz core. See PL_LOCALE_BLOCKS.
    name: "Polish plugin locales",
    pattern: /var pl_PL_default = \{[\s\S]*?\n\};/g,
    replacement: (match) => {
      const rule = PL_LOCALE_BLOCKS.find((r) => r.detect.test(match))
      // Graph is disabled for this site and needs no correction; leaving an
      // unknown block untouched is safer than guessing at its shape.
      return rule ? `var pl_PL_default = ${rule.body};` : match
    },
    expectAtLeast: 10,
  },
  {
    // Default collation puts Ł, Ó and the ogonek letters in the wrong place —
    // `Łowy` sorts after `Zboże` instead of between `Lenno` and `Majątek`.
    // Explorer entries, tag lists and generated indexes all sort through one of
    // these two call shapes.
    name: "Polish collation",
    pattern: /\.localeCompare\(([^,()]+?)(?:,\s*void 0)?(,|\))/g,
    replacement: (_match, arg, tail) => `.localeCompare(${arg},"pl"${tail === "," ? "," : ")"}`,
    expectAtLeast: 10,
  },
  {
    // The magnifying-glass icon carries an untranslated <title>, which is what
    // a browser shows as its tooltip. Scoped to the SVG title element — a bare
    // `"Search"` replacement would also rewrite the English entries in the
    // plugin's bundled locale table.
    name: "Search icon tooltip",
    pattern: /\("title", \{ children: "Search" \}\)/g,
    replacement: () => `("title", { children: "Szukaj" })`,
    expectAtLeast: 1,
  },
  {
    // The breadcrumb nav's accessible name is hardcoded English with no option
    // to override it. Not visible on screen, but a screen reader announces it.
    name: "Polish breadcrumb landmark",
    pattern: /"aria-label": "breadcrumbs"/g,
    replacement: () => `"aria-label": "Ścieżka nawigacji"`,
    expectAtLeast: 1,
  },
  {
    // The empty-results card is built imperatively inside the inlined
    // client-side search script, with its text hardcoded rather than read from
    // the locale table — so translating the locale alone leaves "No results."
    // on screen. Upstream leaves these English in nearly every locale.
    name: "Polish empty-search strings",
    pattern: /textContent="No results\.";([\s\S]{0,40}?)textContent="Try another search term\?"/g,
    replacement: (_m, between) =>
      `textContent="Brak wyników.";${between}textContent="Spróbuj innego hasła."`,
    expectAtLeast: 1,
  },
  {
    // Two more accessible names built imperatively in the inlined search
    // script, hardcoded English with no locale lookup. Invisible on screen but
    // announced by a screen reader.
    name: "Polish search landmarks",
    pattern: /"aria-label","(Tag suggestions|Search results)"/g,
    replacement: (_m, which) =>
      which === "Tag suggestions"
        ? `"aria-label","Podpowiedzi tematów"`
        : `"aria-label","Wyniki wyszukiwania"`,
    expectAtLeast: 2,
  },
  {
    // Diacritic-folding search.
    //
    // The search index is a FlexSearch Document built with a *custom* tokenizer
    // (`encode: <fn>`) that handles CJK ranges. Supplying `encode` bypasses
    // FlexSearch's built-in Encoder entirely, so its normalisation — NFKD plus
    // combining-mark stripping — never runs and nothing is folded.
    //
    // Wrapping the tokenizer folds every token on the way out. Indexing and
    // querying both call `encode`, so both sides of the comparison are
    // normalised identically, which is what makes `zolnierz` match `żołnierz`
    // and `pobor` match `Pobór`. It also makes search case-insensitive, which
    // the stock tokenizer was not.
    name: "Diacritic-folding search",
    pattern: /encode:(\w+),document:\{id:"id"/g,
    replacement: (_match, fn) =>
      `encode:(s)=>${fn}(s).map((t)=>t${buildSearchFoldChain()}),document:{id:"id"`,
    expectAtLeast: 1,
  },
  {
    // Heading anchors inside the search preview.
    //
    // Not a localisation fix, but the same situation the rest of this file
    // exists for: behaviour hard-coded inside a `@quartz-community` bundle
    // with no configuration hook.
    //
    // The preview fetches the result page, then rewrites every relative
    // `[href]`/`[src]` in it against that page's URL — but the skip list
    // exempts pure fragments. So the anchor link Quartz puts on every heading
    // stays `#jednostki-regionalne`, and inside the overlay it resolves
    // against whatever page the reader happens to be standing on: searching
    // from the home page, "Jednostki regionalne" in the Cennik jednostek
    // preview pointed at `/#jednostki-regionalne`, which goes nowhere.
    //
    // Dropping `#` from that list lets `new URL("#x", pageUrl)` build the full
    // `…/cennik-jednostek#jednostki-regionalne`. `/`-rooted hrefs stay skipped:
    // those already address the right page.
    //
    // Anchored on the neighbouring `startsWith("/")` test so it can only match
    // inside this one skip chain, and on the same variable via a backreference.
    name: "Search preview heading anchors",
    pattern: /(\w+)\.startsWith\("#"\)\|\|(?=\1\.startsWith\("\/"\))/g,
    replacement: () => "",
    expectAtLeast: 2,
  },
  {
    // Topic URL segment: `/tags/talenty` becomes `/tematy/talenty`.
    //
    // Everything a reader sees is Polish, and the address bar is not an
    // exception — `tags` was the last English word left on the site. Quartz has
    // no setting for this: the segment is written literally in every plugin
    // that builds a topic link, matches a topic slug or emits a topic page, so
    // all of those sites are rewritten here from `SEGMENT`.
    //
    // Deliberately NOT touched: the `tags:` frontmatter key and the `tags`
    // field on file data. Those are Quartz's own names for the field, never
    // shown to a reader, and renaming them would mean rewriting every page's
    // frontmatter to no visible effect. The pattern only matches the segment
    // where it is used as a path — followed by `/`, or compared against a
    // variable called `slug`.
    //
    // This patch must stay LAST in the array. The two "Tag display names"
    // patches above match on `` `tags/${tag}` `` at their patch sites, and
    // patches are applied to a file in array order — moving this one earlier
    // would rename the segment out from under their patterns and silently drop
    // the Polish labels.
    name: "Topic URL segment",
    pattern: new RegExp(
      [
        'startsWith\\("tags/"\\)', // slug guards
        'joinSegments\\("tags"', // where the topic page slug is built
        '(?<slugVar>slug2?) === "tags"', // the topic index, compared bare
        '"tags/index"', // …and compared by slug
        "(?<pre>`|/)tags/\\$\\{", // every link built in a template literal
        '"tags/"', // slice() offsets and prefix tests
      ].join("|"),
      "g",
    ),
    replacement: (match, ...args) => {
      const { slugVar, pre } = args[args.length - 1]
      if (slugVar) return `${slugVar} === "${SEGMENT}"`
      if (pre !== undefined) return `${pre}${SEGMENT}/\${`
      if (match.startsWith("startsWith")) return `startsWith("${SEGMENT}/")`
      if (match.startsWith("joinSegments")) return `joinSegments("${SEGMENT}"`
      if (match === '"tags/index"') return `"${SEGMENT}/index"`
      return `"${SEGMENT}/"`
    },
    expectAtLeast: 12,
  },
]

if (!existsSync(packagesRoot)) {
  console.error(`[polish-patch] ${packagesRoot} does not exist — run npm install first.`)
  process.exit(1)
}

const files = await collectJsFiles(packagesRoot)
/** Patch sites rewritten during this run. */
const hits = Object.fromEntries(patches.map((p) => [p.name, 0]))
/** Files that already carry this patch from an earlier run. */
const alreadyApplied = Object.fromEntries(patches.map((p) => [p.name, 0]))
let filesPatched = 0
let filesSkipped = 0

/** Matches the trailing marker comment written by an earlier run. */
const MARKER_RE = new RegExp(`\\n/\\* ${MARKER} — [^*]*\\*/\\n?$`)

for (const file of files) {
  const src = await readFile(file, "utf8")

  // The marker records which patches a file already carries, one name at a
  // time — not merely "this file was patched". Skipping the whole file would
  // mean a patch added later could never reach an already-patched tree, and
  // node_modules would have to be reinstalled to pick it up.
  const carriedNames = new Set()
  for (const patch of patches) {
    if (src.includes(`${patch.name}:applied`)) {
      carriedNames.add(patch.name)
      alreadyApplied[patch.name]++
    }
  }
  const hadMarker = MARKER_RE.test(src)
  if (hadMarker) filesSkipped++

  // Patch the file without its marker, so patterns cannot match the marker's
  // own text and the rewritten marker does not stack up.
  let out = src.replace(MARKER_RE, "\n")
  const applied = []

  for (const patch of patches) {
    if (carriedNames.has(patch.name)) continue
    const matches = out.match(patch.pattern)
    if (!matches) continue
    const before = out
    out = out.replace(patch.pattern, patch.replacement)
    // The locale patch leaves unknown blocks alone; do not claim a hit for those.
    if (out === before) continue
    hits[patch.name] += matches.length
    applied.push(patch.name)
  }

  if (applied.length === 0) continue

  // The whole marker must stay inside the comment — these files are ESM
  // modules and bare text after `*/` is a syntax error.
  const notes = [...carriedNames, ...applied].map((name) => `${name}:applied`).join(", ")
  await writeFile(file, `${out.replace(/\n+$/, "")}\n/* ${MARKER} — ${notes} */\n`, "utf8")
  filesPatched++
  console.log(`[polish-patch] ${file.split(`@quartz-community${sep}`)[1]}: ${applied.join(", ")}`)
}

// Quartz caches a transpiled bundle of its own source. It can hold a stale
// pre-patch copy of the slugifier, so drop it and let the next build rebuild.
const cacheDir = join(repoRoot, "quartz", ".quartz-cache")
if (existsSync(cacheDir)) {
  await rm(cacheDir, { recursive: true, force: true })
  console.log("[polish-patch] cleared quartz/.quartz-cache")
}

// `expectAtLeast` counts rewritten sites, so it only applies to files patched
// in this run. A file patched earlier is evidence enough on its own — its
// marker records which patches it carries.
let failed = false
for (const patch of patches) {
  const count = hits[patch.name]
  const carried = alreadyApplied[patch.name]
  const ok = count >= patch.expectAtLeast || carried > 0
  if (!ok) failed = true
  console.log(
    `[polish-patch] ${ok ? "ok  " : "FAIL"} ${patch.name}: ` +
      `${count} site(s) patched now, ${carried} file(s) already carrying it ` +
      `(expected at least ${patch.expectAtLeast} sites on a clean tree)`,
  )
}

console.log(`[polish-patch] ${filesPatched} file(s) patched, ${filesSkipped} already patched`)

if (failed) {
  console.error(
    "\n[polish-patch] A patch matched nothing. An upstream package has changed shape;\n" +
      "re-check scripts/patch-polish.mjs against the new version before deploying.",
  )
  process.exit(1)
}
