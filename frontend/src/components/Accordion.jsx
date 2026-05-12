export default function Accordion({ title, children, defaultOpen = false, id }) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-2xl border-2 border-olive/25 bg-cream shadow-sm transition-shadow open:shadow-md overflow-hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left marker:hidden [&::-webkit-details-marker]:hidden hover:bg-cream-dark/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest/30">
        <span className="font-display font-bold text-bark">{title}</span>
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-olive/40 bg-olive/10 text-forest transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="border-t-2 border-olive/15 px-5 py-4 text-sm leading-relaxed text-bark-light">
        {children}
      </div>
    </details>
  )
}
