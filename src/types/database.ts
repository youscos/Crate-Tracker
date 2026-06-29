export type UserRole = 'admin' | 'logistics' | 'viewer'
export type CrateStatus = 'stored' | 'in_use' | 'maintenance' | 'missing'
export type PanelType = 'standard' | 'reinforced' | 'insulated' | 'acoustic' | 'fire_resistant' | 'waterproof'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Crate {
  id: string
  qr_code: string
  crate_number: string
  description: string | null
  panel_type: PanelType
  site_zone: string
  floor: number
  location: string
  status: CrateStatus
  last_user_id: string | null
  last_user_name: string | null
  created_at: string
  updated_at: string
  // joined
  last_user?: Profile
}

export interface Movement {
  id: string
  crate_id: string
  old_floor: number | null
  new_floor: number
  old_location: string | null
  new_location: string
  old_status: CrateStatus | null
  new_status: CrateStatus
  user_id: string
  user_name: string
  notes: string | null
  created_at: string
  // joined
  crate?: Crate
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      crates: {
        Row: Crate
        Insert: Omit<Crate, 'id' | 'created_at' | 'updated_at' | 'last_user'>
        Update: Partial<Omit<Crate, 'id' | 'created_at' | 'last_user'>>
      }
      movements: {
        Row: Movement
        Insert: Omit<Movement, 'id' | 'created_at' | 'crate'>
        Update: Partial<Omit<Movement, 'id' | 'created_at' | 'crate'>>
      }
    }
  }
}

export const PANEL_TYPES: Record<PanelType, string> = {
  standard: 'Standard',
  reinforced: 'Renforcé',
  insulated: 'Isolé',
  acoustic: 'Acoustique',
  fire_resistant: 'Coupe-feu',
  waterproof: 'Étanche'
}

export const STATUS_LABELS: Record<CrateStatus, string> = {
  stored: 'Stockée',
  in_use: 'En utilisation',
  maintenance: 'Maintenance',
  missing: 'Manquante'
}

export const STATUS_COLORS: Record<CrateStatus, string> = {
  stored: 'text-emerald-400 bg-emerald-400/10',
  in_use: 'text-amber-400 bg-amber-400/10',
  maintenance: 'text-orange-400 bg-orange-400/10',
  missing: 'text-red-400 bg-red-400/10'
}
