export default function Footer() {
  return (
    <footer className="mt-auto border-t-2 border-[#d4a853]/30 bg-[#2c1f0e]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p style={{fontFamily:'"Playfair Display",Georgia,serif'}} className="text-lg font-bold italic text-[#d4a853]">
            🌿 PantryChef
          </p>
          <p className="mt-1 text-sm text-[#faf7f2]/50">
            Cook great food from what you already have.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <a className="text-[#a8c49a] transition hover:text-white" href="#cook">Pantry</a>
          <a className="text-[#a8c49a] transition hover:text-white" href="#result">Result</a>
        </div>
      </div>
      <div className="border-t border-[#d4a853]/10 py-3 text-center text-xs text-[#faf7f2]/25">
        © {new Date().getFullYear()} PantryChef
      </div>
    </footer>
  )
}