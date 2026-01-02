import Image from 'next/image'
import Link from 'next/link'
import LaserFlow from '@/components/ui/LaserFlow'

type Cta = { href: string; label: string }

type HeroProps = {
  eyebrow?: string
  title: string
  subtitle: string
  badges?: string[]
  primaryCta: Cta
  secondaryCta?: Cta
  illustrationSrc?: string
  illustrationAlt?: string
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  badges = [],
  primaryCta,
  secondaryCta,
  illustrationSrc,
  illustrationAlt = '',
}: HeroProps) {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LaserFlow />
      </div>
      <div className="relative z-10 grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7 space-y-6">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">{eyebrow}</p>
          ) : null}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">{title}</h1>
          <p className="text-lg text-gray-600">{subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={primaryCta.href}
              className="rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              {primaryCta.label}
            </Link>
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="rounded-md border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-primary-200 hover:text-primary-700"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
          {badges.length ? (
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-primary-700"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {illustrationSrc ? (
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
              <div className="relative h-56 w-full overflow-hidden rounded-xl bg-gray-100">
                <Image src={illustrationSrc} alt={illustrationAlt} fill priority className="object-cover" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

