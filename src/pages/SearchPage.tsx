import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, X, Filter, MapPin, ArrowRight, Plus } from 'lucide-react'
import { useCratesStore } from '@/stores/cratesStore'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'
import CrateForm from '@/components/crate/CrateForm'
import type { CrateStatus, PanelType } from '@/types/database'
import { STATUS_LABELS, PANEL_TYPES } from '@/types/database'
import type { Crate } from '@/types/database'

export default function SearchPage() {
  const navigate = useNavigate()
  const { crates, searchCrates, filters, setFilters } = useCratesStore()
  const { canEdit } = useAuthStore()

  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [createModal, setCreateModal] = useState(false)

  const results = useMemo(() => searchCrates(query), [query, crates, filters])

  const hasFilters = Object.values(filters).some(Boolean)
  const zones = [...new Set(crates.map(c => c.site_zone))].sort()

  return (
    <div className="p-4 pt-5 flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Recherche</h1>
          <p className="text-slate-400 text-sm">{crates.length} caisses enregistrées</p>
        </div>
        {canEdit() && (
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setCreateModal(true)}>
            Créer
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="search"
          placeholder="Numéro, QR, panneau, emplacement…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 rounded-2xl text-white placeholder-slate-500 pl-12 pr-12 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors"
          autoFocus
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            hasFilters ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filtres {hasFilters && `(${Object.values(filters).filter(Boolean).length})`}
        </button>

        {/* Quick status filters */}
        {(['stored', 'in_use', 'maintenance', 'missing'] as CrateStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilters({ ...filters, status: filters.status === s ? undefined : s })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filters.status === s ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}

        {hasFilters && (
          <button onClick={() => setFilters({})} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
            <X className="w-3 h-3" /> Effacer
          </button>
        )}
      </div>

      {/* Extended filters */}
      {showFilters && (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Type panneau</label>
              <select
                value={filters.panel_type || ''}
                onChange={e => setFilters({ ...filters, panel_type: e.target.value as PanelType || undefined })}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl text-white text-sm py-2 px-3 focus:outline-none"
              >
                <option value="">Tous</option>
                {Object.entries(PANEL_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Zone</label>
              <select
                value={filters.zone || ''}
                onChange={e => setFilters({ ...filters, zone: e.target.value || undefined })}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl text-white text-sm py-2 px-3 focus:outline-none"
              >
                <option value="">Toutes</option>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Étage (1-44)</label>
              <input
                type="number" min="1" max="44"
                value={filters.floor || ''}
                onChange={e => setFilters({ ...filters, floor: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl text-white text-sm py-2 px-3 focus:outline-none"
                placeholder="Tous les étages"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      <div>
        <p className="text-slate-500 text-sm mb-3">
          {results.length} résultat{results.length !== 1 ? 's' : ''} {query && `pour "${query}"`}
        </p>

        {results.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Aucune caisse trouvée</p>
            <p className="text-slate-600 text-sm mt-1">Modifiez votre recherche ou les filtres</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {results.map(crate => (
              <CrateRow key={crate.id} crate={crate} onClick={() => navigate(`/crate/${crate.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Nouvelle caisse">
        <CrateForm
          onSuccess={(crate) => {
            setCreateModal(false)
            navigate(`/crate/${crate.id}`)
          }}
          onCancel={() => setCreateModal(false)}
        />
      </Modal>
    </div>
  )
}

function CrateRow({ crate, onClick }: { crate: Crate; onClick: () => void }) {
  return (
    <Card hover onClick={onClick} padding="sm">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-white">{crate.crate_number}</p>
            <StatusBadge status={crate.status} size="sm" />
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" />Ét. {crate.floor} · {crate.location}
            </span>
            <span className="text-slate-600 text-xs">{crate.site_zone}</span>
          </div>
          {crate.description && (
            <p className="text-slate-500 text-xs mt-0.5 truncate">{crate.description}</p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
      </div>
    </Card>
  )
}
