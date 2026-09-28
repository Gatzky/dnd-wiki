# AI Agent Guidelines for Uczta dla Wron

## Project Overview

This is a **static rules wiki** for a play-by-Discord strategy/RPG game set in *A Song of Ice and Fire*. Built with [Quartz 5](https://quartz.jzhao.xyz), a TypeScript-based static site generator. The site contains only rules—no lore, game state, or session logs. **All user-facing content is in Polish; code comments and documentation are in English.**

- **Content**: Markdown files in `content/` organized by game system (Dwór, Gospodarka, Dyplomacja, Intrygi, Militaria, Niesamowitości)
- **Build**: `npx quartz build --serve` starts local dev at http://localhost:8080
- **Output**: Static HTML in `public/` (not committed)

## Critical Polish-Specific Architecture

### The "Patch Polish" Pipeline

Polish poses four hard problems that aren't solvable by configuration alone. The solution is **procedural patching** that modifies installed npm packages:

1. **URL Slugs**: Pages keep Polish diacritics (e.g., `Pobór wojska` → `/pobor-wojska`), readable when pasted into Discord—not percent-encoded ASCII
2. **Three-Form Plurals**: Polish uses one/few/many (e.g., `1 minuta / 2 minuty / 5 minut`), not English singular/plural
3. **Date Format**: Real-world publication dates render as `27 lipca 2026 r.` (genitive month + abbreviation), not English patterns
4. **Search Folding**: Searching `dwor` finds `Dwór` (diacritics fold to ASCII in search, URLs do not)

**Key files:**
- [`scripts/patch-polish.mjs`](scripts/patch-polish.mjs): Patches `node_modules/@quartz-community/*` after install (idempotent, runs in `postinstall` and `prebuild`)
- [`quartz/polish/date.ts`](quartz/polish/date.ts): Polish date formatter
- [`quartz/polish/plural.ts`](quartz/polish/plural.ts): Three-form plural category logic and formatting helpers
- [`quartz/polish/fold.mjs`](quartz/polish/fold.mjs): Diacritic folding for both URL slugification and search indexing

**Why patches exist**: Quartz community plugins bundle slugification and locale logic as static JS with no runtime import hooks. Patching is necessary because one site is never enough—ten plugins carry the slugifier.

### Local Plugins

Located in `plugins/`, wired in via `file:` npm dependencies (links to `node_modules` on Windows):

- [`@uczta/ikonki`](plugins/ikonki/): Discord-style icon shortcodes. `:zloto:` (gold) in source expands to `content/ikonki/` embeds *before* markdown parsing
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

Polish-specific checks **must pass before any commit**:

```bash
npm run verify-polish    # Tests slugs, plurals, dates, wikilink resolution
npm run check-content    # Lints frontmatter, tables, editorial placeholders
npm run check            # TypeScript + Prettier format check
npm run format           # Auto-fix formatting
```

**Why**: `verify-polish` is the gate for silent failures (wrong slug → Discord links break, plurals missing → game rules nonsensical).

### Content Editing Without Obsidian

Game masters can edit entirely via GitHub web UI (no local setup required). Every `.md` file in `content/` becomes a published page. `content/index.md` is the home page.

## Content Conventions

### Frontmatter (YAML header)

Required fields (see [`CONTRIBUTING.md`](CONTRIBUTING.md) for full spec):

```yaml
---
title: Pobór wojska          # Full Polish title with diacritics (display name)
description: Zasady powoływania chorągwi...  # One sentence, used in search/Discord previews
tags: [hierarchia, zasoby]   # Topic tags for navigation
created: 2026-07-27         # Real-world publication date
modified: 2026-07-27        # Update on every content change
draft: false                 # true = excludes from build, index, RSS
aliases:                    # Deprecated page names (redirect targets for Discord links)
  - Chorągwie
---
```

**Important**: Dates are `YYYY-MM-DD` in frontmatter; rendered as `27 lipca 2026 r.` on the page.

### Markdown Patterns

- **Wikilinks** (cross-references): `[[Pobór wojska]]` or `[[zasady/Pobór wojska|custom text]]`
  - Resolved to shortest valid slug via `@quartz-community/crawl-links`
  - If ambiguous, include folder path
- **Icon shortcodes**: `:zloto:` (stored in `content/ikonki/zloto.md`) expands inline—used for resource counters in game rules
- **Quotation marks**: No SmartyPants (disabled in config). Use Polish „straight" quotes directly; they're preserved as-is
- **Editorial placeholders** (caught by linter): TODO, FIXME, XXX, TBD, LOREM (but bare `???` is allowed—it means hidden character location in game context)

### Directory Structure

- `content/Podstawy/`: Core rules
- `content/Dwór/`: Court, characters, reputation
- `content/Gospodarka/`: Economy, holdings, investments
- `content/Dyplomacja/`: Diplomacy, emissaries, influence
- `content/Intrygi/`: Plots, hidden characters, interrogations
- `content/Militaria/`: Armies, fleets, battles, sieges
- `content/Niesamowitości/`: Religion, blessings, the uncanny
- `content/introdudzenie/`: Fluffy intro letters (one per council seat)

## Configuration & Customization

- [`quartz.config.yaml`](quartz.config.yaml): Plugin pipeline, theme colors, typography, locale (`pl-PL`)
- [`quartz.ts`](quartz.ts): JavaScript options that YAML cannot express (e.g., explicit Google Fonts weights for Polish text rendering—semibold text was breaking because weight 600 was only requested for the title)
- [`quartz/styles/custom.scss`](quartz/styles/custom.scss): "Archiwum Cytadeli" theme—parchment light mode, candlelit dark mode, serif typefaces

## Common Pitfalls

1. **Forgetting `npm run patch-polish`**: Without it, Polish URLs mangle (ł → %C5%82) and plurals break. It runs automatically from `postinstall` and `prebuild`, but if you install with `--ignore-scripts`, run it by hand.

2. **Editing plugin code**: Local plugins are in `plugins/`, but they're `file:` dependencies—changes are live. Community plugins in `node_modules` are patched, not edited.

3. **Wikilink ambiguity**: If a title appears in multiple folders, the link resolver defaults to the shortest slug. Add folder prefix to disambiguate: `[[zasady/Ławę przysięgłych]]`.

4. **Table cell count mismatches**: An unescaped `|` inside a wikilink silently drops columns. The linter catches this (run `npm run check-content`).

5. **Dates in content**: Only real-world publication/modification dates belong in frontmatter. Game-world dates never go in `created`/`modified`—they're just narrative details in the body.

## Key Files for Agents

- **Build entry**: [`quartz/bootstrap-cli.mjs`](quartz/bootstrap-cli.mjs)
- **Config loading**: [`quartz/plugins/loader/config-loader.ts`](quartz/plugins/loader/config-loader.ts)
- **Polish helpers**: [`quartz/polish/`](quartz/polish/)
- **Rules content**: [`content/`](content/)
- **Linting scripts**: [`scripts/check-content.mjs`](scripts/check-content.mjs), [`scripts/verify-polish.ts`](scripts/verify-polish.ts)

---

*For game-master-facing editing documentation, see [`CONTRIBUTING.md`](CONTRIBUTING.md) (Polish).*
