import { cn } from '../../lib/utils.js'

/**
 * ShineBorder — a bright arc of light that rotates clockwise around the border.
 *
 * Technique:
 *   Outer div: conic-gradient background + padding = borderWidth px.
 *   Inner div: solid white, so the gradient is only visible in the padding band.
 *   @property --shine-angle lets the browser interpolate the angle smoothly,
 *   making the conic-gradient appear to spin. Without @property, custom
 *   property animation would snap instead of sweep.
 */
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
