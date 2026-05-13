export default function EmptyState({ Icon, title, message, action, onAction }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-olive/30 bg-white/60 px-8 py-16 text-center">
      {Icon && (
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-olive/20 bg-cream text-bark-light/25">
          <Icon size={40} />
        </div>
      )}
      <p className="font-display text-xl font-bold italic text-bark">{title}</p>
      {message && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-bark-light/60">{message}</p>
      )}
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-xl bg-forest px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
        >
          {action}
        </button>
      )}
    </div>
  )
}
