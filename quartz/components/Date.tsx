import { ValidLocale } from "../i18n"
import { QuartzPluginData } from "../plugins/vfile"
import { formatPolishDate } from "../polish/date"

interface Props {
  date: Date
  locale?: ValidLocale
}

export type ValidDateType = keyof Required<QuartzPluginData>["dates"]

export function getDate(data: QuartzPluginData): Date | undefined {
  if (!data.defaultDateType) {
    throw new Error(
      `Field 'defaultDateType' was not set. Ensure the CreatedModifiedDate plugin is configured with a 'defaultDateType' option. See https://quartz.jzhao.xyz/plugins/CreatedModifiedDate for more details.`,
    )
  }
  return data.dates?.[data.defaultDateType]
}

export function formatDate(d: Date, locale: ValidLocale = "en-US"): string {
  // Polish gets the house format `27 lipca 2026 r.` rather than the stock
  // `27 lip 2026`. See quartz/polish/date.ts.
  if (locale === "pl-PL") {
    return formatPolishDate(d)
  }

  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

export function Date({ date, locale }: Props) {
  return <time datetime={date.toISOString()}>{formatDate(date, locale)}</time>
}
