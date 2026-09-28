# DND Gatzky — zasady gry

Static rules wiki for a tabletop role-playing game. Built with [Quartz 5](https://quartz.jzhao.xyz) and published at [dnd-gatzky.dev](https://dnd-gatzky.dev).

The site is the authoritative rules reference: game masters propose rule changes as pull requests, players read the result and link to specific rules from Discord.

**The site is entirely in Polish.** Code comments and this README are in English; every user-facing string is Polish. Game-master-facing documentation is [`CONTRIBUTING.md`](CONTRIBUTING.md), also in Polish.

---

## Local development

```bash
npm install
```

```bash
npx quartz build --serve
```

The site is then at <http://localhost:8080>. `--serve` watches `content/` and rebuilds on save.

Build once, without serving:

```bash
npx quartz build
```

Output goes to `public/`.

> `npm install` runs `scripts/patch-polish.mjs` from its `postinstall` hook, and `npx quartz build` runs it again from `prebuild`. See [Polish localisation](#polish-localisation) for why this exists. If you ever install with `--ignore-scripts`, run `npm run patch-polish` by hand or the site will build with Polish-mangled URLs.

### Checks

```bash
npm run verify-polish
```

Exercises the slugifier, the three-form plural rule and the date format.

```bash
npm run check-contrast
```

Measures WCAG contrast for the palette in both light and dark mode.

---

## Repository layout

| Path                               | Purpose                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `content/`                         | The vault. Everything here becomes a page.                                                |
| `content/index.md`                 | Home page.                                                                                |
| `content/wprowadzenie/`            | Fluffy introductions — one letter per Small Council seat.                                 |
| `content/Podstawy/`                | Rule pages — core rules. Served at `/podstawy/`.                                          |
| `content/Dwór/`                    | Rule pages — court and characters. Served at `/dwor/`.                                    |
| `content/Gospodarka/`              | Rule pages — economy and holdings. Served at `/gospodarka/`.                              |
| `content/Dyplomacja/`              | Rule pages — diplomacy and influence. Served at `/dyplomacja/`.                           |
| `content/Intrygi/`                 | Rule pages — plots and hidden characters. Served at `/intrygi/`.                          |
| `content/Militaria/`               | Rule pages — armies, fleets, sieges and battle. Served at `/militaria/`.                  |
| `content/Niesamowitości/`          | Rule pages — religion, blessings and the uncanny. Served at `/niesamowitosci/`.           |
| `content/zalaczniki/ikonki/`       | Stat icons embedded inline in rule text.                                                  |
| `content/zalaczniki/wprowadzenie/` | Portraits for the introduction letters.                                                   |
| `content/dziennik-zmian.md`        | Changelog. Format documented on the page itself.                                          |
| `content/slownik.md`               | Glossary.                                                                                 |
| `_szablony/`                       | Obsidian note templates. Excluded from the build via `ignorePatterns`.                    |
| `.obsidian/`                       | Obsidian vault config, committed so every game master gets the same setup.                |
| `content/.obsidian/`               | A second vault config, for opening `content/` directly. Carries the obsidian-git plugin.  |
| `quartz.config.yaml`               | Site configuration: title, locale, theme, plugins.                                        |
| `quartz.ts`                        | TypeScript entry point. Only for options that cannot be expressed in YAML.                |
| `quartz/`                          | Quartz core. Mostly untouched — see [What is modified](#what-is-modified-in-quartz-core). |
| `quartz/polish/`                   | Polish helpers: diacritic folding, plural rule, date format, topic segment and labels.    |
| `quartz/styles/custom.scss`        | The "Archiwum Cytadeli" theme.                                                            |
| `plugins/typografia-pl/`           | Local Quartz plugin: Polish typography and drop-cap marking.                              |
| `plugins/nawigacja/`               | Local Quartz plugin: the masthead navigation component.                                   |
| `scripts/`                         | Build-time patching and verification scripts.                                             |
| `public/`                          | Build output. Not committed.                                                              |

### Editing without Obsidian

The repository doubles as an Obsidian vault, but nothing requires Obsidian. A game master editing a file in the GitHub web UI can produce a valid page from the schema documented in `CONTRIBUTING.md`. The Obsidian config only sets conventions that match what the build expects: wikilinks on, markdown links off, new notes in `content/Podstawy/`, templates in `_szablony/`.

**Rules are filed by section folder, not by tag.** The seven `content/` folders above _are_ the seven sections in the masthead — a page's folder decides which section it belongs to and what its URL is, so moving a file between folders moves it between sections. Adding a section means creating the folder and adding an entry to `SECTIONS` in [`plugins/nawigacja/components.js`](plugins/nawigacja/components.js); the masthead does not discover folders on its own, and seven entries is roughly what fits on one line at 1280px.

Section folders are named in Polish on disk (`content/Dwór/`); the slug patch folds that to `/dwor/` for the URL, while Quartz takes the folder page's heading from the original directory name, so it reads "Dwór".

One consequence worth knowing: a page whose name matches its folder becomes that folder's landing page. `content/Dwór/Dwór.md` is served at `/dwor/` and `content/Intrygi/Intrygi.md` at `/intrygi/`, with Quartz rendering the page's prose above the list of the other pages in the section. That is Quartz's own convention for folder index pages, not something configured here. Such a page is a real rule page in every other respect — it takes a table of contents and backlinks like any other. The remaining sections have no folder note, so their landing pages are generated and contain only the listing.

Open the **repository root** as the vault, not `content/` — the templates folder sits outside `content/`, and non-content folders are hidden via `userIgnoreFilters`. A second, smaller vault config exists at `content/.obsidian/` for opening `content/` on its own; it carries the obsidian-git plugin used to sync edits.

---

## Deployment — Cloudflare Pages

The repository is private and deploys to Cloudflare Pages. Settings to enter in the dashboard:

| Setting                | Value                             |
| ---------------------- | --------------------------------- |
| Framework preset       | None                              |
| Build command          | `npm install && npx quartz build` |
| Build output directory | `public`                          |
| Environment variable   | `NODE_VERSION` = `22.16.0`        |

Notes on each:

- **Build command.** Quartz's own documentation suggests `npx quartz plugin install && npx quartz build`. `npm install` covers it here, because every plugin this site uses is an npm dependency in `package.json` rather than a git-installed one, and `npm install` is also what triggers the Polish patch script. Running `npx quartz build` alone on a fresh clone would fail — there would be no `node_modules`.
- **`NODE_VERSION`.** `22.16.0` is the version pinned in `.node-version`, and `package.json` requires `>=22`. Local development and every check in this README were run and verified against **Node 24.15.0 / npm 11.12.1**; both work. Pinning to 22.16.0 in CI keeps Cloudflare on the version upstream Quartz targets.
- **Shallow clones.** Cloudflare shallow-clones the repository, so git history is not fully available. This site does not depend on it: `created`/`modified` come from frontmatter first, and every page carries both fields. If you later drop those fields and want git timestamps, prefix the build command with `git fetch --unshallow &&`.

Before the first deploy, replace the `TODO-DOMENA` placeholder for `baseUrl` in `quartz.config.yaml` with the real hostname (no protocol, no trailing slash). RSS links, the sitemap and OG image URLs are all built from it and stay broken until you do.

### Preview deployments

Cloudflare Pages builds a separate preview for every pull request and posts the link as a comment. This is the main reason the review workflow works: a game master can see a rendered rule change before approving it, instead of reading a markdown diff. `CONTRIBUTING.md` tells game masters to check it.

---

## Optional: announce rule changes on Discord

The build emits an RSS feed at `/index.xml`. Point a Discord webhook at it and merged rule changes announce themselves in the server.

There is no built-in Discord RSS reader, so you need something in between — a self-hosted poller, or a hosted service such as Zapier, IFTTT or MonitoRSS. The shape is the same in all of them:

1. Create a webhook in the target Discord channel (Channel Settings → Integrations → Webhooks).
2. Point the RSS reader at `https://<domain>/index.xml`.
3. Give it the webhook URL and a polling interval — every 15 minutes is plenty.

Two things worth knowing before you turn it on:

- The feed lists recently _modified_ pages, not changelog entries. A typo fix announces itself the same way a rule change does. If that turns out to be noisy, announce from `content/dziennik-zmian.md` instead — game masters only touch it for substantive changes.
- The feed is public to anyone holding the URL, even though the repository is private. Do not treat the domain as a secret.

---

## Polish localisation

Most of the work in this repository is here, and the reasons are not obvious, so they are worth stating.

**Quartz 5 ships its functionality as npm packages, and those packages bundle their own copies of shared helpers and their own locale tables.** Two consequences drive the design:

1. Editing `quartz/i18n/locales/pl-PL.ts` only affects components that live in Quartz core. Every plugin — search, backlinks, dark-mode toggle, table of contents — carries its own Polish strings, several of which shipped with typos (`Trzyb jasny`), untranslated English, or two-form plurals.
2. There is no configuration hook for slug generation, date formatting, collation or search normalisation.

So `scripts/patch-polish.mjs` rewrites those packages at install time. It runs from `postinstall` and `prebuild`, is idempotent, and **exits non-zero if any patch stops matching** — so an upstream package changing shape fails the build instead of silently shipping broken URLs. Each patch carries a comment explaining what it fixes and why.

Every patched file ends with a marker comment naming the patches it carries, and the runner skips those patches on that file rather than skipping the file wholesale. Adding a patch therefore applies to a tree that is already patched — no reinstall needed.

Despite the name, not every patch is about language. The file is the one place where upstream behaviour is corrected, because none of it is reachable from configuration.

| Patch                       | Fixes                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ASCII slugs                 | `Pobór wojska` → `/gospodarka/pobor-wojska`, `content/Dwór/` → `/dwor/`. Apostrophes are dropped rather than turned into separators, so `Błogosławieństwa R'hllora` slugs as `…-rhllora` and not `…-r-hllora`. Ten packages bundle the slugifier, including the two that resolve wikilinks.                                                                   |
| Polish date format          | `27 lip 2026` → `27 lipca 2026 r.`, both on an article and in listings.                                                                                                                                                                                                                                                                                       |
| Polish callout labels       | `[!przyklad]` would render as "Przyklad" — the callout name cannot carry `ł`, because the parser accepts ASCII only.                                                                                                                                                                                                                                          |
| Topic names and URL         | Quartz's tags are "tematy" here: they live at `/tematy/wlosci`, and `wlosci` → `Włości` in the chips, topic pages and topic index. Segment and labels both live in `quartz/polish/tematy.mjs`.                                                                                                                                                                |
| Polish plugin locales       | Replaces each plugin's bundled `pl-PL` table with corrected strings and three-form plurals.                                                                                                                                                                                                                                                                   |
| Polish collation            | `localeCompare(…, "pl")` so `Ł`, `Ó` and the ogonek letters sort correctly.                                                                                                                                                                                                                                                                                   |
| Diacritic-folding search    | See below.                                                                                                                                                                                                                                                                                                                                                    |
| Search / breadcrumb strings | Hardcoded English that no locale table covers.                                                                                                                                                                                                                                                                                                                |
| Backlinks on folder notes   | Backlinks compares its own slug against the targets recorded by `crawl-links`. A link to `[[Dwór]]` is stored as `dwor`, but `simplifySlug("dwor/index")` returns `dwor/` — it passes "prefix only" to `stripSlashes`, so the trailing slash survives — and the two never matched. Without this, a folder note shows no backlinks however many pages cite it. |
| Sort listings by name       | Listings sorted by date, so a section read in edit order. Removing the date comparison lets the sort fall through to the title compare it already ended with; folders still sort first.                                                                                                                                                                       |
| Drop dates from listings    | A rules index is browsed by subject, not by recency. The `<time>` element is not emitted at all, so it is gone from the accessibility tree too, and `custom.scss` collapses the empty cell it leaves behind.                                                                                                                                                  |
| Label the modified date     | Prefixes the article date with "ostatnio zmodyfikowano:", wrapped in one span so the component's comma separator cannot land between label and date. Reading time is switched off through the plugin's own `showReadingTime` option instead.                                                                                                                  |

### Why `ł` needs special handling

Every other Polish diacritic decomposes under Unicode NFD — `ż` is `z` plus a combining dot, so the usual "normalise and strip combining marks" trick folds it. `ł` (U+0142) has no decomposition; `"ł".normalize("NFD")` returns `"ł"` unchanged. Any folding built on NFD alone silently leaves it in place, which is why `quartz/polish/fold.mjs` uses an explicit table and applies NFD only afterwards, as a catch-all for incidental non-Polish accents.

### Search

The search index is a FlexSearch `Document` built with a _custom_ tokenizer. Supplying `encode` bypasses FlexSearch's built-in encoder entirely, so its normalisation never runs and nothing is folded — out of the box, `pobor` finds nothing. The patch wraps that tokenizer, so both the indexed text and the query are folded identically. Typing `pobor` finds `Pobór`, `zolnierz` finds `żołnierz`, and search is now case-insensitive too.

### Typography

`plugins/typografia-pl/` is a local Quartz plugin (wired in as a `file:` dependency, which is why it has a package name). It does two things:

- Replaces the space after a one-letter word (`a i o u w z`) with a non-breaking space, so Polish typesetting rules are respected. It walks the HTML tree carrying an "inside code" flag, so text inside `<code>`/`<pre>` — including syntax-highlighted spans — is never touched.
- Marks the opening paragraph of a rule page with `class="inicjal"` when the page has at least 200 characters, which is what drives the drop cap. CSS cannot count characters, so this has to happen at build time.

SmartyPants is disabled in `quartz.config.yaml`. Left on, it rewrites straight quotes into English `“ ”` and would destroy Polish `„ ”`.

### What is modified in Quartz core

Kept to a minimum, so upgrading Quartz stays feasible:

- `quartz/i18n/locales/pl-PL.ts` — rewritten (the shipped file had typos and two-form plurals).
- `quartz/components/Date.tsx` — `formatDate` returns the Polish format for `pl-PL`.
- `quartz/styles/custom.scss` — the theme. This file is intended to be edited.
- `quartz/polish/` — new directory, no upstream equivalent.

---

## Theme — "Archiwum Cytadeli"

The site reads as a maester's archive of the realm's written law: neutral between houses, restrained, built for twenty-minute reading sessions rather than first impressions. Colours and fonts are in `quartz.config.yaml`; everything else is `quartz/styles/custom.scss`.

The one ornamental idea is rubrication — `h2` in rubric red with a hairline rule beneath, the way a scribe marked section divisions. A drop cap opens each rule page, `<hr>` renders as `◇◇◇` between hairlines, and the table of contents and "Cytowane przez" panels are set as margin notes rather than boxes.

### Layout

Quartz's default frame is three columns, with the site title and navigation in a tall left sidebar. This site reads as a printed reference, so the chrome moves into a **masthead** across the top — wordmark and subtitle at the left, section navigation and the search control at the right — leaving one column of text with margin notes beside it.

No custom page frame was needed. The DOM is unchanged: `custom.scss` re-places `.left.sidebar` as a full-width grid row and lays it out horizontally, from the 800px breakpoint up. Below that, the masthead wraps onto three rows and Quartz's stacked mobile layout takes over.

The explorer stays enabled but is **mobile-only**. On desktop the masthead links cover every section and each section folder lists its own rules; on mobile the explorer is still the menu drawer.

### Font weights are set in `quartz.ts`, not the YAML

Worth knowing before changing fonts. Quartz picks the Google Fonts weights from per-role defaults when a font is given as a bare string — `[400, 700]` for `header`, `[400, 600]` for `title` — and the title request is additionally subsetted with `&text=<pageTitle>`, so it covers only the glyphs in the site name.

That silently breaks headings set in semibold: weight 600 gets requested _only_ for the 14 glyphs of "Uczta dla Wron", so a heading like "Od czego zacząć" draws `a c d l n o t z` from the real semibold face and synthesises the rest from 400/700 — one heading in two visibly different fonts. `quartz.ts` therefore lists the weights explicitly. If you add a heading weight in CSS, add it there too.

Accessibility constraints that must not be broken when editing the theme:

- Body text is at least 4.5:1 against the background in both modes. `npm run check-contrast` measures it. Measured: **13.28:1** light, **13.40:1** dark; links **6.72:1** and **4.84:1**.
- `--gray` and `--tertiary` are ornament only. `--gray` is ~2.4:1 on parchment — never text. Margin notes use `--marginalia-ink`, defined in `custom.scss` precisely because the palette had no tone that was both muted and legible.
- No blackletter anywhere, at any size.
- The layout must hold at 375px — most players read in Discord's in-app browser. Wide tables scroll inside their own container rather than pushing the page sideways.

---

## Known limitations

- **Heading anchors keep their diacritics.** A link to a whole rule is clean (`/gospodarka/zold-i-zapasy`), but a link to a section within it is not (`…#żołd`, which a browser percent-encodes when pasted). It works, it is just ugly. Folding these would mean patching three separate anchor generators that must agree with each other exactly; the risk of silently breaking every in-page link outweighed the cosmetic gain. Page-level URLs — the ones actually pasted into Discord — are unaffected.
- **Topics are Quartz's tags, renamed end to end.** Everything a reader sees says _temat_, including the URL — `/tematy/talenty`, not `/tags/talenty`. Quartz has no setting for the segment: it is written literally into every plugin that builds a topic link, so `scripts/patch-polish.mjs` rewrites those sites from `SEGMENT` in [`quartz/polish/tematy.mjs`](quartz/polish/tematy.mjs). The `tags:` frontmatter key keeps its name — it is Quartz's field, never shown to a reader. Labels come from the same file: Quartz slugifies a topic at parse time and uses that one value for both URL and label, so the ASCII slug stays in the address (safe to paste into Discord) and the Polish label is restored at render time. A topic also needs a backing `content/tematy/<slug>.md` for its description and preview image, which means its slug must not collide with any page filename.
- **A wikilink through an alias does not produce a backlink.** `aliases` exist to keep already-pasted Discord URLs alive after a rename, and they do that well. But `[[OldName]]` resolves to the redirect stub, not to the page, so the target's "Cytowane przez" panel never counts it. After renaming a page, repoint the _internal_ wikilinks at the new name — keep the alias for the outside world. `Intrygi` was showing 2 of its 10 citations until its links were repointed.
- **Upstream lockfile.** The Quartz v5 repository ships a `package-lock.json` that is out of sync with its own `package.json`, so `npm ci` fails on a fresh clone of upstream. The lockfile here was regenerated with `npm install` and is committed, so `npm ci` works in this repository.
