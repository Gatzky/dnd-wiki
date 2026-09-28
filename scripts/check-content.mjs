/**
 * Editorial lint for `content/`.
 *
 * Catches the mistakes that survive a green build: a markdown table whose rows
 * do not agree (Quartz renders it, just wrongly), a missing `description`
 * (which is what search results and Discord link previews show), and editorial
 * placeholders left in a page that is already published.
 *
 * Run with `npm run check-content`. Exits non-zero if anything is found.
 */
import { readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"

const CONTENT = "content"

/**
 * Notes-to-self that must never reach a published page. Deliberately does not
 * match bare `???`: the rules use it as an instruction to players (write `???`
 * for a hidden character's location).
 */
const PLACEHOLDERS =
  /\bTODO\b|\bFIXME\b|\bXXX\b|\bTBD\b|\bLOREM\b|TU TRZEBA|DO UZUPEŁNIENIA|UZUPEŁNIĆ/i

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = join(dir, e.name)
    if (e.isDirectory()) return e.name === ".obsidian" ? [] : walk(f)
    return e.name.endsWith(".md") ? [f] : []
  })

const problems = []
const report = (file, line, message) =>
  problems.push(`${relative(".", file)}${line ? `:${line}` : ""} — ${message}`)

for (const file of walk(CONTENT)) {
  const src = readFileSync(file, "utf8")
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(src)
  if (!fm) {
    report(file, 0, "no frontmatter block")
    continue
  }

  const field = (k) => {
    const m = new RegExp(`^${k}:(.*)$`, "m").exec(fm[1])
    return m ? m[1].trim() : null
  }
  const isDraft = field("draft") === "true"

  for (const k of ["title", "description", "created", "modified", "draft"]) {
    if (!field(k)) report(file, 0, `\`${k}\` is empty or missing`)
  }

  const body = src.slice(fm[0].length)
  const lines = body.split("\n")
  const offset = fm[0].split("\n").length - 1

  // A published page carrying a note-to-self is the failure this catches: the
  // build is perfectly happy to ship it to players.
  if (!isDraft) {
    lines.forEach((line, i) => {
      if (PLACEHOLDERS.test(line)) {
        report(file, offset + i + 1, `editorial placeholder in a published page: ${line.trim()}`)
      }
    })
  }

  // Table rows must agree on cell count. An unescaped `|` inside a wikilink is
  // the usual cause, and it silently drops a column rather than failing.
  let expected = 0
  let startedAt = 0
  lines.forEach((line, i) => {
    if (!line.trimStart().startsWith("|")) {
      expected = 0
      return
    }
    const cells = line.trim().replace(/\\\|/g, " ").split("|").length - 2
    if (expected === 0) {
      expected = cells
      startedAt = offset + i + 1
    } else if (cells !== expected) {
      report(
        file,
        offset + i + 1,
        `table row has ${cells} cells, table at line ${startedAt} has ${expected}`,
      )
    }
  })

  // The opening paragraph carries the drop cap, so a page that opens on a
  // heading loses it. Folder notes and the changelog are exempt by convention.
  const firstBlock = body.trim().split("\n\n")[0] ?? ""
  if (!isDraft && firstBlock.startsWith("#")) {
    report(file, 0, "page opens on a heading, so it gets no opening paragraph or drop cap")
  }
}

if (problems.length) {
  console.error(`[check-content] ${problems.length} problem(s):\n`)
  problems.forEach((p) => console.error("  " + p))
  process.exit(1)
}
console.log("[check-content] all pages pass")
