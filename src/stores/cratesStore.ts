import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Crate, Movement, CrateStatus, PanelType } from '@/types/database'
import toast from 'react-hot-toast'

// Use any for supabase calls to avoid complex generated-type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface OfflineAction {
  id: string
  type: 'update_crate' | 'create_crate' | 'add_movement'
  payload: Record<string, unknown>
  timestamp: number
}

interface CratesState {
  crates: Crate[]
  movements: Movement[]
  loading: boolean
  syncing: boolean
  isOnline: boolean
  offlineQueue: OfflineAction[]
  searchQuery: string
  filters: { status?: CrateStatus; panel_type?: PanelType; floor?: number; zone?: string }

  setOnline: (v: boolean) => void
  fetchCrates: () => Promise<void>
  fetchMovements: (limit?: number) => Promise<void>
  getCrateByQR: (qr: string) => Promise<Crate | null>
  getCrateById: (id: string) => Promise<Crate | null>
  createCrate: (data: Partial<Crate>, userId: string, userName: string) => Promise<Crate | null>
  updateCrate: (id: string, data: Partial<Crate>, userId: string, userName: string, notes?: string) => Promise<boolean>
  searchCrates: (query: string) => Crate[]
  setSearchQuery: (q: string) => void
  setFilters: (f: CratesState['filters']) => void
  syncOfflineQueue: () => Promise<void>
  getMovementsForCrate: (crateId: string) => Promise<Movement[]>
}

const logMovement = async (payload: Record<string, unknown>) => {
  await db.from('movements').insert(payload)
}

