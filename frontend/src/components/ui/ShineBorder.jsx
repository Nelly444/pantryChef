import { cn } from '../../lib/utils.js'

/**
 * ShineBorder — animated gradient border via background + padding trick.
 *
 * Outer div: animated radial gradient background, padding = borderWidth.
 * Inner div: solid white, slightly smaller border-radius.
 * The gradient peeks through only in the padding band → border-only glow.
 */
export default function ShineBorder({
  borderRadius = 24,
  borderWidth = 2,
  duration = 8,
  color = '#000000',
  className,
  children,
}) {
  const gradient = Array.isArray(color)
    ? `radial-gradient(transparent, transparent, ${color.join(', ')}, transparent, transparent)`
    : `radial-gradient(transparent, transparent, ${color}, transparent, transparent)`

  return (
    <div
      style={{
        borderRadius: `${borderRadius}px`,
        padding: `${borderWidth}px`,
        backgroundImage: gradient,
        backgroundSize: '300% 300%',
        animation: `shine-pulse ${duration}s infinite linear`,
      }}
      className={cn('relative', className)}
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
