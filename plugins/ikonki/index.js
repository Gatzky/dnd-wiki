/**
 * Discord-style icon shorthand for Quartz.
 *
 * The rules lean on inline icons heavily — a single formula can carry four of
 * them — and writing `![[ikonki/zloto.png|złoto|18]]` inline makes the source
 * unreadable, doubly so inside a table cell where every pipe has to be escaped
 * as `\|`. So the wiki is written the way the game is actually played: in
 * Discord shortcodes.
 *
 *   `:zloto:`  ->  `![[ikonki/zloto.png|złoto]]`
 *
 * This is a `textTransform`, so it runs on the raw markdown before anything is
 * parsed. The expansion is therefore an ordinary Obsidian embed by the time
 * ObsidianFlavoredMarkdown sees it, and needs no special handling downstream —
 * popovers, the image path rewriter and `img[src*="ikonki/"]` in custom.scss
 * all behave exactly as they do for a hand-written embed.
 *
 * Size is deliberately not emitted. `custom.scss` sets `height: 1.15em` on
 * every icon, so a `|18` in the source is inert; leaving it out also avoids
 * the three-part-embed quirk where Quartz leaves the pipe escape stranded in
 * the `alt` attribute (`alt="złoto\"`).
 *
 * Only names backed by a real file in `content/ikonki/` are recognised. That
 * keeps ordinary prose safe: a stray `godzina 12:30:00` or a `foo:bar:baz`
 * cannot accidentally become an image, and a typo'd `:zlото:` is left visible
 * in the page rather than silently vanishing.
 */

import fs from "node:fs"
import path from "node:path"

/**
 * Polish name per icon, used for the `title` tooltip only.
 *
 * The `alt` is deliberately NOT this — see `expandLine`. Anything not listed
 * gets no tooltip, which is also what a newly dropped-in icon gets until it is
 * named here.
 */
const DEFAULT_LABELS = {
  dyplomacja: "dyplomacja",
  jajo: "smocze jajo",
  konnica: "konnica",
  kruk: "kruk",
  laska7: "łaska bóstw",
  laskaRh: "łaska bóstw",
  laskaSB: "łaska bóstw",
  laskaUB: "łaska bóstw",
  maszynyobleznicze: "maszyny oblężnicze",
  miasteczko: "miasteczko",
  miasto: "miasto",
  oblezenie: "postęp oblężenia",
  piechota: "piechota",
  rozmiararmii: "rozmiar armii",
  rozsierdzona: "rozsierdzona",
  rucharmii: "ruch armii",
  sila: "siła",
  smok: "smok",
  spiski: "spiski",
  statki: "statki",
  straty: "straty",
  strzelcy: "strzelcy",
  tron: "tron",
  warownia: "warownia",
  wojskowosc: "wojskowość",
  zamek: "zamek",
  zapasy: "zapasy",
  zarzadzanie: "zarządzanie",
  ziemie: "ziemie",
  zloto: "złoto",
}

const DEFAULT_DIR = "ikonki"

/**
 * A shortcode is a run of letters, digits, hyphens and underscores between two
 * colons. Deliberately no whitespace: `10:30 : 14` stays arithmetic.
 */
const SHORTCODE = /:([A-Za-z0-9_-]+):/g

/** Fenced code, indented code and inline code — never rewritten. */
const FENCE = /^(\s*)(`{3,}|~{3,})/

/**
 * Read the icon directory once per build and index it by base name.
 *
 * Done at plugin construction rather than lazily so a missing directory is a
 * loud failure at startup rather than a page that silently renders `:zloto:`
 * as text.
 */
function readIconNames(contentDir, iconDir) {
  const dir = path.join(contentDir, iconDir)
  let entries
  try {
    entries = fs.readdirSync(dir)
  } catch {
    return new Map()
  }
  const names = new Map()
  for (const entry of entries) {
    const ext = path.extname(entry)
    if (!/^\.(png|jpe?g|gif|svg|webp)$/i.test(ext)) continue
    names.set(path.basename(entry, ext), entry)
  }
  return names
}

/**
 * Expand shortcodes in one line.
 *
 * `inTable` decides how the embed's pipes are written. Inside a GFM table row
 * a bare `|` would end the cell, so the alias separator has to be escaped —
 * which is exactly the noise this plugin exists to keep out of the source.
 *
 * The alias — and therefore the rendered `alt` — is the shortcode itself, not
 * the Polish name. Browsers serialise an `<img>` as its alt text when a
 * selection is copied as plain text, so selecting a rule in the browser and
 * pasting it into Discord carries `:zloto:` across, where Discord renders it
 * as the matching server emoji. The rules read the same in both places.
 *
 * The Polish name is not lost: `htmlPlugins` puts it in `title`, so hovering
 * an icon still says what it is.
 */
function expandLine(line, icons, iconDir, inTable, stats) {
  return line.replace(SHORTCODE, (match, name) => {
    const file = icons.get(name)
    if (!file) return match
    const bar = inTable ? "\\|" : "|"
    stats.count++
    return `![[${iconDir}/${file}${bar}:${name}:]]`
  })
}

/**
 * Split a line on inline-code spans and rewrite only the parts outside them,
 * so `` `:zloto:` `` documents the shortcode instead of rendering it.
 */
function expandOutsideCode(line, expand) {
  return line
    .split(/(`+[^`]*`+)/g)
    .map((part) => (part.startsWith("`") ? part : expand(part)))
    .join("")
}

