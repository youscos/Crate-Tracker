import { useState } from 'react'
import { User, Mail, Shield, LogOut, Key, ChevronRight, Package, Activity } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCratesStore } from '@/stores/cratesStore'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const ROLE_LABELS = { admin: 'Administrateur', logistics: 'Logistique', viewer: 'Lecteur' }
const ROLE_COLORS = {
  admin: 'text-red-400 bg-red-400/10',
  logistics: 'text-amber-400 bg-amber-400/10',
  viewer: 'text-blue-400 bg-blue-400/10'
}

export default function ProfilePage() {
  const { profile, signOut } = useAuthStore()
  const { crates, movements } = useCratesStore()

  const [editName, setEditName] = useState(false)
  const [name, setName] = useState(profile?.full_name || '')
  const [savingName, setSavingName] = useState(false)
  const [resettingPwd, setResettingPwd] = useState(false)

  const myCrates = crates.filter(c => c.last_user_id === profile?.id)
  const myActions = movements.filter(m => m.user_id === profile?.id)

  const saveName = async () => {
    if (!name.trim()) return
    setSavingName(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('profiles') as any).update({ full_name: name }).eq('id', profile!.id)
    if (error) toast.error('Erreur lors de la mise à jour')
    else { toast.success('Nom mis à jour'); setEditName(false) }
    setSavingName(false)
  }

  const resetPassword = async () => {
    if (!profile?.email) return
    setResettingPwd(true)
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email)
    if (error) toast.error(error.message)
    else toast.success('Email de réinitialisation envoyé')
    setResettingPwd(false)
  }

  const handleSignOut = async () => {
    if (!confirm('Se déconnecter ?')) return
    await signOut()
  }

  if (!profile) return null

  return (
    <div className="p-4 pt-5 flex flex-col gap-5 animate-fade-in mb-8">
      {/* Profile hero */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-3xl font-black text-amber-400">
          {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="text-center">
          {editName ? (
            <div className="flex gap-2 items-center">
              <Input value={name} onChange={e => setName(e.target.value)} className="text-center" />
              <Button size="sm" loading={savingName} onClick={saveName}>OK</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditName(false)}>✕</Button>
            </div>
          ) : (
            <button onClick={() => setEditName(true)} className="group">
              <h1 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                {profile.full_name || 'Utilisateur'}
              </h1>
            </button>
          )}
          <p className="text-slate-400 text-sm">{profile.email}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ROLE_COLORS[profile.role]}`}>
          {ROLE_LABELS[profile.role]}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-2xl font-black text-white">{myCrates.length}</p>
              <p className="text-slate-500 text-xs">Caisses modifiées</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-2xl font-black text-white">{myActions.length}</p>
              <p className="text-slate-500 text-xs">Actions effectuées</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Account section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Compte</h2>
        <Card padding="none">
          <div className="flex flex-col">
            <button
              onClick={() => setEditName(true)}
              className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors rounded-t-2xl"
            >
              <User className="w-5 h-5 text-slate-400" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">Nom d'affichage</p>
                <p className="text-xs text-slate-500">{profile.full_name || 'Non défini'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <div className="border-t border-slate-700/50" />

            <div className="flex items-center gap-3 px-4 py-4">
              <Mail className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Email</p>
                <p className="text-xs text-slate-500">{profile.email}</p>
              </div>
            </div>

            <div className="border-t border-slate-700/50" />

            <div className="flex items-center gap-3 px-4 py-4">
              <Shield className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Rôle</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[profile.role]}</p>
              </div>
            </div>

            <div className="border-t border-slate-700/50" />

            <button
              onClick={resetPassword}
              className="flex items-center gap-3 px-4 py-4 hover:bg-slate-700/30 transition-colors rounded-b-2xl"
            >
              <Key className="w-5 h-5 text-slate-400" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">Réinitialiser le mot de passe</p>
                <p className="text-xs text-slate-500">Un email vous sera envoyé</p>
              </div>
              {resettingPwd ? (
                <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </Card>
      </div>

      {/* Sign out */}
      <Button
        variant="danger"
        size="lg"
        icon={<LogOut className="w-5 h-5" />}
        onClick={handleSignOut}
        fullWidth
      >
        Se déconnecter
      </Button>

      <p className="text-center text-slate-700 text-xs">
        CrateTracker v1.0.0 · © 2025 Tous droits réservés
      </p>
    </div>
  )
}
