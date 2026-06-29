import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Edit, QrCode, MapPin, Calendar, User, Clock, TrendingUp } from 'lucide-react'
import { useCratesStore } from '@/stores/cratesStore'
import { useAuthStore } from '@/stores/authStore'
import type { Crate, Movement } from '@/types/database'
import { PANEL_TYPES, STATUS_LABELS } from '@/types/database'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'
import CrateForm from '@/components/crate/CrateForm'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function CrateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getCrateById, getMovementsForCrate } = useCratesStore()
  const { canEdit } = useAuthStore()

  const [crate, setCrate] = useState<Crate | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      const c = await getCrateById(id)
      setCrate(c)
      if (c) {
        const m = await getMovementsForCrate(id)
        setMovements(m)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <LoadingScreen />
  if (!crate) return (
    <div className="p-4 text-center pt-16">
      <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
      <p className="text-slate-400">Caisse introuvable</p>
      <Button onClick={() => navigate(-1)} variant="ghost" className="mt-4">Retour</Button>
    </div>
  )

  const infoItems = [
    { label: 'N° Caisse', value: crate.crate_number, icon: Package },
    { label: 'QR Code', value: crate.qr_code, icon: QrCode },
    { label: 'Type panneau', value: PANEL_TYPES[crate.panel_type], icon: Package },
    { label: 'Zone chantier', value: crate.site_zone, icon: MapPin },
    { label: 'Étage', value: `Étage ${crate.floor}`, icon: TrendingUp },
    { label: 'Emplacement', value: crate.location, icon: MapPin },
    { label: 'Dernier utilisateur', value: crate.last_user_name || 'N/A', icon: User },
    { label: 'Mis à jour le', value: format(new Date(crate.updated_at), 'dd MMM yyyy à HH:mm', { locale: fr }), icon: Calendar }
  ]

  return (
    <div className="p-4 pt-5 flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-white truncate">{crate.crate_number}</h1>
          <p className="text-slate-400 text-sm font-mono">{crate.qr_code}</p>
        </div>
        <StatusBadge status={crate.status} />
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-3xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-amber-400/70 text-sm font-medium">Position actuelle</p>
            <p className="text-2xl font-black text-white mt-1">Étage {crate.floor}</p>
            <p className="text-slate-300 font-medium">{crate.location}</p>
            <p className="text-slate-500 text-sm mt-1">{crate.site_zone}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <Package className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        {crate.description && (
          <p className="text-slate-400 text-sm mt-3 pt-3 border-t border-amber-500/10">{crate.description}</p>
        )}
      </div>

      {/* Edit button */}
      {canEdit() && (
        <Button
          size="lg"
          variant="secondary"
          icon={<Edit className="w-5 h-5" />}
          onClick={() => setEditModal(true)}
          fullWidth
        >
          Modifier l'emplacement / statut
        </Button>
      )}

      {/* Info grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Informations</h2>
        <Card>
          <div className="flex flex-col gap-0">
            {infoItems.map((item, i) => (
              <div key={i} className={`flex items-center justify-between py-3 ${i < infoItems.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400 text-sm">{item.label}</span>
                </div>
                <span className="text-white font-medium text-sm text-right max-w-[180px] truncate">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Movement history */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Historique des déplacements ({movements.length})
        </h2>

        {movements.length === 0 ? (
          <Card>
            <p className="text-slate-500 text-sm text-center py-2">Aucun mouvement enregistré</p>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

            <div className="flex flex-col gap-3 pl-12 relative">
              {movements.map((m, i) => (
                <div key={m.id} className="relative animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  {/* Dot */}
                  <div className="absolute -left-9 top-1.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-slate-900" />

                  <Card padding="sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {m.old_floor && m.old_floor !== m.new_floor && (
                            <span className="text-slate-300 text-sm font-medium">
                              Ét. {m.old_floor} → {m.new_floor}
                            </span>
                          )}
                          {m.old_status && m.old_status !== m.new_status && (
                            <span className="text-slate-300 text-sm">
                              {STATUS_LABELS[m.old_status]} → {STATUS_LABELS[m.new_status]}
                            </span>
                          )}
                          {!m.old_floor && <span className="text-emerald-400 text-sm font-medium">Création</span>}
                        </div>
                        {m.old_location && m.old_location !== m.new_location && (
                          <p className="text-slate-500 text-xs mt-0.5">{m.old_location} → {m.new_location}</p>
                        )}
                        {m.notes && (
                          <p className="text-slate-400 text-xs mt-1 italic">"{m.notes}"</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-500 text-xs">{m.user_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-xs shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(m.created_at), { locale: fr, addSuffix: true })}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Modifier la caisse">
        <CrateForm
          crate={crate}
          onSuccess={(updated) => {
            setCrate(updated)
            setEditModal(false)
            getMovementsForCrate(crate.id).then(setMovements)
          }}
          onCancel={() => setEditModal(false)}
        />
      </Modal>
    </div>
  )
}
