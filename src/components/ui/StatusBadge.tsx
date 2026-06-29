import type { CrateStatus } from '@/types/database'
import { STATUS_LABELS, STATUS_COLORS } from '@/types/database'

interface Props {
  status: CrateStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function StatusBadge({ status, size = 'md', className = '' }: Props) {
  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-base px-4 py-1.5' }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizes[size]} ${STATUS_COLORS[status]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  )
}
