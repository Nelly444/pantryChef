import { useState, useEffect } from 'react'
import { CheckCircle } from './Icons.jsx'

export default function CookingMode({ steps, onClose }) {
  const [step, setStep] = useState(0)
  const total = steps.length

  // Close on ESC — standard keyboard behaviour for modal dialogs
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  if (!total) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cooking mode"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-bark/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-olive/40 bg-cream p-6 shadow-2xl">
        <button
          type="button"
          aria-label="Close cooking mode"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-bark/10 text-bark hover:bg-bark/20"
        >
          ✕
        </button>

        {/* Progress dots */}
        <div className="mb-6 flex flex-wrap justify-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setStep(i)}
              className={`h-2.5 rounded-full transition-all ${i <= step ? 'bg-forest' : 'bg-olive-light'}`}
              style={{ width: i === step ? '2rem' : '0.625rem' }}
            />
          ))}
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-forest">
          Step {step + 1} of {total}
        </p>
        <p
          key={step}
          className="step-in font-display min-h-[80px] text-xl font-bold leading-snug text-bark"
        >
          {steps[step]}
        </p>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
            className="flex-1 rounded-xl border-2 border-olive/40 bg-transparent py-3 text-sm font-bold text-bark-light transition hover:bg-cream-dark disabled:opacity-30"
          >
            ← Back
          </button>
          {step < total - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex-1 rounded-xl bg-forest py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-sage-dark py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              <CheckCircle size={16} className="inline mr-1.5" /> Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
