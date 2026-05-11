export default function Footer() {
  return (
    <footer className="mt-auto border-t border-green-200 bg-green-900 text-green-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            🌿 PantryChef
          </p>
          <p className="mt-1 text-sm text-green-200/70">
            Cook great food from what you already have.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <a className="text-green-200/70 transition hover:text-white" href="#cook">Pantry</a>
          <a className="text-green-200/70 transition hover:text-white" href="#result">Result</a>
          <a className="text-green-200/70 transition hover:text-white" href="#matching">How it works</a>
        </div>
      </div>
      <div className="border-t border-green-800 py-3 text-center text-xs text-green-300/40">
        © {new Date().getFullYear()} PantryChef
      </div>
    </footer>
  )
}