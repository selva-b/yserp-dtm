type Plan = {
  name: string
  price: string
  description?: string
  features: string[]
  highlight?: boolean
}

export function PricingPlans({ plans }: { plans: Plan[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`flex h-full flex-col rounded-2xl border ${
            plan.highlight ? 'border-primary-200 shadow-lg shadow-primary-100' : 'border-gray-200'
          } bg-white p-6`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
            {plan.highlight ? (
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">Recommended</span>
            ) : null}
          </div>
          <div className="mt-3 text-sm text-gray-600">{plan.price}</div>
          {plan.description ? <p className="mt-2 text-sm text-gray-600">{plan.description}</p> : null}
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-0.5 text-primary-600">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <a
            href="/auth/signup"
            className="mt-auto inline-flex w-full justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            Book a demo
          </a>
        </div>
      ))}
    </div>
  )
}

