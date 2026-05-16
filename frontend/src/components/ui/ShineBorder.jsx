import { cn } from '../../lib/utils.js'

export default function ShineBorder({
  borderRadius = 24,
  borderWidth = 2,
  duration = 8,
  color = '#000000',
  className,
  children,
}) {
  const [c1, c2, c3] = Array.isArray(color)
    ? [color[0], color[1] ?? color[0], color[2] ?? color[1] ?? color[0]]
    : [color, color, color]

  return (
    <div
      className={cn('shine-border relative', className)}
      style={{
        '--shine-c1': c1,
        '--shine-c2': c2,
        '--shine-c3': c3,
        '--shine-duration': `${duration}s`,
        borderRadius: `${borderRadius}px`,
        padding: `${borderWidth}px`,
      }}
    >
      <div
        style={{ borderRadius: `${borderRadius - borderWidth}px` }}
        className="relative w-full overflow-hidden bg-white"
      >
        {children}
      </div>
    </div>
  )
}
