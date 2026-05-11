const apiOrigin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || 'http://127.0.0.1:8000'
const docsHref = `${apiOrigin}/docs`

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-green-200 bg-green-900 text-green-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <span>🌿</span> PantryChef
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-green-200/80">
            Match your pantry to one great recipe, see what you're missing, and get nutrition scaled to your servings.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <a className="text-green-200/80 transition hover:text-white" href="#cook">
            Cook
          </a>
          <a className="text-green-200/80 transition hover:text-white" href="#result">
            Result
          </a>
          <a className="text-green-200/80 transition hover:text-white" href={docsHref} target="_blank" rel="noreferrer">
            API docs
          </a>
        </div>
      </div>
      <div className="border-t border-green-800 py-4 text-center text-xs text-green-300/50">
        © {new Date().getFullYear()} PantryChef · Local development build
      </div>
    </footer>
  )
}