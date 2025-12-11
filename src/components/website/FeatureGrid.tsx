type FeatureCard = { title: string; body: string; tag?: string }

export function FeatureGrid({ items }: { items: FeatureCard[] }) {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((feature) => (
        <div key={feature.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
            {feature.tag ? <span className="text-xs font-semibold text-primary-700">{feature.tag}</span> : null}
          </div>
          <p className="mt-3 text-sm text-gray-600">{feature.body}</p>
        </div>
      ))}
    </div>
  )
}

