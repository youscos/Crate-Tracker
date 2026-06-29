interface Props {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({ children, className = '', onClick, hover = false, padding = 'md' }: Props) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }
  const interactive = onClick || hover ? 'cursor-pointer hover:border-slate-500/60 hover:bg-slate-700/60 transition-all duration-200 active:scale-[0.98]' : ''

  return (
    <div
      onClick={onClick}
      className={`bg-slate-800/80 border border-slate-700/50 rounded-2xl ${paddings[padding]} ${interactive} ${className}`}
    >
      {children}
    </div>
  )
}
