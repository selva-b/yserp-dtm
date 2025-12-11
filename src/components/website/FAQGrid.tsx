type FAQ = { q: string; a: string }

export function FAQGrid({ items }: { items: FAQ[] }) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.q} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">{item.q}</h3>
          <p className="mt-2 text-sm text-gray-600">{item.a}</p>
        </div>
      ))}
    </div>
  )
}

