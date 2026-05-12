export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#8a9a6a]/20 bg-[#2c1f0e]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

        <div className="grid gap-8 sm:grid-cols-3">

          {/* Brand */}
          <div>
            <p style={{fontFamily:'"Playfair Display",Georgia,serif'}} className="text-lg font-bold italic text-[#d8e4c0]">
              PantryChef
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#f4f0e6]/50">
              Good food starts with what is already in your kitchen. No grocery runs, no waste.
            </p>
          </div>

          {/* Navigate */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8a9a6a]">Navigate</p>
            <ul className="space-y-2 text-sm">
              <li><a className="text-[#f4f0e6]/60 transition hover:text-[#d8e4c0]" href="#cook">My Pantry</a></li>
              <li><a className="text-[#f4f0e6]/60 transition hover:text-[#d8e4c0]" href="#result">Recipe Result</a></li>
              <li><a className="text-[#f4f0e6]/60 transition hover:text-[#d8e4c0]" href="#top">Back to top</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#8a9a6a]">Built with</p>
            <ul className="space-y-2 text-sm text-[#f4f0e6]/60">
              <li>React + Vite</li>
              <li>Tailwind CSS</li>
              <li>FastAPI (Python)</li>
              <li>Spoonacular API</li>
            </ul>
          </div>

        </div>

        <div className="mt-8 border-t border-[#8a9a6a]/15 pt-6 text-center text-xs text-[#f4f0e6]/25">
          &copy; {new Date().getFullYear()} PantryChef. A portfolio project.
        </div>

      </div>
    </footer>
  )
}
