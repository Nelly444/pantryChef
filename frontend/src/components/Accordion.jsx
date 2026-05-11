export default function Accordion({ title, children, defaultOpen = false, id }) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-xl border border-emerald-200/90 bg-white/90 shadow-sm ring-1 ring-emerald-950/[0.03] backdrop-blur-sm transition-shadow open:shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold text-emerald-950 marker:hidden [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-700 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="stroke-current" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-emerald-100/90 px-4 py-4 text-sm leading-relaxed text-emerald-950/85">{children}</div>
    </details>
  )
}
