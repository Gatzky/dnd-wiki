#!/usr/bin/env node
/**
 * WCAG 2.1 contrast audit for the "Archiwum Cytadeli" palette.
 *
 * Parchment palettes routinely fail the 4.5:1 body-text threshold because the
 * background is far from white, so the numbers are measured here rather than
 * assumed. Run with `npm run check-contrast`.
 *
 * Thresholds: 4.5:1 for body text, 3:1 for large text (>=24px, or >=18.66px
 * bold) and for UI borders that carry meaning.
 */

import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import YAML from "yaml"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

function parseColor(input) {
  const s = String(input).trim()

  const rgba = s.match(/^rgba?\(([^)]+)\)$/i)
  if (rgba) {
    const parts = rgba[1].split(",").map((p) => parseFloat(p.trim()))
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
  }

  const hex = s.replace(/^#/, "")
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
    a: full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
  }
}

/** Composite a possibly-translucent colour over an opaque backdrop. */
function flatten(fg, bg) {
  if (fg.a >= 1) return fg
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  }
}

function relativeLuminance({ r, g, b }) {
  const channel = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(fgRaw, bgRaw) {
  const bg = parseColor(bgRaw)
  const fg = flatten(parseColor(fgRaw), bg)
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

const config = YAML.parse(await readFile(join(repoRoot, "quartz.config.yaml"), "utf8"))
const colors = config.configuration.theme.colors

/**
 * The marginalia ink is not part of the configured palette. The palette's
 * `gray` reads as the natural choice for a muted margin note, but it sits at
 * roughly 2.4:1 on parchment — fine for a border, far below the 4.5:1 floor for
 * text. These tones are the muted-but-legible substitutes used by
 * `.toc`/`.backlinks` in custom.scss, and they are audited here so they cannot
 * drift.
 */
const MARGINALIA_INK = { lightMode: "#5C5145", darkMode: "#A99B82" }

/**
 * The leaf the article sits on — anything set on it has to be measured against
 * the leaf, not against `light`.
 *
 * In light mode this is `--karta` itself, an ivory sheet lighter than the
 * parchment around it. In dark mode the leaf is painted in the page tone
 * instead (see `KARTA_FILL`); `--karta` survives there only as the fill of
 * the framed portrait, which carries no text.
 */
const KARTA = { lightMode: "#F6F1E6", darkMode: "#16130F" }

/**
 * Per-section accents (`--sekcja-akcent`). They colour the emblem and the
 * ruled marks, which are ornament — but also the active nav entry and the
 * catalogue's Roman numerals, which are small text and therefore owe 4.5:1.
 * Every one of them clears it only at full strength: an earlier draft faded
 * the numerals to 0.8 alpha and four of the seven dropped under the gate.
 */
const AKCENTY = {
  Podstawy: { lightMode: "#6B6250", darkMode: "#B3A88E" },
  Dwór: { lightMode: "#7A4A3A", darkMode: "#C98D73" },
  Gospodarka: { lightMode: "#7D6320", darkMode: "#C9A94F" },
  Dyplomacja: { lightMode: "#46586B", darkMode: "#8FA6BD" },
  Intrygi: { lightMode: "#4A4553", darkMode: "#A79BB5" },
  Militaria: { lightMode: "#6D2F2F", darkMode: "#CD8072" },
  Niesamowitości: { lightMode: "#3F5545", darkMode: "#8FB096" },
}

/**
 * The crows watermark (`--kruki`), composited onto the page tone.
 *
 * The plate is masked in at low opacity behind everything, and the margin
 * column has no ground of its own — so where a bird passes behind it, the
 * marginalia is read against page + crow rather than against page alone. The
 * value below is the worst case: a fully inked pixel of the plate.
 *
 * The row below measures the ink at full strength. The binding case is
 * narrower: table-of-contents entries render at 0.9 alpha on top of this
 * ground, and that combination is what caps `--kruki-opacity` at 0.08 in light
 * mode — 4.57:1 there, against 4.15:1 at the 0.16 first tried.
 */
const KRUKI = {
  lightMode: { over: "#EFE7D8", ink: "#6b5a45", alpha: 0.08 },
  darkMode: { over: "#16130F", ink: "#c8b89a", alpha: 0.1 },
}

const KRUKI_GROUND = Object.fromEntries(
  Object.entries(KRUKI).map(([mode, { over, ink, alpha }]) => {
    const bg = parseColor(over)
    const fg = parseColor(ink)
    const mix = (k) => Math.round(alpha * fg[k] + (1 - alpha) * bg[k])
    return [mode, `rgb(${mix("r")}, ${mix("g")}, ${mix("b")})`]
  }),
)

/**
 * The leaf as actually painted: `--karta-tlo`, which is held off full opacity
 * so the crows show through it. The ground underneath is the worst case above
 * — page tone plus a fully inked bird — so this is the darkest (light mode) or
 * lightest (dark mode) the reading surface ever gets.
 *
 * This is what the reader-mode toggle removes: with it on the leaf goes
 * opaque — `--karta` in light mode, the page tone in dark — and the surface
 * is the solid `KARTA` measured separately.
 */
const KARTA_ALPHA = { lightMode: 0.62, darkMode: 0.86 }

/**
 * The tone the leaf is actually painted in, which is not `KARTA` in dark mode.
 *
 * Light mode veils the ivory `--karta` over the parchment, and the leaf is
 * meant to read as a lighter sheet. Dark mode veils the *page tone over
 * itself*: `--karta` sits only five RGB steps above `--light`, and that was
 * enough to draw the reading column as a paler rectangle over the crows. Same
 * tone at 86% is the same tone, so the leaf and its surround now match exactly.
 */
const KARTA_FILL = { lightMode: "#F6F1E6", darkMode: "#16130F" }

const KARTA_NAD_KRUKAMI = Object.fromEntries(
  Object.keys(KARTA).map((mode) => {
    const leaf = parseColor(KARTA_FILL[mode])
    const under = parseColor(KRUKI_GROUND[mode])
    const a = KARTA_ALPHA[mode]
    const mix = (k) => Math.round(a * leaf[k] + (1 - a) * under[k])
    return [mode, `rgb(${mix("r")}, ${mix("g")}, ${mix("b")})`]
  }),
)

/** [label, foreground, background key, threshold, note] — threshold null = informational */
const checks = [
  ["body text on page", "darkgray", "light", 4.5, "the main long-form reading surface"],
  ["headings on page", "dark", "light", 4.5, ""],
  ["links on page", "secondary", "light", 4.5, "rubric red, inline in body text"],
  ["body text on highlight", "darkgray", "textHighlight", 4.5, "==marked== text"],
  ["marginalia text", MARGINALIA_INK, "light", 4.5, "TOC and 'Cytowane przez' panels"],
  ["callout label", "secondary", "light", 4.5, "uppercase mono label on wax-seal blocks"],
  // Decorative only. WCAG's 3:1 non-text threshold covers controls that carry
  // meaning, not ornamental rules, so these are reported without a verdict.
  ["ornament / heavy border", "gray", "light", null, "decorative rules only, never text"],
  ["hairline", "lightgray", "light", null, "decorative rules only, never text"],
  ["bronze ornament", "tertiary", "light", null, "ornament and hover only, never body text"],
  // The reading surface moved onto the ivory leaf; the page tone is now only
  // the surround, so the text checks that matter are against the leaf.
  [
    "body text on leaf",
    "darkgray",
    KARTA,
    4.5,
    "the solid leaf the article sits on, as reader mode paints it",
  ],
  ["headings on leaf", "dark", KARTA, 4.5, ""],
  ["links on leaf", "secondary", KARTA, 4.5, "rubric red, inline in body text"],
  ["marginalia on leaf", MARGINALIA_INK, KARTA, 4.5, "drop caps and stamped labels"],
  ...Object.entries(AKCENTY).map(([name, tone]) => [
    `akcent — ${name}`,
    tone,
    KARTA,
    4.5,
    "active nav and catalogue numerals; text, so no fading below this",
  ]),
  // The watermark has no ground of its own to sit on, so it is the ground.
  [
    "marginalia over crows",
    MARGINALIA_INK,
    KRUKI_GROUND,
    4.5,
    "margin column where a bird passes behind it — caps --kruki-opacity",
  ],
  // The reading surface as it is actually painted: a translucent leaf over a
  // fully inked bird. These four are what cap --karta-tlo.
  ["body text on veiled leaf", "darkgray", KARTA_NAD_KRUKAMI, 4.5, "the leaf with crows behind it"],
  ["headings on veiled leaf", "dark", KARTA_NAD_KRUKAMI, 4.5, ""],
  [
    "links on veiled leaf",
    "secondary",
    KARTA_NAD_KRUKAMI,
    4.5,
    "the tightest pair on the page — this is what caps --karta-tlo in dark mode",
  ],
  [
    "marginalia on veiled leaf",
    MARGINALIA_INK,
    KARTA_NAD_KRUKAMI,
    4.5,
    "drop caps and stamped labels",
  ],
]

let failures = 0

for (const mode of ["lightMode", "darkMode"]) {
  console.log(
    `\n=== ${mode === "lightMode" ? "Light mode (parchment)" : "Dark mode (candlelit vault)"} ===\n`,
  )
  for (const [label, fgSpec, bgKey, threshold, note] of checks) {
    // A foreground is either a palette key or a per-mode literal map.
    const fg = typeof fgSpec === "object" ? fgSpec[mode] : colors[mode][fgSpec]
    const bg = typeof bgKey === "object" ? bgKey[mode] : colors[mode][bgKey]
    const ratio = contrast(fg, bg)

    let verdict
    if (threshold === null) {
      verdict = " info "
    } else if (ratio >= threshold) {
      verdict = "  ok  "
    } else {
      verdict = " FAIL "
      failures++
    }

    console.log(
      `[${verdict}] ${label.padEnd(26)} ${String(fg).padEnd(22)} on ${String(bg).padEnd(10)} ` +
        `${ratio.toFixed(2)}:1  ${threshold === null ? "(decorative)" : `(min ${threshold})`}` +
        `${note ? `  — ${note}` : ""}`,
    )
  }
}

console.log(
  failures === 0 ? "\nAll contrast thresholds met.\n" : `\n${failures} contrast check(s) FAILED.\n`,
)

process.exit(failures === 0 ? 0 : 1)
