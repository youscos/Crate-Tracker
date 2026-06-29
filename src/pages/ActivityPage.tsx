import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, User, Clock, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react'
import { useCratesStore } from '@/stores/cratesStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Movement } from '@/types/database'
import { STATUS_LABELS } from '@/types/database'

function groupByDate(movements: Movement[]) {
  const groups: Record<string, Movement[]> = {}
  for (const m of movements) {
    const date = new Date(m.created_at)
    let key: string
    if (isToday(date)) key = "Aujourd'hui"
    else if (isYesterday(date)) key = 'Hier'
    else key = format(date, 'EEEE d MMMM', { locale: fr })

    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return groups
}

export default function ActivityPage() {
  const navigate = useNavigate()
  const { movements, fetchMovements } = useCratesStore()
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    await fetchMovements(100)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const groups = groupByDate(movements)

  return (
    <div className="p-4 pt-5 flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Journal</h1>
          <p className="text-slate-400 text-sm">Tous les mouvements de caisses</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          onClick={refresh}
        >
          Actualiser
        </Button>
      </div>

      {movements.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Aucune activité</p>
          <p className="text-slate-600 text-sm mt-1">Les mouvements de caisses apparaîtront ici</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mb-8">
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{date}</span>
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-600">{items.length} action{items.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex flex-col gap-2">
                {items.map(m => (
                  <ActivityRow key={m.id} movement={m} onNavigate={() => m.crate_id && navigate(`/crate/${m.crate_id}`)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityRow({ movement: m, onNavigate }: { movement: Movement; onNavigate: () => void }) {
  const isCreation = !m.old_floor
  const isMove = m.old_floor && m.old_floor !== m.new_floor
  const isStatusChange = m.old_status && m.old_status !== m.new_status

  return (
    <Card hover onClick={onNavigate} padding="sm">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          isCreation ? 'bg-emerald-500/10' : isMove ? 'bg-amber-500/10' : 'bg-blue-500/10'
        }`}>
          <TrendingUp className={`w-4 h-4 ${isCreation ? 'text-emerald-400' : isMove ? 'text-amber-400' : 'text-blue-400'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">
              {(m.crate as { crate_number?: string })?.crate_number || 'Caisse'}
            </span>
            {isCreation && <span className="text-emerald-400 text-xs px-2 py-0.5 bg-emerald-400/10 rounded-full">Créée</span>}
            {isMove && (
              <span className="text-amber-400 text-xs">Ét. {m.old_floor} → {m.new_floor}</span>
            )}
            {isStatusChange && !isCreation && (
              <span className="text-blue-400 text-xs">{STATUS_LABELS[m.new_status]}</span>
            )}
          </div>

          {m.old_location && m.old_location !== m.new_location && (
            <p className="text-slate-500 text-xs mt-0.5 truncate">
              {m.old_location} → {m.new_location}
            </p>
          )}

          {m.notes && (
            <p className="text-slate-400 text-xs mt-0.5 italic truncate">"{m.notes}"</p>
          )}

          <div className="flex items-center gap-2 mt-1">
            <User className="w-3 h-3 text-slate-600" />
            <span className="text-slate-500 text-xs">{m.user_name}</span>
            <span className="text-slate-700">·</span>
            <Clock className="w-3 h-3 text-slate-600" />
            <span className="text-slate-500 text-xs">
              {formatDistanceToNow(new Date(m.created_at), { locale: fr, addSuffix: true })}
            </span>
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-700 shrink-0 mt-1" />
      </div>
    </Card>
  )
}
