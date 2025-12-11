type Stat = { label: string; value: string }

export function StatsGrid({ items }: { items: Stat[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="mt-2 text-base font-semibold text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

