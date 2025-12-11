import Image from 'next/image'

type Step = { title: string; desc: string }

type WorkflowStepsProps = {
  steps: Step[]
  illustrationSrc?: string
  illustrationAlt?: string
}

export function WorkflowSteps({ steps, illustrationSrc, illustrationAlt = '' }: WorkflowStepsProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <p className="text-sm font-semibold text-primary-600">How it works</p>
        <h2 className="text-3xl font-bold text-gray-900">Built for control, collaboration, and compliance.</h2>
        <p className="mt-2 text-base text-gray-600">Keep execution and governance aligned with consistent workflows and logged actions.</p>
      </div>
      <div className="lg:col-span-2 grid gap-4">
        {illustrationSrc ? (
          <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gray-100">
            <Image src={illustrationSrc} alt={illustrationAlt} fill className="object-cover" />
          </div>
        ) : null}
        {steps.map((step) => (
          <div key={step.title} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-700">
              {step.title.split(')')[0]}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

