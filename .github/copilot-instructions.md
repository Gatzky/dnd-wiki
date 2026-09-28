# AI Agent Guidelines for DND Wiki

## Project Overview

This is a **static D&D 2024 reference wiki**, built with [Quartz 5](https://quartz.jzhao.xyz), a TypeScript-based static site generator. Repository documentation is written in English.

- **Content**: Markdown pages in `content/`, organized under `species/`, `classes/`, `feats/`, and `backgrounds/`. Nested folders represent nested entries, such as `classes/Rogue/Swashbuckler.md`.
- **Build**: `npx quartz build --serve` starts local dev at http://localhost:8080
- **Output**: Static HTML in `public/` (not committed)

## Critical Polish-Specific Architecture

### The "Patch Polish" Pipeline

Polish poses four hard problems that aren't solvable by configuration alone. The solution is **procedural patching** that modifies installed npm packages:

1. **URL Slugs**: Polish names in legacy content fold to readable ASCII URLs (for example, `Pobór wojska` → `/pobor-wojska`).
2. **Three-Form Plurals**: Polish uses one/few/many (e.g., `1 minuta / 2 minuty / 5 minut`), not English singular/plural
3. **Date Format**: Dates use the Polish long form, such as `27 lipca 2026 r.`.
4. **Search Folding**: Searching `dwor` finds `Dwór` (diacritics fold to ASCII in search, URLs do not)

**Key files:**

- [`scripts/patch-polish.mjs`](scripts/patch-polish.mjs): Patches `node_modules/@quartz-community/*` after install (idempotent, runs in `postinstall` and `prebuild`)
- [`quartz/polish/date.ts`](quartz/polish/date.ts): localized date formatter
- [`quartz/polish/plural.ts`](quartz/polish/plural.ts): Three-form plural category logic and formatting helpers
- [`quartz/polish/fold.mjs`](quartz/polish/fold.mjs): Diacritic folding for both URL slugification and search indexing

**Why patches exist**: Quartz community plugins bundle slugification and locale logic as static JS with no runtime import hooks. Patching is necessary because one site is never enough—ten plugins carry the slugifier.

### Local Plugins

Located in `plugins/` and wired in through `file:` npm dependencies:

- [`@uczta/typografia-pl`](plugins/typografia-pl/): Adds non-breaking spaces after single-letter words (Polish typography rule)
- [`@uczta/nawigacja`](plugins/nawigacja/): Masthead navigation component

## Developer Workflows

### Build & Develop

```bash
npm install        # Runs patch-polish from postinstall
npx quartz build --serve  # Watch mode, local server at :8080
npx quartz build   # One-time build to public/
```

### Verification & Checks

Run the focused checks relevant to your changes. Before release, verify localization, content structure, types, and formatting:

```bash
npm run verify-polish    # Tests slugs, plurals, dates, wikilink resolution
npm run check-content    # Lints frontmatter, tables, editorial placeholders
npm run check            # TypeScript + Prettier format check
npm run format           # Auto-fix formatting
```

`verify-polish` checks slug generation, plural forms, dates, and wikilink resolution.

### Content Editing Without Obsidian

Pages can be edited through GitHub's web interface. Published Markdown files live under the four category folders; `content/index.md` is the home page.

## Content Conventions

### Frontmatter (YAML header)

Required fields (see [`CONTRIBUTING.md`](CONTRIBUTING.md) for full spec):

```yaml
---
title: Pobór wojska # Full Polish title with diacritics (display name)
description: Rules and options covered by this page. # One sentence for listings and previews
tags: [species] # Optional topic tags
created: 2026-07-27 # Real-world publication date
modified: 2026-07-27 # Update on every content change
draft: false # true = excludes from build, index, RSS
aliases: # Deprecated page names (redirect targets for Discord links)
  - Chorągwie
---
```

**Important**: Dates use `YYYY-MM-DD` in frontmatter and are formatted for the configured locale when rendered.

### Markdown Patterns

- **Wikilinks** (cross-references): `[[Halfling]]` or `[[Rogue/Swashbuckler|the subclass]]`
  - Resolved to shortest valid slug via `@quartz-community/crawl-links`
  - If ambiguous, include folder path
- **Quotation marks**: No SmartyPants (disabled in config). Use Polish „straight" quotes directly; they're preserved as-is
- **Editorial placeholders** (caught by linter): TODO, FIXME, XXX, TBD, LOREM (but bare `???` is allowed—it means hidden character location in game context)

### Directory Structure

- `content/species/`: Species pages
- `content/classes/`: Classes and nested subclasses
- `content/feats/`: Feat pages
- `content/backgrounds/`: Background pages

## Configuration & Customization

- [`quartz.config.yaml`](quartz.config.yaml): Plugin pipeline, theme colors, typography, and locale (`pl-PL`)
- [`quartz.ts`](quartz.ts): JavaScript options that YAML cannot express (e.g., explicit Google Fonts weights for Polish text rendering—semibold text was breaking because weight 600 was only requested for the title)
- [`quartz/styles/custom.scss`](quartz/styles/custom.scss): "Archiwum Cytadeli" theme—parchment light mode, candlelit dark mode, serif typefaces

## Common Pitfalls

1. **Forgetting `npm run patch-polish`**: Without it, Polish URLs mangle (ł → %C5%82) and plurals break. It runs automatically from `postinstall` and `prebuild`, but if you install with `--ignore-scripts`, run it by hand.

2. **Editing plugin code**: Local plugins are in `plugins/`, but they're `file:` dependencies—changes are live. Community plugins in `node_modules` are patched, not edited.

3. **Wikilink ambiguity**: If a title appears in multiple folders, the resolver may choose the shortest matching slug. Add a folder prefix to disambiguate, for example `[[classes/Rogue/Swashbuckler]]`.

4. **Table cell count mismatches**: An unescaped `|` inside a wikilink silently drops columns. The linter catches this (run `npm run check-content`).

5. **Dates in content**: Only real-world publication/modification dates belong in frontmatter. Game-world dates never go in `created`/`modified`—they're just narrative details in the body.

## Key Files for Agents

- **Build entry**: [`quartz/bootstrap-cli.mjs`](quartz/bootstrap-cli.mjs)
- **Config loading**: [`quartz/plugins/loader/config-loader.ts`](quartz/plugins/loader/config-loader.ts)
- **Polish helpers**: [`quartz/polish/`](quartz/polish/)
- **Rules content**: [`content/`](content/)
- **Linting scripts**: [`scripts/check-content.mjs`](scripts/check-content.mjs), [`scripts/verify-polish.ts`](scripts/verify-polish.ts)

---

_For page authoring conventions, see [`CONTRIBUTING.md`](CONTRIBUTING.md)._
