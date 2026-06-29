import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, ArrowRight, AlertTriangle } from 'lucide-react'
import { useCratesStore } from '@/stores/cratesStore'
import { useAuthStore } from '@/stores/authStore'
import QRScanner from '@/components/scanner/QRScanner'
import CrateForm from '@/components/crate/CrateForm'
import Modal from '@/components/ui/Modal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Crate } from '@/types/database'
import { PANEL_TYPES } from '@/types/database'

type ScanState = 'scanning' | 'found' | 'new' | 'creating'

export default function ScanPage() {
  const navigate = useNavigate()
  const { getCrateByQR } = useCratesStore()
  const { canEdit } = useAuthStore()

  const [state, setState] = useState<ScanState>('scanning')
  const [scannedQR, setScannedQR] = useState<string | null>(null)
  const [foundCrate, setFoundCrate] = useState<Crate | null>(null)
  const [editModal, setEditModal] = useState(false)
  const [lastScanTime, setLastScanTime] = useState(0)

  const handleScan = useCallback(async (qr: string) => {
    const now = Date.now()
    if (now - lastScanTime < 2000) return // debounce
    setLastScanTime(now)

    setScannedQR(qr)

    const crate = await getCrateByQR(qr)
    if (crate) {
      setFoundCrate(crate)
      setState('found')
    } else {
      setState('new')
    }
  }, [lastScanTime, getCrateByQR])

  const reset = () => {
    setState('scanning')
    setScannedQR(null)
    setFoundCrate(null)
    setEditModal(false)
  }

  return (
    <div className="p-4 pt-5 flex flex-col gap-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-white">Scanner</h1>
        <p className="text-slate-400 text-sm">Scannez un QR code de caisse</p>
      </div>

      {/* Scanner */}
      {state === 'scanning' && (
        <QRScanner onScan={handleScan} active />
      )}

      {/* Found crate */}
      {state === 'found' && foundCrate && (
        <div className="flex flex-col gap-4 animate-slide-up">
          {/* Success indicator */}
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 font-semibold text-sm">Caisse trouvée</p>
              <p className="text-white font-bold">{foundCrate.crate_number}</p>
            </div>
            <StatusBadge status={foundCrate.status} className="ml-auto" />
          </div>

          {/* Crate details card */}
          <Card>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Type panneau</p>
                  <p className="text-white font-semibold mt-0.5">{PANEL_TYPES[foundCrate.panel_type]}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Zone</p>
                  <p className="text-white font-semibold mt-0.5">{foundCrate.site_zone}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Étage</p>
                  <p className="text-white font-semibold mt-0.5">{foundCrate.floor}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Emplacement</p>
                  <p className="text-white font-semibold mt-0.5 truncate">{foundCrate.location}</p>
                </div>
              </div>
              {foundCrate.description && (
                <div className="pt-3 border-t border-slate-700">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Description</p>
                  <p className="text-slate-300 text-sm mt-0.5">{foundCrate.description}</p>
                </div>
              )}
              {foundCrate.last_user_name && (
                <div className="pt-3 border-t border-slate-700">
                  <p className="text-slate-500 text-xs">Dernière modif par <span className="text-slate-300">{foundCrate.last_user_name}</span></p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              icon={<ArrowRight className="w-5 h-5" />}
              onClick={() => navigate(`/crate/${foundCrate.id}`)}
              fullWidth
            >
              Voir le détail complet
            </Button>
            {canEdit() && (
              <Button size="lg" variant="secondary" onClick={() => setEditModal(true)} fullWidth>
                Modifier l'emplacement / statut
              </Button>
            )}
            <Button size="md" variant="ghost" onClick={reset} fullWidth>
              Scanner un autre QR code
            </Button>
          </div>
        </div>
      )}

      {/* Unknown QR */}
      {state === 'new' && (
        <div className="flex flex-col gap-4 animate-slide-up">
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-400 font-semibold text-sm">QR code inconnu</p>
              <p className="text-slate-300 text-xs font-mono mt-0.5 truncate max-w-[200px]">{scannedQR}</p>
            </div>
          </div>

          {canEdit() ? (
            <div className="flex flex-col gap-3">
              <p className="text-slate-400 text-sm">Cette caisse n'est pas encore enregistrée. Souhaitez-vous la créer ?</p>
              <Button size="lg" icon={<Plus className="w-5 h-5" />} onClick={() => setState('creating')} fullWidth>
                Créer la caisse
              </Button>
              <Button size="md" variant="ghost" onClick={reset} fullWidth>
                Rescanner
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-slate-400 text-sm">Cette caisse n'est pas encore enregistrée. Contactez un logisticien.</p>
              <Button size="md" variant="ghost" onClick={reset} fullWidth className="mt-3">
                Rescanner
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create new crate form */}
      {state === 'creating' && (
        <div className="animate-slide-up">
          <h2 className="text-lg font-bold text-white mb-4">Nouvelle caisse</h2>
          <CrateForm
            defaultQR={scannedQR || ''}
            onSuccess={(crate) => {
              setFoundCrate(crate)
              setState('found')
            }}
            onCancel={reset}
          />
        </div>
      )}

      {/* Edit modal */}
      {foundCrate && (
        <Modal open={editModal} onClose={() => setEditModal(false)} title="Modifier la caisse">
          <CrateForm
            crate={foundCrate}
            onSuccess={(updated) => {
              setFoundCrate(updated)
              setEditModal(false)
            }}
            onCancel={() => setEditModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}
