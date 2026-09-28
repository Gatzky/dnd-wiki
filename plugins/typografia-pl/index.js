/**
 * Polish typography for Quartz.
 *
 * Polish typesetting rules forbid leaving a one-letter word ("sierota", an
 * orphan) at the end of a line. The single-letter prepositions and
 * conjunctions — a, i, o, u, w, z — must stay glued to the word that follows,
 * so the space after them becomes a non-breaking space.
 *
 * This runs as a rehype (HTML-stage) transformer rather than a remark one so
 * it sees the final text nodes and can skip elements where a U+00A0 would be
 * wrong or harmful:
 *
 *   - `<code>` / `<pre>`: a non-breaking space inside a command or a code
 *     sample is a different character and would break copy-paste.
 *   - `<kbd>`, `<samp>`, `<var>`: same reasoning.
 *   - Anything inside an element whose text is a URL.
 *
 * Frontmatter never reaches this stage, so titles and descriptions are
 * untouched by construction.
 */

const NBSP = " "

/** Elements whose text content must be preserved byte-for-byte. */
const SKIPPED_ELEMENTS = new Set(["code", "pre", "kbd", "samp", "var", "script", "style"])

const DEFAULT_WORDS = ["a", "i", "o", "u", "w", "z"]

/**
 * Build the orphan-fixing regex for a set of one-letter words.
 *
 * Matches a one-letter word that is preceded by the start of the text, by
 * whitespace, or by an opening bracket/quote, and followed by one or more
 * spaces or tabs. The lookbehind keeps the preceding character out of the
 * match so overlapping runs ("w i o tym") are all rewritten.
 *
 * Newlines are deliberately excluded from the trailing character class: a line
 * break in the source is a paragraph-level concern, not a space to replace.
 */
function buildOrphanRegex(words) {
  const letters = words.join("")
  const both = `${letters}${letters.toUpperCase()}`
  return new RegExp(`(?<=^|[\\s(\\[{„“"'«])([${both}])[ \\t]+`, "g")
}

/**
 * A text node containing nothing but a URL should not be touched — some themes
 * render bare links as their href.
 */
const BARE_URL = /^\s*(?:https?:\/\/|www\.)\S+\s*$/i

/**
 * Drop caps are decided here rather than in CSS, because the rule depends on
 * how much text a page has and CSS cannot count characters.
 *
 * A page gets `class="inicjal"` on its opening paragraph when it is a rule page
 * with enough body text to carry an ornament. Short pages, the home page and
 * the changelog are excluded: a 3.2em floated capital above two lines of text
 * looks like a mistake.
 */
const DROPCAP_MIN_CHARS = 200

function collectText(node, acc = []) {
  if (node.type === "text") acc.push(node.value)
  for (const child of node.children ?? []) collectText(child, acc)
  return acc
}

/** True for a paragraph whose only content is an image. */
function isImageOnlyParagraph(node) {
  const children = (node.children ?? []).filter(
    (c) => !(c.type === "text" && c.value.trim() === ""),
  )
  return children.length > 0 && children.every((c) => c.type === "element" && c.tagName === "img")
}

/**
 * Find the first top-level paragraph that actually opens the prose.
 *
 * Callouts and other blocks are skipped, and so is a leading image-only
 * paragraph: the `wprowadzenie` letters begin with the speaker's portrait, and
 * a drop cap set on that paragraph would style nothing while the real opening
 * sentence went unmarked.
 */
function findFirstParagraph(tree) {
  for (const child of tree.children ?? []) {
    if (child.type !== "element" || child.tagName !== "p") continue
    if (isImageOnlyParagraph(child)) continue
    return child
  }
  return null
}

/**
 * Sections whose pages open with prose long enough to carry an initial: the
 * seven rule folders plus `wprowadzenie`, whose in-character letters take the
 * ornament for the opposite reason — they are documents rather than law, and
 * the theme leans into that. The home page, changelog and glossary are lists
 * and get nothing.
 */
const RULE_SECTIONS = [
  "podstawy",
  "dwor",
  "gospodarka",
  "dyplomacja",
  "intrygi",
  "militaria",
  "niesamowitosci",
  "wprowadzenie",
]

function isRulePage(slug) {
  if (typeof slug !== "string") return false
  if (!RULE_SECTIONS.some((section) => slug.startsWith(`${section}/`))) return false
  // Folder index pages are listings, not prose.
  return !slug.endsWith("/index")
}

export default function TypografiaPL(userOpts) {
  const words = userOpts?.words ?? DEFAULT_WORDS
  const orphanRegex = buildOrphanRegex(words)
  const dropCapMinChars = userOpts?.dropCapMinChars ?? DROPCAP_MIN_CHARS

  return {
    name: "TypografiaPL",

    htmlPlugins() {
      return [
        () => (tree, file) => {
          // Walked by hand rather than with unist-util-visit so the "inside a
          // code block" state is inherited by descendants. Syntax highlighting
          // wraps tokens in <span>, so checking only the immediate parent would
          // let text inside a highlighted code block through.
          const walk = (node, skipping) => {
            if (node.type === "element") {
              skipping = skipping || SKIPPED_ELEMENTS.has(node.tagName)
            }

            if (node.type === "text" && !skipping && !BARE_URL.test(node.value)) {
              node.value = node.value.replace(orphanRegex, `$1${NBSP}`)
            }

            for (const child of node.children ?? []) {
              walk(child, skipping)
            }
          }

          walk(tree, false)

          // --- drop cap ---
          const slug = file?.data?.slug
          if (!isRulePage(slug)) return

          const totalChars = collectText(tree).join("").trim().length
          if (totalChars < dropCapMinChars) return

          const firstParagraph = findFirstParagraph(tree)
          if (!firstParagraph) return

          firstParagraph.properties = firstParagraph.properties ?? {}
          const existing = firstParagraph.properties.className
          const classes = Array.isArray(existing) ? existing : existing ? [existing] : []
          if (!classes.includes("inicjal")) classes.push("inicjal")
          firstParagraph.properties.className = classes
        },
      ]
    },
  }
}
