type InfoCardGridProps = {
  cards: { title: string; items: string[] }[]
}

export function InfoCardGrid({ cards }: InfoCardGridProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">{card.title}</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {card.items.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-primary-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