/**
 * Client-side copy handler.
 *
 * Every engine is *supposed* to serialise an `<img>` as its alt text when a
 * selection is copied as plain text — that is the mechanism Discord itself
 * relies on for its own emoji. In practice it varies by browser and by
 * version, and a rule pasted into Discord with the icons silently missing is
 * worse than useless: `Lenno przynosi 3 dochodu` reads as a typo, not as a
 * lost image.
 *
 * So the plain-text flavour is written explicitly here instead of trusted.
 * The handler only intervenes when the selection actually contains an icon;
 * every other copy on the site falls through to the browser untouched.
 */
const COPY_SCRIPT = `
document.addEventListener("copy", (e) => {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
  if (!e.clipboardData) return

  const frag = sel.getRangeAt(0).cloneContents()
  const icons = frag.querySelectorAll('img[alt^=":"]')
  if (icons.length === 0) return

  let replaced = 0
  icons.forEach((img) => {
    const alt = img.getAttribute("alt") || ""
    if (!/^:[A-Za-z0-9_-]+:$/.test(alt)) return
    img.replaceWith(document.createTextNode(alt))
    replaced++
  })
  if (replaced === 0) return

  // Attached (but off-screen) so innerText goes through layout and reproduces
  // the line and cell breaks a normal copy would have.
  const host = document.createElement("div")
  host.style.cssText = "position:fixed;left:-9999px;top:0;white-space:pre-wrap"
  host.appendChild(frag)
  document.body.appendChild(host)
  const plain = host.innerText
  const html = host.innerHTML
  document.body.removeChild(host)

  e.clipboardData.setData("text/plain", plain)
  e.clipboardData.setData("text/html", html)
  e.preventDefault()
})
`

export default function Ikonki(userOpts) {
  const iconDir = userOpts?.directory ?? DEFAULT_DIR
  const labels = { ...DEFAULT_LABELS, ...(userOpts?.labels ?? {}) }
  let icons = null

  return {
    name: "Ikonki",

    textTransform(ctx, src) {
      icons ??= readIconNames(ctx.argv.directory, iconDir)
      if (icons.size === 0) return src

      const stats = { count: 0 }
      const lines = src.split("\n")
      const out = []

      let inFence = null
      // Frontmatter is data, not prose: a `:zloto:` in a description belongs in
      // the OG card and the search index as typed, not as an image embed.
      let inFrontmatter = lines[0]?.trim() === "---"

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        if (inFrontmatter) {
          out.push(line)
          if (i > 0 && line.trim() === "---") inFrontmatter = false
          continue
        }

        const fence = line.match(FENCE)
        if (fence) {
          if (inFence === null) inFence = fence[2][0]
          else if (fence[2][0] === inFence) inFence = null
          out.push(line)
          continue
        }
        if (inFence !== null || /^ {4,}\S/.test(line)) {
          out.push(line)
          continue
        }

        const inTable = line.trimStart().startsWith("|")
        out.push(
          expandOutsideCode(line, (part) => expandLine(part, icons, iconDir, inTable, stats)),
        )
      }

      return out.join("\n")
    },

    /**
     * Put the Polish name back as a `title`, so the icon is identifiable on
     * hover even though its `alt` is the shortcode.
     *
     * Done at the HTML stage rather than in the embed itself because Obsidian
     * embeds have no syntax for a title, and a three-part embed
     * (`\|alias\|18`) additionally strands the pipe escape in the `alt`.
     */
    htmlPlugins() {
      // Quartz slugifies asset file names to lower case on emit, so `src` for
      // `laskaSB.png` reads `laskasb.png`. The map is keyed by the name as
      // written, so it is looked up case-insensitively.
      const byLowerName = new Map(Object.entries(labels).map(([k, v]) => [k.toLowerCase(), v]))
      return [
        () => (tree) => {
          const walk = (node) => {
            if (node.type === "element" && node.tagName === "img") {
              const src = String(node.properties?.src ?? "")
              const match = src.match(
                new RegExp(`${iconDir}/([A-Za-z0-9_-]+)\\.(?:png|jpe?g|gif|svg|webp)$`, "i"),
              )
              const label = match && byLowerName.get(match[1].toLowerCase())
              if (label && !node.properties.title) node.properties.title = label
            }
            for (const child of node.children ?? []) walk(child)
          }
          walk(tree)
        },
      ]
    },

    externalResources() {
      return { js: [{ loadTime: "afterDOMReady", spaPreserve: true, contentType: "inline", script: COPY_SCRIPT }] }
    },
  }
}
