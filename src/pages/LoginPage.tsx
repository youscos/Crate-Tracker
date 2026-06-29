import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Eye, EyeOff, Lock, Mail, Package, User } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

type Mode = 'login' | 'register' | 'reset'

export default function LoginPage() {
  const { user } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('login')

  if (user) return <Navigate to="/dashboard" replace />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Renseignez vos identifiants')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error(error.message === 'Invalid login credentials' ? 'Identifiants incorrects' : error.message)
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !fullName) return toast.error('Tous les champs sont obligatoires')
    if (password.length < 6) return toast.error('Le mot de passe doit faire au moins 6 caractères')
    if (password !== confirmPassword) return toast.error('Les mots de passe ne correspondent pas')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) {
      toast.error(error.message === 'User already registered' ? 'Cet email est déjà utilisé' : error.message)
    } else {
      toast.success('Compte créé ! Vous pouvez vous connecter.')
      setMode('login')
      setPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return toast.error('Renseignez votre email')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile`
    })
    if (error) toast.error(error.message)
    else { toast.success('Email de réinitialisation envoyé'); setMode('login') }
    setLoading(false)
  }

  const titles: Record<Mode, string> = {
    login: 'Connexion',
    register: 'Créer un compte',
    reset: 'Mot de passe oublié'
  }

  const handleSubmit = mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleReset

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-amber-500 mx-auto flex items-center justify-center mb-4 shadow-xl shadow-amber-500/30">
            <Package className="w-10 h-10 text-slate-900" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">CrateTracker</h1>
          <p className="text-slate-400 mt-1 text-sm">Suivi de caisses chantier</p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl backdrop-blur">
          <h2 className="text-lg font-bold text-white mb-5">{titles[mode]}</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <Input label="Nom complet" type="text" placeholder="Jean Dupont"
                value={fullName} onChange={e => setFullName(e.target.value)}
                icon={<User className="w-4 h-4" />} autoComplete="name" required />
            )}

            <Input label="Email" type="email" placeholder="vous@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />} autoComplete="email" required />

            {mode !== 'reset' && (
              <Input label="Mot de passe" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                suffix={
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-slate-400 hover:text-white transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required />
            )}

            {mode === 'register' && (
              <Input label="Confirmer le mot de passe" type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />} autoComplete="new-password" required />
            )}

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              {mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Créer mon compte' : 'Envoyer le lien'}
            </Button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-2">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('register')} className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">
                  Pas encore de compte ? S'inscrire
                </button>
                <button onClick={() => setMode('reset')} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  Mot de passe oublié ?
                </button>
              </>
            )}
            {mode === 'register' && (
              <button onClick={() => setMode('login')} className="text-sm text-slate-400 hover:text-white transition-colors">
                ← Déjà un compte ? Se connecter
              </button>
            )}
            {mode === 'reset' && (
              <button onClick={() => setMode('login')} className="text-sm text-slate-400 hover:text-white transition-colors">
                ← Retour à la connexion
              </button>
            )}
          </div>
        </div>

        {mode === 'register' && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
            <p className="text-amber-400/80 text-xs text-center">
              ℹ️ Les nouveaux comptes ont le rôle <strong>Viewer</strong> par défaut.<br />
              Un admin peut modifier votre rôle depuis Supabase.
            </p>
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2025 CrateTracker · Tous droits réservés
        </p>
      </div>
    </div>
  )
}