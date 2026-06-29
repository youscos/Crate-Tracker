import { useNavigate } from 'react-router-dom'
import { QrCode, Search, TrendingUp, Package, ArrowRight, MapPin, Clock } from 'lucide-react'
import { useCratesStore } from '@/stores/cratesStore'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { profile, canEdit } = useAuthStore()
  const { crates, movements } = useCratesStore()

  const stats = {
    total: crates.length,
    stored: crates.filter(c => c.status === 'stored').length,
    in_use: crates.filter(c => c.status === 'in_use').length,
    maintenance: crates.filter(c => c.status === 'maintenance').length,
    missing: crates.filter(c => c.status === 'missing').length,
  }

  const recentCrates = [...crates].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5)
  const recentMovements = movements.slice(0, 5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="p-4 pt-5 flex flex-col gap-5 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black text-white">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'Opérateur'} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Vue d'ensemble du chantier</p>
      </div>

      {/* Quick actions */}
      {canEdit() && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="xl"
            onClick={() => navigate('/scan')}
            icon={<QrCode className="w-6 h-6" />}
            className="flex-col h-24 rounded-2xl text-base"
          >
            Scanner
          </Button>
          <Button
            size="xl"
            variant="secondary"
            onClick={() => navigate('/search')}
            icon={<Search className="w-6 h-6" />}
            className="flex-col h-24 rounded-2xl text-base"
          >
            Rechercher
          </Button>
        </div>
      )}

      {/* Stats grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Statistiques</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total caisses</p>
                <p className="text-4xl font-black text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Package className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 bg-emerald-400/10 rounded-xl p-2 text-center">
                <p className="text-emerald-400 font-bold text-lg">{stats.stored}</p>
                <p className="text-emerald-400/70 text-xs">Stockées</p>
              </div>
              <div className="flex-1 bg-amber-400/10 rounded-xl p-2 text-center">
                <p className="text-amber-400 font-bold text-lg">{stats.in_use}</p>
                <p className="text-amber-400/70 text-xs">En usage</p>
              </div>
              <div className="flex-1 bg-red-400/10 rounded-xl p-2 text-center">
                <p className="text-red-400 font-bold text-lg">{stats.missing + stats.maintenance}</p>
                <p className="text-red-400/70 text-xs">Problèmes</p>
              </div>
            </div>
          </Card>

          {/* Floor distribution */}
          {[...new Set(crates.map(c => c.floor))].sort((a, b) => a - b).slice(0, 4).map(floor => {
            const count = crates.filter(c => c.floor === floor).length
            const pct = Math.round((count / stats.total) * 100)
            return (
              <Card key={floor} padding="sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-medium">Étage {floor}</span>
                  <span className="text-white font-bold text-sm">{count}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent crates */}
      {recentCrates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Dernières caisses</h2>
            <button onClick={() => navigate('/search')} className="text-amber-400 text-xs flex items-center gap-1 hover:text-amber-300">
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recentCrates.map(crate => (
              <Card key={crate.id} hover onClick={() => navigate(`/crate/${crate.id}`)} padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm truncate">{crate.crate_number}</p>
                      <StatusBadge status={crate.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />Ét. {crate.floor} · {crate.location}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent movements */}
      {recentMovements.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Derniers mouvements</h2>
            <button onClick={() => navigate('/activity')} className="text-amber-400 text-xs flex items-center gap-1 hover:text-amber-300">
              Journal <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {recentMovements.map(m => (
              <div key={m.id} className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    {(m.crate as { crate_number?: string })?.crate_number || 'Caisse'}
                    {m.old_floor && m.old_floor !== m.new_floor && (
                      <span className="text-slate-400 font-normal"> · Ét. {m.old_floor} → {m.new_floor}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-500 text-xs">{m.user_name}</span>
                    <span className="text-slate-600 text-xs">·</span>
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(m.created_at), { locale: fr, addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
