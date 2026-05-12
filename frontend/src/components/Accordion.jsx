export default function Accordion({ title, children, defaultOpen = false, id }) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-2xl border-2 border-[#8a9a6a]/25 bg-[#f4f0e6] shadow-sm transition-shadow open:shadow-md overflow-hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left marker:hidden [&::-webkit-details-marker]:hidden hover:bg-[#e2ead4]/60 transition-colors">
        <span style={{fontFamily:'"Playfair Display",Georgia,serif'}} className="font-bold text-[#2c1f0e]">{title}</span>
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[#8a9a6a]/40 bg-[#8a9a6a]/10 text-[#3d5c2e] transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="border-t-2 border-[#8a9a6a]/15 px-5 py-4 text-sm leading-relaxed text-[#5c3d1e]">
        {children}
      </div>
    </details>
  )
}