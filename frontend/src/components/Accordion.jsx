export default function Accordion({ title, children, defaultOpen = false, id }) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-xl border border-green-200 bg-white shadow-sm transition-shadow open:shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-green-950 marker:hidden [&::-webkit-details-marker]:hidden hover:bg-green-50/60 transition-colors">
        <span>{title}</span>
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-green-200 bg-green-50 text-green-600 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-green-100 px-4 py-4 text-sm leading-relaxed text-green-950/80">
        {children}
      </div>
    </details>
  )
}