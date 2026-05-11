const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || 'http://127.0.0.1:8000'
const docsHref = `${apiOrigin}/docs`

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-emerald-900/30 bg-gradient-to-b from-emerald-950 to-[#022c1f] text-emerald-100/85">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-emerald-50">PantryChef</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-100/75">
            Match your pantry to one strong recipe, understand what you are missing, and see nutrition scaled to your servings.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <a className="text-emerald-100/80 hover:text-white" href="#cook">
            Cook
          </a>
          <a className="text-emerald-100/80 hover:text-white" href="#result">
            Result
          </a>
          <a className="text-emerald-100/80 hover:text-white" href={docsHref} target="_blank" rel="noreferrer">
            API docs
          </a>
        </div>
      </div>
      <div className="border-t border-emerald-900/40 py-4 text-center text-xs text-emerald-200/55">
        © {new Date().getFullYear()} PantryChef · Local development build
      </div>
    </footer>
  )
}
