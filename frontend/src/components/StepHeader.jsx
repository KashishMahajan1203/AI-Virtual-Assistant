import React from 'react'

// "Step x of y" heading used by the two customise pages
function StepHeader({ step, total, title, description }) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">Step {step} of {total}</span>
        <div className="flex gap-1.5" aria-hidden="true">
          {Array.from({ length: total }, (_, index) => (
            <span key={index} className={`h-1.5 w-8 rounded-full ${index < step ? 'bg-accent' : 'bg-line'}`} />
          ))}
        </div>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-muted sm:text-base">{description}</p>
    </div>
  )
}

export default StepHeader
