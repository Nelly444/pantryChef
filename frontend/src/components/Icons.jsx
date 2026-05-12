const s = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }

export function HeartFilled({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function HeartOutline({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function Leaf({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

export function Bowl({ size = 48, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="1.5" className={className}>
      <path d="M3 11h18a9 9 0 0 1-9 9 9 9 0 0 1-9-9z" />
      <path d="M12 20v2" />
      <path d="M9 22h6" />
      <path d="M8 7c0-2 1-3 4-3s4 1 4 3" />
    </svg>
  )
}

export function Plate({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </svg>
  )
}

export function Clock({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function Users({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function Sprout({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <path d="M12 22V10" />
      <path d="M12 10C12 6 15 3 19 3c0 4-2.5 7-7 7z" />
      <path d="M12 14C12 10 9 7 5 7c0 4 2.5 7 7 7z" />
    </svg>
  )
}

export function Flame({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

export function Zap({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

export function Droplet({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  )
}

export function Wheat({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <path d="M12 22V7" />
      <path d="M9 4.6A2 2 0 0 1 11 3a2 2 0 0 1 2 2 2 2 0 0 1 2-2 2 2 0 0 1 2 1.6" />
      <path d="M6 7.6A2 2 0 0 1 8 6a2 2 0 0 1 2 2 2 2 0 0 1 2-2 2 2 0 0 1 2 1.6" />
      <path d="M6 11.6A2 2 0 0 1 8 10a2 2 0 0 1 2 2 2 2 0 0 1 2-2 2 2 0 0 1 2 1.6" />
    </svg>
  )
}

export function Check({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2.5" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function CheckCircle({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...s} strokeWidth="2" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
