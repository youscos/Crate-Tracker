import { useState } from 'react'
import { useCratesStore } from '@/stores/cratesStore'
import { useAuthStore } from '@/stores/authStore'
import type { Crate, CrateStatus, PanelType } from '@/types/database'
import { PANEL_TYPES, STATUS_LABELS } from '@/types/database'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import toast from 'react-hot-toast'

interface Props {
  crate?: Crate | null
  defaultQR?: string
  onSuccess: (crate: Crate) => void
  onCancel: () => void
}

const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Sous-sol', 'Toiture', 'Accès', 'Stockage', 'Atelier']
const FLOORS = Array.from({ length: 44 }, (_, i) => ({ value: String(i + 1), label: `Étage ${i + 1}` }))

export default function CrateForm({ crate, defaultQR, onSuccess, onCancel }: Props) {
  const { user, profile } = useAuthStore()
  const { updateCrate, createCrate } = useCratesStore()
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')

  const [form, setForm] = useState({
    qr_code: crate?.qr_code || defaultQR || '',
    crate_number: crate?.crate_number || '',
    description: crate?.description || '',
    panel_type: crate?.panel_type || 'standard' as PanelType,
    site_zone: crate?.site_zone || 'Zone A',
    floor: String(crate?.floor || 1),
    location: crate?.location || '',
    status: crate?.status || 'stored' as CrateStatus
  })

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.crate_number || !form.location) return toast.error('Numéro et emplacement requis')
    if (!user || !profile) return toast.error('Non authentifié')

    setLoading(true)
    try {
      const data = { ...form, floor: Number(form.floor) }

      if (crate) {
        const ok = await updateCrate(crate.id, data as Partial<Crate>, user.id, profile.full_name || profile.email, notes)
        if (ok) {
          toast.success('Caisse mise à jour')
          onSuccess({ ...crate, ...data } as Crate)
        } else {
          toast.error('Erreur lors de la mise à jour')
        }
      } else {
        const created = await createCrate(data as Partial<Crate>, user.id, profile.full_name || profile.email)
        if (created) {
          toast.success('Caisse créée !')
          onSuccess(created)
        } else {
          toast.error('Erreur lors de la création')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="N° de caisse *"
          placeholder="CN-0001"
          value={form.crate_number}
          onChange={e => set('crate_number', e.target.value)}
          required
        />
        <Input
          label="QR Code"
          placeholder="CT-xxxxx"
          value={form.qr_code}
          onChange={e => set('qr_code', e.target.value)}
        />
      </div>

      <Input
        label="Description"
        placeholder="Contenu ou notes sur la caisse"
        value={form.description}
        onChange={e => set('description', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Type de panneau"
          value={form.panel_type}
          onChange={e => set('panel_type', e.target.value)}
          options={Object.entries(PANEL_TYPES).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          label="Zone chantier"
          value={form.site_zone}
          onChange={e => set('site_zone', e.target.value)}
          options={ZONES.map(z => ({ value: z, label: z }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Étage"
          value={form.floor}
          onChange={e => set('floor', e.target.value)}
          options={FLOORS}
        />
        <Select
          label="Statut"
          value={form.status}
          onChange={e => set('status', e.target.value)}
          options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
      </div>

      <Input
        label="Emplacement *"
        placeholder="Ex: Couloir B2, Palier, Local X"
        value={form.location}
        onChange={e => set('location', e.target.value)}
        required
      />

      {crate && (
        <Input
          label="Notes (optionnel)"
          placeholder="Raison du déplacement…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      )}

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>
          Annuler
        </Button>
        <Button type="submit" loading={loading} fullWidth>
          {crate ? 'Enregistrer' : 'Créer la caisse'}
        </Button>
      </div>
    </form>
  )
}
