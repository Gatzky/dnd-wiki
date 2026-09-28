import { h } from "preact"
import { pathToRoot, joinSegments } from "@quartz-community/utils"

/**
 * Header navigation.
 *
 * One entry per section of the rules. Each points at a folder under content/,
 * so the destination is the folder's own listing page and every rule inside it
 * is a child of that section — which is also what makes the "current section"
 * test a simple slug-prefix check.
 *
 * The folders are named in Polish on disk (content/Dwór/…). The slug patch
 * folds them to ASCII for the URL (/dwor/), while Quartz takes the folder
 * page's title from the original directory name, so the heading reads "Dwór".
 *
 * A tree explorer in a left column would be more machinery than four
 * destinations need; the explorer is kept for mobile, where it is the drawer.
 */
const SECTIONS = [
  { label: "Podstawy", slug: "podstawy" },
  { label: "Postacie", slug: "postacie" },
  { label: "Świat", slug: "swiat" },
  { label: "Zasady", slug: "zasady" },
  { label: "Przedmioty", slug: "przedmioty" },
  { label: "Scenariusze", slug: "scenariusze" },
  { label: "Słownik", slug: "slownik" },
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
/* Six sections now, with a seventh (Militaria) planned. The row has to fit
   between the wordmark and the toolbar on a full-size window, so the gap and
   the size are tuned to hold seven labels — "Niesamowitości" being the long
   one — rather than to look comfortable with four. */
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
