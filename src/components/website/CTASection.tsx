type CTA = { href: string; label: string }

type CTASectionProps = {
  title: string
  subtitle?: string
  primary: CTA
  secondary?: CTA
}

export function CTASection({ title, subtitle, primary, secondary }: CTASectionProps) {
  return (
    <section className="bg-primary-700 py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <h3 className="text-2xl font-bold">{title}</h3>
          {subtitle ? <p className="text-sm text-primary-100">{subtitle}</p> : null}
        </div>
        <div className="flex gap-3">
          <a
            href={primary.href}
            className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50"
          >
            {primary.label}
          </a>
          {secondary ? (
            <a
              href={secondary.href}
              className="rounded-md border border-primary-200 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-600"
            >
              {secondary.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}

