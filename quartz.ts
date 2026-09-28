import fs from "node:fs"
import path from "node:path"
import YAML from "yaml"

import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

/**
 * Options that YAML cannot express live here. Right now that is exactly one
 * thing: explicit font weights.
 *
 * Quartz derives the Google Fonts request from `theme.typography`, and when a
 * font is given as a bare string it falls back to per-role defaults —
 * `[400, 700]` for `header`, `[400, 600]` for `title`. The title request is
 * additionally subsetted with `&text=<pageTitle>`, so it covers only the
 * handful of glyphs in the site name.
 *
 * That combination silently breaks headings. `custom.scss` sets section
 * headings in semibold, but weight 600 was only ever requested for the
 * *title* — and only for the 14 glyphs of "Uczta dla Wron". A heading like
 * "Od czego zacząć" then drew `a c d l n o t z` from the real semibold face
 * and synthesised the rest from 400/700, so one heading rendered in two
 * visibly different fonts.
 *
 * Listing the weights explicitly makes the main request cover every glyph at
 * every weight the stylesheet actually uses.
 *
 * Colours stay in quartz.config.yaml. `loadQuartzConfig` merges overrides
 * shallowly, so passing `theme` would drop the palette — the YAML theme is
 * read here and only `typography` is replaced.
 */

const configPath = path.join(process.cwd(), "quartz.config.yaml")
const yamlConfig = YAML.parse(fs.readFileSync(configPath, "utf-8"))
const yamlTheme = yamlConfig.configuration.theme

const config = await loadQuartzConfig({
  theme: {
    ...yamlTheme,
    typography: {
      // 400 for the drop cap and page title, 600 for section headings and the
      // wordmark, 700 for bold inside a heading.
      title: { name: "Cormorant Garamond", weights: [400, 600, 700] },
      header: { name: "Cormorant Garamond", weights: [400, 600, 700] },
      body: { name: "Spectral", weights: [400, 600], includeItalic: true },
      code: { name: "IBM Plex Mono", weights: [400, 600] },
    },
  },
})

export default config
export const layout = await loadQuartzLayout()
