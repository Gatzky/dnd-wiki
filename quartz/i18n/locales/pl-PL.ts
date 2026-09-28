import { Translation } from "./definition"
import { plCount, ELEMENT, MINUTA, NOTATKA, ZNACZNIK } from "../../polish/plural"

/**
 * Polish interface strings for "Uczta dla Wron".
 *
 * This replaces the locale that ships with Quartz, which carried several typos
 * ("Trzyb jasny", "Niebiezpieczeństwo", "nastepnych") and treated counted nouns
 * as if Polish had only two plural forms. Every counted string now goes through
 * `plCount`; see quartz/polish/plural.ts for the three-form rule.
 *
 * Wording is deliberately specific to a rules reference: backlinks are
 * "Cytowane przez" rather than a literal "odnośniki zwrotne", because here a
 * backlink means another rule cites this one.
 */
export default {
  propertyDefaults: {
    title: "Bez tytułu",
    description: "Brak opisu",
  },
  components: {
    callout: {
      note: "Notatka",
      abstract: "Streszczenie",
      info: "Informacja",
      todo: "Do zrobienia",
      tip: "Wskazówka",
      success: "Gotowe",
      question: "Pytanie",
      warning: "Ostrzeżenie",
      failure: "Niepowodzenie",
      danger: "Niebezpieczeństwo",
      bug: "Błąd",
      example: "Przykład",
      quote: "Cytat",
    },
    backlinks: {
      title: "Cytowane przez",
      noBacklinksFound: "Żadna zasada nie cytuje tej strony",
    },
    themeToggle: {
      lightMode: "Tryb jasny",
      darkMode: "Tryb ciemny",
    },
    readerMode: {
      title: "Tryb czytania",
    },
    explorer: {
      title: "Spis zasad",
    },
    footer: {
      createdWith: "Zbudowano przy użyciu",
    },
    graph: {
      // Graph view is disabled on this site; kept for type completeness.
      title: "Graf",
    },
    recentNotes: {
      title: "Ostatnie zmiany",
      seeRemainingMore: ({ remaining }) => `Zobacz pozostałe: ${remaining} →`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Fragment strony ${targetSlug}`,
      linkToOriginal: "Przejdź do pełnej zasady",
    },
    search: {
      title: "Szukaj",
      searchBarPlaceholder: "Szukaj w zasadach…",
    },
    tableOfContents: {
      title: "Spis treści",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${plCount(minutes, MINUTA)} czytania`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Ostatnie zmiany",
      lastFewNotes: ({ count }) => `Ostatnie ${plCount(count, NOTATKA)}`,
    },
    error: {
      title: "Nie znaleziono strony",
      notFound: "Ta strona nie istnieje albo została przeniesiona.",
      home: "Strona główna",
    },
    folderContent: {
      folder: "Dział",
      itemsUnderFolder: ({ count }) => `W tym dziale: ${plCount(count, ELEMENT)}.`,
    },
    tagContent: {
      tag: "Znacznik",
      tagIndex: "Spis znaczników",
      itemsUnderTag: ({ count }) => `W tej kategorii: ${plCount(count, ELEMENT)}.`,
      showingFirst: ({ count }) => `Pokazano pierwsze ${plCount(count, ZNACZNIK)}.`,
      totalTags: ({ count }) => `Znaleziono łącznie ${plCount(count, ZNACZNIK)}.`,
    },
  },
} as const satisfies Translation
