export default function Footer() {
  return (
    <footer className="mt-auto border-t border-olive/20 bg-bark">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

        <div className="grid gap-8 sm:grid-cols-2">

          <div>
            <p className="font-display text-lg font-bold italic text-olive-light">PantryChef</p>
            <p className="mt-2 text-sm leading-relaxed text-cream/50">
              Good food starts with what is already in your kitchen. No grocery runs, no waste.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-olive">Built with</p>
            <ul className="space-y-2 text-sm text-cream/60">
              <li>React + Vite</li>
              <li>Tailwind CSS</li>
              <li>FastAPI (Python)</li>
              <li>Spoonacular API</li>
            </ul>
          </div>

        </div>

        <div className="mt-8 border-t border-olive/15 pt-6 text-center text-xs text-cream/25">
          &copy; {new Date().getFullYear()} PantryChef.
        </div>

      </div>
    </footer>
  )
}
