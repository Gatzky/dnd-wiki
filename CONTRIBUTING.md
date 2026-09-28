# Contributing to the D&D Wiki

This guide explains how to add and update pages in the D&D 2024 reference wiki. You can edit files in GitHub's web interface; installing Obsidian is optional.

## General rules

1. Keep each page focused on one species, class, subclass, feat, or background.
2. Use original wording. Summarize mechanics accurately and link to the source instead of copying published descriptions verbatim.
3. Use English for page titles, descriptions, category names, and reader-facing prose.
4. Update `modified` whenever you change a page.

## Page metadata

Every published page starts with YAML frontmatter:

```yaml
---
title: Halfling
description: Halfling species traits in D&D 2024.
tags: [species]
created: 2026-09-28
modified: 2026-09-28
draft: false
---
```

| Field         | Required | Purpose                                                                        |
| ------------- | -------- | ------------------------------------------------------------------------------ |
| `title`       | Yes      | Page title shown to readers.                                                   |
| `description` | Yes      | One-sentence summary used in listings and previews.                            |
| `tags`        | No       | Optional topic tags. Use the relevant category where useful.                   |
| `created`     | Yes      | First publication date in `YYYY-MM-DD` format.                                 |
| `modified`    | Yes      | Most recent edit date in `YYYY-MM-DD` format.                                  |
| `draft`       | Yes      | Set to `true` to keep a page out of the published site; otherwise use `false`. |
| `aliases`     | No       | Previous page names or paths that should continue to resolve.                  |

Quote a YAML value if it contains a colon followed by a space or begins with YAML-special punctuation:

```yaml
description: "A concise guide: core traits and rules."
```

## Categories and page hierarchy

The top-level folder determines the category and URL:

| Folder                 | Category    | Example URL     |
| ---------------------- | ----------- | --------------- |
| `content/species/`     | Species     | `/species/`     |
| `content/classes/`     | Classes     | `/classes/`     |
| `content/feats/`       | Feats       | `/feats/`       |
| `content/backgrounds/` | Backgrounds | `/backgrounds/` |

Put each entry in the matching category folder. Nested folders create nested pages. For example:

```text
content/classes/Rogue.md
content/classes/Rogue/Swashbuckler.md
```

This creates the hierarchy `Classes → Rogue → Swashbuckler`. Use the folder index to link to its entries, and link from each parent page to its children.

## Links

Use wikilinks for internal pages. Quartz resolves the target and generates its URL:

```markdown
See [[Rogue]] and its subclass [[Swashbuckler]].
```

Add a custom label after a pipe when needed:

```markdown
See [[Swashbuckler|the duelist subclass]].
```

Use standard Markdown links for external references:

```markdown
Source: [D&D 2024 Halfling](https://dnd2024.wikidot.com/species:halfling).
```

## Suggested page structure

Start with a short summary, then organize details under descriptive headings:

```markdown
# Halfling

One-sentence overview of the entry.

## Traits

Explain each trait clearly and preserve its mechanical effect.

## Description

Add a concise, original summary where useful.

## Sources

Link to the rules reference or publication used.
```

Avoid copying long passages from sourcebooks or websites. Keep the rules precise, but express explanations and descriptive text in your own words.

## Updating a page

1. Edit the page content.
2. Update its `modified` date.
3. If you rename or move a page, add its old name or path to `aliases` so existing links can keep working.
4. Check internal links and confirm the page is not accidentally marked as a draft.

## Pull requests

Submit changes through a pull request rather than editing the `main` branch directly. Keep each pull request focused, explain what changed and why, and check the deployed site after the workflow completes.
