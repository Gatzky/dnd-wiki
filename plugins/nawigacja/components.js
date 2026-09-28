import { h } from "preact"
import { pathToRoot, joinSegments } from "@quartz-community/utils"

/**
 * Header navigation.
 *
 * Each category points at a folder under content/, making every page inside
 * that folder a child of the category.
 */
const SECTIONS = [
  { label: "Species", slug: "species" },
  { label: "Classes", slug: "classes" },
  { label: "Feats", slug: "feats" },
  { label: "Backgrounds", slug: "backgrounds" },
]

const Nawigacja = ({ fileData, displayClass }) => {
  const base = pathToRoot(fileData.slug)
  const slug = fileData.slug ?? ""

  return h(
    "nav",
    {
      class: ["site-nav", displayClass].filter(Boolean).join(" "),
      "aria-label": "Nawigacja główna",
    },
    SECTIONS.map(({ label, slug: section }) => {
      // Trailing slash: these are folder pages, served as <section>/index.html.
      const href = joinSegments(base, section) + "/"
      const isCurrent = slug === section || slug.startsWith(`${section}/`)
      return h(
        "a",
        {
          href,
          class: "site-nav-link",
          // aria-current marks the section for assistive tech; the visual
          // treatment is the underline in custom.scss.
          "aria-current": isCurrent ? "page" : undefined,
        },
        label,
      )
    }),
  )
}

Nawigacja.css = `
/* Keep the category row compact between the wordmark and toolbar. */
.site-nav {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
}

.site-nav-link {
  font-family: var(--headerFont);
  font-size: 0.95rem;
  color: var(--dark);
  background-color: transparent;
  text-decoration: none;
  white-space: nowrap;
  padding-bottom: 2px;
  border-bottom: 1px solid transparent;
}

.site-nav-link:hover {
  color: var(--secondary);
  border-bottom-color: var(--secondary);
}

.site-nav-link[aria-current="page"] {
  color: var(--secondary);
  border-bottom-color: var(--gray);
}
`

export const Nawigacja_default = () => Nawigacja
export { Nawigacja_default as Nawigacja }
