type SectionHeaderProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function SectionHeader({ eyebrow, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-semibold text-primary-600">{eyebrow}</p> : null}
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-2 text-base text-gray-600">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