export const useCratesStore = create<CratesState>((set, get) => ({
  crates: [],
  movements: [],
  loading: false,
  syncing: false,
  isOnline: navigator.onLine,
  offlineQueue: [],
  searchQuery: '',
  filters: {},

  setOnline: (isOnline) => {
    set({ isOnline })
    if (isOnline) get().syncOfflineQueue()
  },

  fetchCrates: async () => {
    set({ loading: true })
    try {
      const { data, error } = await db.from('crates').select('*').order('updated_at', { ascending: false })
      if (error) throw error
      set({ crates: (data as Crate[]) || [] })
    } catch (err) {
      console.error('fetchCrates error:', err)
    } finally {
      set({ loading: false })
    }
  },

  fetchMovements: async (limit = 50) => {
    try {
      const { data, error } = await db
        .from('movements')
        .select('*, crate:crates(crate_number, qr_code)')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      set({ movements: (data as Movement[]) || [] })
    } catch (err) {
      console.error('fetchMovements error:', err)
    }
  },

  getCrateByQR: async (qr: string) => {
    const local = get().crates.find(c => c.qr_code === qr)
    if (local) return local
    try {
      const { data, error } = await db.from('crates').select('*').eq('qr_code', qr).single()
      if (error) return null
      return data as Crate
    } catch { return null }
  },

  getCrateById: async (id: string) => {
    const local = get().crates.find(c => c.id === id)
    if (local) return local
    try {
      const { data, error } = await db.from('crates').select('*').eq('id', id).single()
      if (error) return null
      return data as Crate
    } catch { return null }
  },

  createCrate: async (data, userId, userName) => {
    const qrCode = data.qr_code || `CT-${Date.now()}`
    const crateNumber = data.crate_number || `CN-${Math.floor(Math.random() * 9000) + 1000}`

    const newCrate = {
      qr_code: qrCode,
      crate_number: crateNumber,
      description: data.description || null,
      panel_type: data.panel_type || 'standard',
      site_zone: data.site_zone || 'Zone A',
      floor: data.floor || 1,
      location: data.location || 'Non défini',
      status: data.status || 'stored',
      last_user_id: userId,
      last_user_name: userName,
    }

    try {
      const { data: created, error } = await db.from('crates').insert(newCrate).select().single()
      if (error) throw error
      const c = created as Crate

      await logMovement({
        crate_id: c.id,
        old_floor: null,
        new_floor: c.floor,
        old_location: null,
        new_location: c.location,
        old_status: null,
        new_status: c.status,
        user_id: userId,
        user_name: userName,
        notes: 'Création de la caisse',
      })

      set(state => ({ crates: [c, ...state.crates] }))
      return c
    } catch (err) {
      console.error('createCrate error:', err)
      return null
    }
  },

  updateCrate: async (id, data, userId, userName, notes) => {
    const existing = get().crates.find(c => c.id === id)
    if (!existing) return false

    const update = { ...data, last_user_id: userId, last_user_name: userName, updated_at: new Date().toISOString() }

    if (!get().isOnline) {
      const action: OfflineAction = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'update_crate',
        payload: { id, data: update, userId, userName, notes, existing },
        timestamp: Date.now(),
      }
      set(state => ({
        offlineQueue: [...state.offlineQueue, action],
        crates: state.crates.map(c => c.id === id ? { ...c, ...update } : c),
      }))
      toast('Action mise en file hors-ligne', { icon: '📴' })
      return true
    }

    try {
      const { error } = await db.from('crates').update(update).eq('id', id)
      if (error) throw error

      await logMovement({
        crate_id: id,
        old_floor: existing.floor,
        new_floor: data.floor ?? existing.floor,
        old_location: existing.location,
        new_location: data.location ?? existing.location,
        old_status: existing.status,
        new_status: data.status ?? existing.status,
        user_id: userId,
        user_name: userName,
        notes: notes || null,
      })

      set(state => ({
        crates: state.crates.map(c => c.id === id ? { ...c, ...update } : c),
      }))
      return true
    } catch (err) {
      console.error('updateCrate error:', err)
      return false
    }
  },

  searchCrates: (query: string) => {
    const { crates, filters } = get()
    const q = query.toLowerCase().trim()

    return crates.filter(c => {
      const matchQuery = !q || [
        c.qr_code, c.crate_number, c.description,
        c.panel_type, c.site_zone, c.location,
        String(c.floor), c.status, c.last_user_name,
      ].some(v => v?.toLowerCase().includes(q))

      const matchStatus = !filters.status || c.status === filters.status
      const matchPanel = !filters.panel_type || c.panel_type === filters.panel_type
      const matchFloor = !filters.floor || c.floor === filters.floor
      const matchZone = !filters.zone || c.site_zone.toLowerCase().includes(filters.zone.toLowerCase())

      return matchQuery && matchStatus && matchPanel && matchFloor && matchZone
    })
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilters: (filters) => set({ filters }),

  getMovementsForCrate: async (crateId: string) => {
    try {
      const { data, error } = await db
        .from('movements').select('*').eq('crate_id', crateId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as Movement[]) || []
    } catch { return [] }
  },

  syncOfflineQueue: async () => {
    const { offlineQueue } = get()
    if (offlineQueue.length === 0) return

    set({ syncing: true })
    const failed: OfflineAction[] = []

    for (const action of offlineQueue) {
      try {
        if (action.type === 'update_crate') {
          const { id, data, userId, userName, notes, existing } = action.payload as {
            id: string; data: Partial<Crate>; userId: string; userName: string; notes: string; existing: Crate
          }
          const { error } = await db.from('crates').update(data).eq('id', id)
          if (!error) {
            await logMovement({
              crate_id: id,
              old_floor: existing.floor,
              new_floor: data.floor ?? existing.floor,
              old_location: existing.location,
              new_location: data.location ?? existing.location,
              old_status: existing.status,
              new_status: data.status ?? existing.status,
              user_id: userId,
              user_name: userName,
              notes: notes || 'Synchronisation hors-ligne',
            })
          } else {
            failed.push(action)
          }
        }
      } catch { failed.push(action) }
    }

    set({ offlineQueue: failed, syncing: false })
    if (failed.length === 0 && offlineQueue.length > 0) {
      toast.success(`${offlineQueue.length} action(s) synchronisée(s)`)
    }
  },
}))
